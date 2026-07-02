import { DragEvent, useRef, useState } from "react";
import clsx from "clsx";
import { FileUp, Loader2, UploadCloud } from "lucide-react";
import type { UploadResult } from "../types";

interface UploadDropzoneProps {
  disabled?: boolean;
  uploadProgress: number | null;
  uploadResults: UploadResult[];
  onUpload: (files: File[]) => Promise<void>;
}

const accepted = ".pdf,.docx,.txt,.md,.markdown";

export function UploadDropzone({
  disabled,
  uploadProgress,
  uploadResults,
  onUpload
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const next = Array.from(files ?? []);
    if (!next.length) return;
    await onUpload(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    await handleFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className={clsx(
          "group rounded-lg border border-dashed p-4 transition",
          dragging
            ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40"
            : "border-zinc-300 bg-white/70 hover:border-teal-400 dark:border-zinc-700 dark:bg-zinc-900/60",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accepted}
          multiple
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex w-full items-center gap-3 text-left"
        >
          <span className="rounded-lg bg-teal-50 p-3 text-teal-700 transition group-hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-200">
            <UploadCloud className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-zinc-950 dark:text-white">
              Drop files or browse
            </span>
            <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
              PDF, DOCX, TXT, and Markdown up to the configured size limit
            </span>
          </span>
        </button>
      </div>

      {uploadProgress !== null ? (
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-cyan-900 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-100">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading, parsing, embedding, and indexing
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-cyan-100 dark:bg-cyan-900">
            <div className="h-full rounded-full bg-cyan-600 transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      ) : null}

      {uploadResults.length ? (
        <div className="space-y-2">
          {uploadResults.map((result) => (
            <div
              key={`${result.filename}-${result.ok}`}
              className={clsx(
                "flex items-start gap-2 rounded-lg border p-3 text-xs",
                result.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
                  : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100"
              )}
            >
              <FileUp className="mt-0.5 h-4 w-4" />
              <span>
                <strong>{result.filename}</strong>
                <span className="block">{result.ok ? "Indexed successfully." : result.error}</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
