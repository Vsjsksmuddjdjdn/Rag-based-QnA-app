import { BookOpenCheck, ExternalLink } from "lucide-react";
import type { Citation } from "../types";

interface CitationDrawerProps {
  citations: Citation[];
  context: Citation[];
  showContext: boolean;
}

export function CitationDrawer({ citations, context, showContext }: CitationDrawerProps) {
  const items = showContext && context.length ? context : citations;

  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-teal-600 dark:text-teal-300" />
          <h2 className="text-sm font-bold text-zinc-950 dark:text-white">
            {showContext ? "Retrieved context" : "Citations"}
          </h2>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {items.map((citation) => (
          <article
            key={`${citation.id}-${citation.chunkId}`}
            className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                  {citation.id} · {citation.filename}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {citation.pageNumber ? `Page ${citation.pageNumber}` : "Page unavailable"}
                  {citation.score ? ` · score ${citation.score.toFixed(2)}` : ""}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400" />
            </div>
            {citation.sectionHeading ? (
              <p className="mb-2 text-xs font-medium text-teal-700 dark:text-teal-300">
                {citation.sectionHeading}
              </p>
            ) : null}
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">{citation.snippet}</p>
          </article>
        ))}

        {!items.length ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-5 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Citations from the latest answer will appear here.
          </div>
        ) : null}
      </div>
    </section>
  );
}
