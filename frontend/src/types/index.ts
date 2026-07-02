export type DocumentStatus = "uploaded" | "parsing" | "indexing" | "ready" | "failed";
export type RetrievalMode = "similarity" | "mmr";

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
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

export interface ChatMessage {
  id: string;
  collectionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  citations?: Citation[];
  retrievedContext?: Citation[];
  pending?: boolean;
  error?: boolean;
}

export interface UploadResult {
  ok: boolean;
  filename: string;
  document?: DocumentRecord;
  error?: string;
}

export interface ChatSettings {
  model: string;
  temperature: number;
  topK: number;
  retrievalMode: RetrievalMode;
  showContext: boolean;
  stream: boolean;
}
