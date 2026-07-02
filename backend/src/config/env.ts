import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

const envPath = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env")
].find((candidate) => fs.existsSync(candidate));

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const numberFromEnv = (fallback: number) =>
  z.preprocess((value) => {
    if (value === undefined || value === "") return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number());

const booleanFromEnv = (fallback: boolean) =>
  z.preprocess((value) => {
    if (value === undefined || value === "") return fallback;
    if (typeof value === "boolean") return value;
    return String(value).toLowerCase() === "true";
  }, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: numberFromEnv(4000),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z.string().default("info"),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),

  MAX_UPLOAD_MB: numberFromEnv(25),
  STORAGE_DIR: z.string().default("./data"),
  STORAGE_FILE: z.string().optional(),
  UPLOAD_DIR: z.string().default("./uploads"),

  DEFAULT_TOP_K: numberFromEnv(5),
  CHUNK_SIZE: numberFromEnv(1000),
  CHUNK_OVERLAP: numberFromEnv(180),
  MAX_CONTEXT_CHARS: numberFromEnv(12000),
  MIN_RELEVANCE_SCORE: numberFromEnv(0.15),
  VECTOR_PROVIDER: z.enum(["chroma", "pinecone"]).default("chroma"),

  CHROMA_HOST: z.string().default("localhost"),
  CHROMA_PORT: z.string().default("8000"),
  CHROMA_SSL: booleanFromEnv(false),
  CHROMA_COLLECTION_NAME: z.string().default("rag_document_chunks"),

  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().optional(),
  PINECONE_NAMESPACE: z.string().default("rag-document-qa")
});

const parsedEnv = envSchema.parse(process.env);
const rootDir = process.cwd();
const storageDir = path.resolve(rootDir, parsedEnv.STORAGE_DIR);
const uploadDir = path.resolve(rootDir, parsedEnv.UPLOAD_DIR);
const storageFile =
  parsedEnv.STORAGE_FILE ??
  path.join(storageDir, parsedEnv.NODE_ENV === "test" ? "library.test.json" : "library.json");

export const config = {
  env: parsedEnv.NODE_ENV,
  port: parsedEnv.PORT,
  frontendUrl: parsedEnv.FRONTEND_URL,
  logLevel: parsedEnv.LOG_LEVEL,
  maxUploadBytes: parsedEnv.MAX_UPLOAD_MB * 1024 * 1024,
  storage: {
    dir: storageDir,
    file: storageFile,
    uploadsDir: uploadDir
  },
  openai: {
    apiKey: parsedEnv.OPENAI_API_KEY,
    chatModel: parsedEnv.OPENAI_CHAT_MODEL,
    embeddingModel: parsedEnv.OPENAI_EMBEDDING_MODEL
  },
  retrieval: {
    defaultTopK: parsedEnv.DEFAULT_TOP_K,
    chunkSize: parsedEnv.CHUNK_SIZE,
    chunkOverlap: parsedEnv.CHUNK_OVERLAP,
    maxContextChars: parsedEnv.MAX_CONTEXT_CHARS,
    minRelevanceScore: parsedEnv.MIN_RELEVANCE_SCORE
  },
  vector: {
    provider: parsedEnv.VECTOR_PROVIDER
  },
  chroma: {
    host: parsedEnv.CHROMA_HOST,
    port: parsedEnv.CHROMA_PORT,
    ssl: parsedEnv.CHROMA_SSL,
    collectionName: parsedEnv.CHROMA_COLLECTION_NAME
  },
  pinecone: {
    apiKey: parsedEnv.PINECONE_API_KEY,
    index: parsedEnv.PINECONE_INDEX,
    namespace: parsedEnv.PINECONE_NAMESPACE
  }
} as const;
