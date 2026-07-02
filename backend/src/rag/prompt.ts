import type { Citation } from "../types/domain.js";

export function buildGroundedPrompt(question: string, contextBlocks: Citation[]) {
  const context = contextBlocks
    .map((citation, index) => {
      const page = citation.pageNumber ? ` page ${citation.pageNumber}` : "";
      const heading = citation.sectionHeading ? ` heading "${citation.sectionHeading}"` : "";
      return `[S${index + 1}] ${citation.filename}${page}${heading}\n${citation.snippet}`;
    })
    .join("\n\n");

  return {
    system: [
      "You are a careful document Q&A assistant.",
      "Answer only from the provided context.",
      "If the answer is not clearly supported by the context, say you do not know.",
      "Cite every factual claim with source tags like [S1] or [S2].",
      "Do not invent citations, page numbers, filenames, or facts.",
      "Be concise, direct, and useful."
    ].join(" "),
    user: `Context:\n${context}\n\nQuestion: ${question}\n\nGrounded answer:`
  };
}
