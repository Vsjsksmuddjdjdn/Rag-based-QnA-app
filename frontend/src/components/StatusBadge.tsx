import clsx from "clsx";
import type { DocumentStatus } from "../types";

const statusStyles: Record<DocumentStatus, string> = {
  uploaded: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700",
  parsing: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800",
  indexing: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-950 dark:text-cyan-200 dark:ring-cyan-800",
  ready: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800",
  failed: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-800"
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1", statusStyles[status])}>
      {status}
    </span>
  );
}
