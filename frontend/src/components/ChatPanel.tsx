import { FormEvent, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Bot, Eraser, Loader2, Send, Sparkles, UserRound } from "lucide-react";
import type { ChatMessage } from "../types";
import { EmptyState } from "./EmptyState";

interface ChatPanelProps {
  collectionName?: string;
  messages: ChatMessage[];
  loading: boolean;
  error?: string;
  disabled?: boolean;
  onAsk: (message: string) => Promise<void>;
  onClear: () => Promise<void>;
  onSelectCitations: (message: ChatMessage) => void;
}

export function ChatPanel({
  collectionName,
  messages,
  loading,
  error,
  disabled,
  onAsk,
  onClear,
  onSelectCitations
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || loading || disabled) return;
    const message = draft.trim();
    setDraft("");
    await onAsk(message);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h1 className="truncate text-base font-bold text-zinc-950 dark:text-white">
              {collectionName || "Document Chat"}
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Answers are grounded in indexed chunks and returned with sources.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onClear()}
          disabled={!messages.length}
          className="icon-button"
          title="Clear chat history"
          aria-label="Clear chat history"
        >
          <Eraser className="h-5 w-5" />
        </button>
      </div>

      <div ref={scrollerRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-zinc-50/70 p-4 dark:bg-zinc-950/40">
        {!messages.length ? (
          <EmptyState
            title="Ask a source-grounded question"
            description="Upload documents, then ask for summaries, comparisons, definitions, policies, or page-specific facts."
          />
        ) : null}

        {messages.map((message) => (
          <button
            key={message.id}
            type="button"
            onClick={() => message.role === "assistant" && onSelectCitations(message)}
            className={clsx(
              "flex w-full gap-3 text-left animate-floatIn",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" ? (
              <span className="mt-1 rounded-lg bg-teal-600 p-2 text-white">
                <Bot className="h-4 w-4" />
              </span>
            ) : null}
            <span
              className={clsx(
                "max-w-[82%] rounded-lg border px-4 py-3 text-sm leading-6 shadow-sm",
                message.role === "user"
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-950"
                  : message.error
                    ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100"
                    : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              )}
            >
              <span className="whitespace-pre-wrap">{message.content || "Thinking..."}</span>
              {message.pending ? (
                <span className="mt-3 block h-1 w-24 origin-left rounded-full bg-teal-500 animate-pulseLine" />
              ) : null}
              {message.role === "assistant" && message.citations?.length ? (
                <span className="mt-3 flex flex-wrap gap-2">
                  {message.citations.map((citation) => (
                    <span
                      key={citation.chunkId}
                      className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:ring-teal-800"
                    >
                      {citation.id}
                    </span>
                  ))}
                </span>
              ) : null}
            </span>
            {message.role === "user" ? (
              <span className="mt-1 rounded-lg bg-zinc-200 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                <UserRound className="h-4 w-4" />
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {error ? (
        <div className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100">
          {error}
        </div>
      ) : null}

      <form onSubmit={submit} className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-end gap-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask a question about the selected collection..."
            disabled={disabled}
            className="field min-h-[52px] resize-none"
            rows={2}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            disabled={disabled || loading || !draft.trim()}
            className="action-button h-[52px] px-4"
            title="Send question"
            aria-label="Send question"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </section>
  );
}
