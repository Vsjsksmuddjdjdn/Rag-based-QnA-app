import path from "node:path";

export const supportedFileTypes = ["pdf", "docx", "txt", "md"] as const;

export type SupportedFileType = (typeof supportedFileTypes)[number];

const mimeToType: Record<string, SupportedFileType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "text/markdown": "md",
  "application/octet-stream": "txt"
};

export function detectFileType(filename: string, mimeType: string): SupportedFileType | null {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".pdf") return "pdf";
  if (extension === ".docx") return "docx";
  if (extension === ".txt") return "txt";
  if (extension === ".md" || extension === ".markdown") return "md";
  return mimeToType[mimeType] ?? null;
}

export function isSupportedMime(filename: string, mimeType: string) {
  return detectFileType(filename, mimeType) !== null;
}
