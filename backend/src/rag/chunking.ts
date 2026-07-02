import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { config } from "../config/env.js";
import type { ChunkRecord, LoadedDocument } from "../types/domain.js";
import { createId, nowIso } from "../utils/ids.js";
import { estimateTokens } from "../utils/snippets.js";

export interface BuildChunksInput {
  documentId: string;
  collectionId: string;
  sourceFile: string;
  loaded: LoadedDocument;
}

export async function buildChunks(input: BuildChunksInput): Promise<ChunkRecord[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.retrieval.chunkSize,
    chunkOverlap: config.retrieval.chunkOverlap,
    separators: ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " ", ""]
  });

  const chunks: ChunkRecord[] = [];
  let chunkIndex = 0;

  for (const section of input.loaded.sections) {
    const splitTexts = await splitter.splitText(section.text);
    for (const chunkText of splitTexts) {
      const normalized = chunkText.replace(/\s+/g, " ").trim();
      if (!normalized) continue;
      const id = createId("chunk");
      chunks.push({
        id,
        vectorId: `${input.documentId}:${chunkIndex}`,
        documentId: input.documentId,
        collectionId: input.collectionId,
        text: normalized,
        sourceFile: input.sourceFile,
        pageNumber: section.pageNumber,
        sectionHeading: section.heading,
        chunkIndex,
        tokenEstimate: estimateTokens(normalized),
        createdAt: nowIso()
      });
      chunkIndex += 1;
    }
  }

  return chunks;
}
