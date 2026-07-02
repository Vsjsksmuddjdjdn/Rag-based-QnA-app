export function makeSnippet(text: string, maxLength = 320) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}

export function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}
