export type DocumentStatus = "uploaded" | "parsing" | "indexing" | "ready" | "failed";

export type ChatRole = "user" | "assistant";

export type RetrievalMode = "similarity" | "mmr";

export interface CollectionRecord {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionSummary extends CollectionRecord {
  documentCount: number;
  readyDocumentCount: number;
  chunkCount: number;
}

export interface DocumentRecord {
  id: string;
  collectionId: string;
  collectionName: string;
  filename: string;
  originalName: string;
  fileType: "pdf" | "docx" | "txt" | "md";
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  updatedAt: string;
  status: DocumentStatus;
  statusMessage?: string;
  pageCount?: number;
  chunkCount: number;
  storagePath?: string;
}

export interface ChunkRecord {
  id: string;
  vectorId: string;
  documentId: string;
  collectionId: string;
  text: string;
  sourceFile: string;
  chunkIndex: number;
  tokenEstimate: number;
  pageNumber?: number;
  sectionHeading?: string;
  createdAt: string;
}

export interface Citation {
  id: string;
  documentId: string;
  chunkId: string;
  filename: string;
  snippet: string;
  score?: number;
  pageNumber?: number;
  sectionHeading?: string;
}

export interface ChatMessageRecord {
  id: string;
  collectionId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  citations?: Citation[];
  retrievedContext?: Citation[];
}

export interface StoredDatabase {
  collections: CollectionRecord[];
  documents: DocumentRecord[];
  chunks: ChunkRecord[];
  chatMessages: ChatMessageRecord[];
}

export interface LoadedSection {
  text: string;
  pageNumber?: number;
  heading?: string;
}

export interface LoadedDocument {
  text: string;
  pageCount?: number;
  sections: LoadedSection[];
}

export interface UploadResult {
  ok: boolean;
  filename: string;
  document?: DocumentRecord;
  error?: string;
}
