import crypto from "node:crypto";

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function sanitizeFilename(filename: string) {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export function nowIso() {
  return new Date().toISOString();
}
