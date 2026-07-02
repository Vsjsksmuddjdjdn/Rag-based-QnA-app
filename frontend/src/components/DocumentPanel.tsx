import { FileText, RefreshCw, Trash2 } from "lucide-react";
import type { DocumentRecord } from "../types";
import { StatusBadge } from "./StatusBadge";
import { UploadDropzone } from "./UploadDropzone";
import type { UploadResult } from "../types";

interface DocumentPanelProps {
  documents: DocumentRecord[];
  loading: boolean;
  disabled?: boolean;
  uploadProgress: number | null;
  uploadResults: UploadResult[];
  error?: string;
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  onReindex: (documentId: string) => Promise<void>;
}

export function DocumentPanel({
  documents,
  loading,
  disabled,
  uploadProgress,
  uploadResults,
  error,
  onUpload,
  onDelete,
  onReindex
}: DocumentPanelProps) {
  return (
    <section className="flex min-h-0 flex-col gap-4">
      <UploadDropzone
        disabled={disabled}
        uploadProgress={uploadProgress}
        uploadResults={uploadResults}
        onUpload={onUpload}
      />

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-950 dark:text-white">Documents</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {loading ? "Loading..." : `${documents.length} total`}
          </span>
        </div>

        <div className="space-y-2 overflow-y-auto pr-1">
          {documents.map((document) => (
            <article
              key={document.id}
              className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-zinc-100 p-2 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                        {document.originalName}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {document.fileType.toUpperCase()} · {formatBytes(document.sizeBytes)}
                        {document.pageCount ? ` · ${document.pageCount} pages` : ""}
                      </p>
                    </div>
                    <StatusBadge status={document.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {document.chunkCount} chunks
                      {document.statusMessage ? ` · ${document.statusMessage}` : ""}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="icon-button small"
                        title="Re-index document"
                        aria-label="Re-index document"
                        onClick={() => void onReindex(document.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="icon-button small danger"
                        title="Delete document"
                        aria-label="Delete document"
                        onClick={() => void onDelete(document.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {!documents.length && !loading ? (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white/70 p-5 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
              Uploaded documents will appear here with parsing and indexing status.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
