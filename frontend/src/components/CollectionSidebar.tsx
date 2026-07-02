import { FormEvent, useState } from "react";
import clsx from "clsx";
import { Database, FolderPlus, Library, Loader2, MessageSquareText } from "lucide-react";
import type { Collection } from "../types";

interface CollectionSidebarProps {
  collections: Collection[];
  selectedCollectionId: string;
  loading: boolean;
  error?: string;
  onSelect: (collectionId: string) => void;
  onCreate: (name: string, description?: string) => Promise<unknown>;
}

export function CollectionSidebar({
  collections,
  selectedCollectionId,
  loading,
  error,
  onSelect,
  onCreate
}: CollectionSidebarProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await onCreate(name, description);
      setName("");
      setDescription("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-600 p-2 text-white shadow-sm shadow-teal-800/20">
            <Library className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-950 dark:text-white">RAG Workspace</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Documents to answers</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          New collection
        </label>
        <div className="mt-2 space-y-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Research papers"
            className="field"
            maxLength={80}
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional description"
            className="field"
            maxLength={240}
          />
          <button
            type="submit"
            disabled={creating || name.trim().length < 2}
            className="action-button w-full justify-center"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
            Create
          </button>
        </div>
      </form>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Collections
          </span>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-400" /> : null}
        </div>

        {error ? <div className="mb-3 rounded-md bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</div> : null}

        <div className="space-y-2 overflow-y-auto pr-1">
          {collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => onSelect(collection.id)}
              className={clsx(
                "w-full rounded-lg border p-3 text-left transition hover:-translate-y-0.5",
                selectedCollectionId === collection.id
                  ? "border-teal-500 bg-white shadow-glow dark:bg-zinc-900"
                  : "border-zinc-200 bg-white/70 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
              )}
            >
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-4 w-4 text-teal-600 dark:text-teal-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">{collection.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {collection.description || "No description"}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="rounded-md bg-zinc-100 py-1 dark:bg-zinc-800">{collection.documentCount} docs</span>
                    <span className="rounded-md bg-zinc-100 py-1 dark:bg-zinc-800">{collection.chunkCount} chunks</span>
                    <span className="rounded-md bg-zinc-100 py-1 dark:bg-zinc-800">{collection.readyDocumentCount} ready</span>
                  </div>
                </div>
              </div>
            </button>
          ))}

          {!collections.length && !loading ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <MessageSquareText className="mx-auto mb-2 h-5 w-5" />
              Create a collection to begin.
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
