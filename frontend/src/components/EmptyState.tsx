import { FileSearch } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white/70 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/60">
      <div className="mb-4 rounded-lg bg-teal-50 p-3 text-teal-700 dark:bg-teal-950 dark:text-teal-200">
        <FileSearch className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-zinc-950 dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}
