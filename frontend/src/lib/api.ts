import axios from "axios";
import type {
  ChatMessage,
  ChatSettings,
  Citation,
  Collection,
  DocumentRecord,
  UploadResult
} from "../types";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000
});

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  retrievedContext?: Citation[];
}

export const api = {
  async health() {
    const { data } = await http.get("/api/health");
    return data as { ok: boolean; vector: { ok: boolean; provider: string; message?: string } };
  },

  async listCollections() {
    const { data } = await http.get("/api/collections");
    return data.collections as Collection[];
  },

  async createCollection(input: { name: string; description?: string }) {
    const { data } = await http.post("/api/collections", input);
    return data.collection as Collection;
  },

  async listDocuments(collectionId?: string) {
    const { data } = await http.get("/api/documents", {
      params: collectionId ? { collectionId } : undefined
    });
    return data.documents as DocumentRecord[];
  },

  async deleteDocument(documentId: string) {
    const { data } = await http.delete(`/api/documents/${documentId}`);
    return data.document as DocumentRecord;
  },

  async reindexDocument(documentId: string) {
    const { data } = await http.post(`/api/documents/${documentId}/reindex`);
    return data.document as DocumentRecord;
  },

  async getChunks(documentId: string) {
    const { data } = await http.get(`/api/documents/${documentId}/chunks`);
    return data.chunks as Array<{ id: string; text: string; pageNumber?: number; sectionHeading?: string }>;
  },

  async uploadDocuments(
    collectionId: string,
    files: File[],
    onProgress?: (progress: number) => void
  ) {
    const form = new FormData();
    form.append("collectionId", collectionId);
    files.forEach((file) => form.append("documents", file));

    const { data } = await http.post("/api/documents/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      validateStatus: (status) => status >= 200 && status < 500,
      onUploadProgress: (event) => {
        if (!event.total) return;
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });

    if (data.error) throw new Error(data.error.message);
    return data as { results: UploadResult[]; successCount: number; failureCount: number };
  },

  async chat(input: {
    collectionId: string;
    message: string;
    settings: ChatSettings;
  }) {
    const { data } = await http.post("/api/chat", {
      collectionId: input.collectionId,
      message: input.message,
      topK: input.settings.topK,
      temperature: input.settings.temperature,
      model: input.settings.model,
      retrievalMode: input.settings.retrievalMode,
      showContext: input.settings.showContext,
      stream: false
    });
    return data as ChatResponse;
  },

  async streamChat(input: {
    collectionId: string;
    message: string;
    settings: ChatSettings;
    onToken: (token: string) => void;
    onDone: (response: ChatResponse) => void;
    onError: (message: string) => void;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collectionId: input.collectionId,
        message: input.message,
        topK: input.settings.topK,
        temperature: input.settings.temperature,
        model: input.settings.model,
        retrievalMode: input.settings.retrievalMode,
        showContext: input.settings.showContext,
        stream: true
      })
    });

    if (!response.ok || !response.body) {
      const message = await safeErrorMessage(response);
      input.onError(message);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const event = parseSse(part);
        if (!event) continue;
        if (event.event === "token") input.onToken(String(event.data.token ?? ""));
        if (event.event === "done") input.onDone(event.data as ChatResponse);
        if (event.event === "error") input.onError(String(event.data.message ?? "Chat failed."));
      }
    }
  },

  async getChatHistory(collectionId: string) {
    const { data } = await http.get(`/api/chat/history/${collectionId}`);
    return data.messages as ChatMessage[];
  },

  async clearChatHistory(collectionId: string) {
    const { data } = await http.delete(`/api/chat/history/${collectionId}`);
    return data.removed as number;
  }
};

function parseSse(block: string) {
  const eventLine = block.split("\n").find((line) => line.startsWith("event:"));
  const dataLine = block.split("\n").find((line) => line.startsWith("data:"));
  if (!eventLine || !dataLine) return null;

  return {
    event: eventLine.replace("event:", "").trim(),
    data: JSON.parse(dataLine.replace("data:", "").trim())
  };
}

async function safeErrorMessage(response: Response) {
  try {
    const data = await response.json();
    return data.error?.message ?? "Request failed.";
  } catch {
    return "Network request failed.";
  }
}
