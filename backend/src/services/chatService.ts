import type { BaseMessageLike } from "@langchain/core/messages";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import { AppError } from "../middleware/errors.js";
import { embeddingProvider } from "../rag/embeddings.js";
import { chatProvider } from "../rag/llm.js";
import { buildGroundedPrompt } from "../rag/prompt.js";
import { vectorStore, type RetrievedChunk } from "../rag/vectorStore.js";
import { store } from "../storage/index.js";
import type { ChatMessageRecord, Citation, RetrievalMode } from "../types/domain.js";
import { createId, nowIso } from "../utils/ids.js";
import { makeSnippet } from "../utils/snippets.js";
import { collectionService } from "./collectionService.js";

export interface ChatInput {
  collectionId: string;
  message: string;
  topK?: number;
  retrievalMode?: RetrievalMode;
  temperature?: number;
  model?: string;
  showContext?: boolean;
}

export interface ChatResult {
  answer: string;
  citations: Citation[];
  retrievedContext?: Citation[];
}

export class ChatService {
  async answer(input: ChatInput, onToken?: (token: string) => void): Promise<ChatResult> {
    await collectionService.requireCollection(input.collectionId);

    const readyDocs = await store.getReadyDocuments(input.collectionId);
    if (!readyDocs.length) {
      const answer =
        "I do not know yet because this collection has no indexed documents. Upload and index documents first.";
      await this.saveExchange(input.collectionId, input.message, answer, []);
      if (onToken) onToken(answer);
      return { answer, citations: [], retrievedContext: [] };
    }

    const topK = clampTopK(input.topK ?? config.retrieval.defaultTopK);
    const queryEmbedding = await embeddingProvider.embedQuery(input.message);
    const retrieved = await vectorStore.query({
      collectionId: input.collectionId,
      queryEmbedding,
      topK,
      retrievalMode: input.retrievalMode ?? "similarity"
    });

    const relevant = retrieved.filter(
      (chunk) => (chunk.score ?? 1) >= config.retrieval.minRelevanceScore
    );

    logger.info(
      {
        collectionId: input.collectionId,
        topK,
        retrievalMode: input.retrievalMode ?? "similarity",
        selectedChunks: relevant.map((chunk) => ({
          chunkId: chunk.chunkId,
          sourceFile: chunk.sourceFile,
          score: chunk.score,
          pageNumber: chunk.pageNumber
        }))
      },
      "Selected retrieval chunks"
    );

    if (!relevant.length) {
      const answer = "I do not know. I could not find relevant context in the uploaded documents.";
      await this.saveExchange(input.collectionId, input.message, answer, []);
      if (onToken) onToken(answer);
      return { answer, citations: [], retrievedContext: [] };
    }

    const citations = this.toCitations(relevant);
    const limitedCitations = fitContextBudget(citations);
    const prompt = buildGroundedPrompt(input.message, limitedCitations);
    const messages: BaseMessageLike[] = [
      ["system", prompt.system],
      ["user", prompt.user]
    ];

    try {
      const answer = await chatProvider.generate(
        messages,
        {
          model: input.model,
          temperature: input.temperature
        },
        onToken
      );

      await this.saveExchange(
        input.collectionId,
        input.message,
        answer,
        limitedCitations,
        input.showContext ? citations : undefined
      );

      return {
        answer,
        citations: limitedCitations,
        retrievedContext: input.showContext ? citations : undefined
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error }, "LLM answer generation failed");
      throw new AppError(
        502,
        "The LLM provider failed while generating the answer.",
        "LLM_PROVIDER_FAILED"
      );
    }
  }

  async history(collectionId: string) {
    await collectionService.requireCollection(collectionId);
    return store.getChatHistory(collectionId);
  }

  async clearHistory(collectionId: string) {
    await collectionService.requireCollection(collectionId);
    return store.clearChatHistory(collectionId);
  }

  private toCitations(chunks: RetrievedChunk[]): Citation[] {
    return chunks.map((chunk, index) => ({
      id: `S${index + 1}`,
      documentId: chunk.documentId,
      chunkId: chunk.chunkId,
      filename: chunk.sourceFile,
      pageNumber: chunk.pageNumber,
      sectionHeading: chunk.sectionHeading,
      snippet: makeSnippet(chunk.text),
      score: chunk.score
    }));
  }

  private async saveExchange(
    collectionId: string,
    userMessage: string,
    answer: string,
    citations: Citation[],
    retrievedContext?: Citation[]
  ) {
    const createdAt = nowIso();
    const messages: ChatMessageRecord[] = [
      {
        id: createId("msg"),
        collectionId,
        role: "user",
        content: userMessage,
        createdAt
      },
      {
        id: createId("msg"),
        collectionId,
        role: "assistant",
        content: answer,
        citations,
        retrievedContext,
        createdAt: nowIso()
      }
    ];
    await store.addChatMessages(messages);
  }
}

export const chatService = new ChatService();

function clampTopK(value: number) {
  if (!Number.isFinite(value)) return config.retrieval.defaultTopK;
  return Math.max(1, Math.min(12, Math.floor(value)));
}

function fitContextBudget(citations: Citation[]) {
  const selected: Citation[] = [];
  let used = 0;

  for (const citation of citations) {
    const next = citation.snippet.length;
    if (used + next > config.retrieval.maxContextChars && selected.length) break;
    selected.push(citation);
    used += next;
  }

  return selected;
}
