import { ChromaClient } from "chromadb";
import { Pinecone } from "@pinecone-database/pinecone";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import { AppError } from "../middleware/errors.js";
import type { ChunkRecord, RetrievalMode } from "../types/domain.js";
import { makeSnippet } from "../utils/snippets.js";
import { selectMmr } from "./mmr.js";

export interface RetrievedChunk {
  chunkId: string;
  vectorId: string;
  documentId: string;
  collectionId: string;
  text: string;
  sourceFile: string;
  chunkIndex: number;
  score?: number;
  distance?: number;
  pageNumber?: number;
  sectionHeading?: string;
  embedding?: number[];
}

export interface QueryOptions {
  collectionId: string;
  queryEmbedding: number[];
  topK: number;
  retrievalMode: RetrievalMode;
}

export interface VectorStore {
  upsertChunks(chunks: ChunkRecord[], embeddings: number[][]): Promise<void>;
  deleteDocument(documentId: string): Promise<void>;
  query(options: QueryOptions): Promise<RetrievedChunk[]>;
  health(): Promise<{ ok: boolean; provider: string; message?: string }>;
}

type ChromaMetadata = Record<string, string | number | boolean>;

export class ChromaVectorStore implements VectorStore {
  private client = new ChromaClient({
    host: config.chroma.host,
    port: Number(config.chroma.port),
    ssl: config.chroma.ssl
  } as unknown as ConstructorParameters<typeof ChromaClient>[0]);

  async upsertChunks(chunks: ChunkRecord[], embeddings: number[][]) {
    if (!chunks.length) return;

    try {
      const collection = await this.getCollection();
      await collection.add({
        ids: chunks.map((chunk) => chunk.vectorId),
        embeddings,
        documents: chunks.map((chunk) => chunk.text),
        metadatas: chunks.map((chunk) => toMetadata(chunk))
      });
    } catch (error) {
      logger.error({ error }, "Failed to upsert chunks into Chroma");
      throw new AppError(
        503,
        "Vector database is unavailable. Start Chroma with docker compose up chroma.",
        "VECTOR_DB_UNAVAILABLE"
      );
    }
  }

  async deleteDocument(documentId: string) {
    try {
      const collection = await this.getCollection();
      await collection.delete({ where: { documentId } } as never);
    } catch (error) {
      logger.warn({ error, documentId }, "Failed to delete vectors for document");
    }
  }

  async query(options: QueryOptions) {
    try {
      const collection = await this.getCollection();
      const nResults = options.retrievalMode === "mmr" ? Math.max(options.topK * 4, options.topK) : options.topK;
      const results = await collection.query({
        queryEmbeddings: [options.queryEmbedding],
        nResults,
        where: { collectionId: options.collectionId },
        include: ["documents", "metadatas", "distances", "embeddings"]
      } as never);

      const chunks = mapChromaResults(results);
      if (options.retrievalMode === "mmr") {
        return selectMmr(
          options.queryEmbedding,
          chunks.map((chunk) => ({
            item: chunk,
            embedding: chunk.embedding,
            similarity: chunk.score ?? 0
          })),
          options.topK
        );
      }

      return chunks.slice(0, options.topK);
    } catch (error) {
      logger.error({ error }, "Failed to query Chroma");
      throw new AppError(
        503,
        "Vector database query failed. Check that Chroma is running.",
        "VECTOR_QUERY_FAILED"
      );
    }
  }

  async health() {
    try {
      await this.getCollection();
      return { ok: true, provider: "chroma" };
    } catch (error) {
      return {
        ok: false,
        provider: "chroma",
        message: error instanceof Error ? error.message : "Chroma health check failed"
      };
    }
  }

  private async getCollection() {
    return this.client.getOrCreateCollection({
      name: config.chroma.collectionName
    });
  }
}

export class PineconeVectorStore implements VectorStore {
  private client: Pinecone | null = null;

  async upsertChunks(chunks: ChunkRecord[], embeddings: number[][]) {
    if (!chunks.length) return;
    const namespace = this.namespace();

    await namespace.upsert(
      chunks.map((chunk, index) => ({
        id: chunk.vectorId,
        values: embeddings[index],
        metadata: {
          ...toMetadata(chunk),
          text: chunk.text
        }
      }))
    );
  }

  async deleteDocument(documentId: string) {
    try {
      await this.namespace().deleteMany({ documentId: { $eq: documentId } } as never);
    } catch (error) {
      logger.warn({ error, documentId }, "Failed to delete Pinecone vectors for document");
    }
  }

  async query(options: QueryOptions) {
    const nResults = options.retrievalMode === "mmr" ? Math.max(options.topK * 4, options.topK) : options.topK;
    const result = await this.namespace().query({
      vector: options.queryEmbedding,
      topK: nResults,
      filter: { collectionId: { $eq: options.collectionId } },
      includeMetadata: true,
      includeValues: options.retrievalMode === "mmr"
    } as never);

    const chunks = (result.matches ?? []).map((match) => {
      const metadata = (match.metadata ?? {}) as Record<string, unknown>;
      return {
        chunkId: String(metadata.chunkId),
        vectorId: match.id,
        documentId: String(metadata.documentId),
        collectionId: String(metadata.collectionId),
        text: String(metadata.text ?? ""),
        sourceFile: String(metadata.sourceFile),
        chunkIndex: Number(metadata.chunkIndex ?? 0),
        pageNumber: metadata.pageNumber ? Number(metadata.pageNumber) : undefined,
        sectionHeading: metadata.sectionHeading ? String(metadata.sectionHeading) : undefined,
        score: match.score,
        embedding: (match.values as number[] | undefined) ?? undefined
      } satisfies RetrievedChunk;
    });

    if (options.retrievalMode === "mmr") {
      return selectMmr(
        options.queryEmbedding,
        chunks.map((chunk) => ({
          item: chunk,
          embedding: chunk.embedding,
          similarity: chunk.score ?? 0
        })),
        options.topK
      );
    }

    return chunks.slice(0, options.topK);
  }

  async health() {
    try {
      this.namespace();
      return { ok: true, provider: "pinecone" };
    } catch (error) {
      return {
        ok: false,
        provider: "pinecone",
        message: error instanceof Error ? error.message : "Pinecone configuration failed"
      };
    }
  }

  private namespace() {
    if (!config.pinecone.apiKey || !config.pinecone.index) {
      throw new AppError(
        503,
        "Pinecone is selected but PINECONE_API_KEY or PINECONE_INDEX is missing.",
        "PINECONE_CONFIG_MISSING"
      );
    }

    this.client ??= new Pinecone({ apiKey: config.pinecone.apiKey });
    return this.client.index(config.pinecone.index).namespace(config.pinecone.namespace);
  }
}

export function createVectorStore(): VectorStore {
  return config.vector.provider === "pinecone"
    ? new PineconeVectorStore()
    : new ChromaVectorStore();
}

export const vectorStore = createVectorStore();

function toMetadata(chunk: ChunkRecord): ChromaMetadata {
  return {
    chunkId: chunk.id,
    documentId: chunk.documentId,
    collectionId: chunk.collectionId,
    sourceFile: chunk.sourceFile,
    chunkIndex: chunk.chunkIndex,
    tokenEstimate: chunk.tokenEstimate,
    pageNumber: chunk.pageNumber ?? 0,
    sectionHeading: chunk.sectionHeading ?? ""
  };
}

function mapChromaResults(results: unknown): RetrievedChunk[] {
  const typed = results as {
    ids?: string[][];
    documents?: Array<Array<string | null>>;
    metadatas?: Array<Array<Record<string, unknown> | null>>;
    distances?: number[][];
    embeddings?: number[][][];
  };

  const ids = typed.ids?.[0] ?? [];
  const documents = typed.documents?.[0] ?? [];
  const metadatas = typed.metadatas?.[0] ?? [];
  const distances = typed.distances?.[0] ?? [];
  const embeddings = typed.embeddings?.[0] ?? [];

  return ids.map((id, index) => {
    const metadata = metadatas[index] ?? {};
    const distance = distances[index];
    const text = documents[index] ?? "";
    return {
      chunkId: String(metadata.chunkId ?? id),
      vectorId: id,
      documentId: String(metadata.documentId ?? ""),
      collectionId: String(metadata.collectionId ?? ""),
      text,
      sourceFile: String(metadata.sourceFile ?? "Unknown source"),
      chunkIndex: Number(metadata.chunkIndex ?? index),
      pageNumber: Number(metadata.pageNumber) > 0 ? Number(metadata.pageNumber) : undefined,
      sectionHeading: metadata.sectionHeading ? String(metadata.sectionHeading) : undefined,
      distance,
      score: typeof distance === "number" ? 1 / (1 + Math.max(distance, 0)) : undefined,
      embedding: embeddings[index],
      snippet: makeSnippet(text)
    } as RetrievedChunk & { snippet: string };
  });
}
