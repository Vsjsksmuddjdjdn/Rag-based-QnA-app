import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ChatMessage, ChatSettings, Citation } from "../types";

const defaultSettings: ChatSettings = {
  model: "gpt-4o-mini",
  temperature: 0.2,
  topK: 5,
  retrievalMode: "similarity",
  showContext: true,
  stream: true
};

export function useChat(collectionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<ChatSettings>(defaultSettings);
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const [activeContext, setActiveContext] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const refreshHistory = useCallback(async () => {
    if (!collectionId) {
      setMessages([]);
      return;
    }

    try {
      setMessages(await api.getChatHistory(collectionId));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chat history.");
    }
  }, [collectionId]);

  useEffect(() => {
    void refreshHistory();
    setActiveCitations([]);
    setActiveContext([]);
  }, [refreshHistory]);

  const ask = async (message: string) => {
    if (!collectionId || !message.trim()) return;

    const userMessage: ChatMessage = {
      id: `local_user_${Date.now()}`,
      collectionId,
      role: "user",
      content: message,
      createdAt: new Date().toISOString()
    };
    const assistantMessage: ChatMessage = {
      id: `local_assistant_${Date.now()}`,
      collectionId,
      role: "assistant",
      content: "",
      citations: [],
      createdAt: new Date().toISOString(),
      pending: true
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setLoading(true);
    setError("");

    const finish = (answer: string, citations: Citation[], context?: Citation[]) => {
      setActiveCitations(citations);
      setActiveContext(context ?? []);
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessage.id
            ? {
                ...item,
                content: answer,
                citations,
                retrievedContext: context,
                pending: false
              }
            : item
        )
      );
      setLoading(false);
    };

    if (settings.stream) {
      let streamed = "";
      await api.streamChat({
        collectionId,
        message,
        settings,
        onToken: (token) => {
          streamed += token;
          setMessages((current) =>
            current.map((item) =>
              item.id === assistantMessage.id ? { ...item, content: streamed } : item
            )
          );
        },
        onDone: (response) => {
          finish(response.answer || streamed, response.citations, response.retrievedContext);
        },
        onError: (message) => {
          setError(message);
          setMessages((current) =>
            current.map((item) =>
              item.id === assistantMessage.id
                ? { ...item, content: message, pending: false, error: true }
                : item
            )
          );
          setLoading(false);
        }
      });
      return;
    }

    try {
      const response = await api.chat({ collectionId, message, settings });
      finish(response.answer, response.citations, response.retrievedContext);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chat request failed.";
      setError(message);
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessage.id
            ? { ...item, content: message, pending: false, error: true }
            : item
        )
      );
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!collectionId) return;
    await api.clearChatHistory(collectionId);
    setMessages([]);
    setActiveCitations([]);
    setActiveContext([]);
  };

  return {
    messages,
    settings,
    setSettings,
    activeCitations,
    setActiveCitations,
    activeContext,
    loading,
    error,
    ask,
    clearHistory,
    refreshHistory
  };
}
