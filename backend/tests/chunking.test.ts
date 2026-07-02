import { describe, expect, it } from "vitest";
import { buildChunks } from "../src/rag/chunking.js";
import type { LoadedDocument } from "../src/types/domain.js";

describe("chunking", () => {
  it("preserves heading and source metadata while splitting text", async () => {
    const loaded: LoadedDocument = {
      text: "## Architecture\nThe system has a client, API, vector DB, and LLM.",
      sections: [
        {
          heading: "Architecture",
          text: "## Architecture\nThe system has a client, API, vector DB, and LLM."
        }
      ]
    };

    const chunks = await buildChunks({
      documentId: "doc_1",
      collectionId: "col_1",
      sourceFile: "notes.md",
      loaded
    });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toMatchObject({
      documentId: "doc_1",
      collectionId: "col_1",
      sourceFile: "notes.md",
      sectionHeading: "Architecture",
      chunkIndex: 0
    });
  });
});
