import fs from "node:fs/promises";
import path from "node:path";
import type {
  ChatMessageRecord,
  ChunkRecord,
  CollectionRecord,
  CollectionSummary,
  DocumentRecord,
  StoredDatabase
} from "../types/domain.js";

const emptyDatabase = (): StoredDatabase => ({
  collections: [],
  documents: [],
  chunks: [],
  chatMessages: []
});

export class JsonStore {
  private db: StoredDatabase | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async init() {
    if (this.db) return;

    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      this.db = JSON.parse(raw) as StoredDatabase;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw error;
      this.db = emptyDatabase();
      await this.persist();
    }
  }

  async reset() {
    this.db = emptyDatabase();
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await this.persist();
  }

  async snapshot(): Promise<StoredDatabase> {
    await this.init();
    return structuredClone(this.db!);
  }

  async mutate<T>(operation: (db: StoredDatabase) => T | Promise<T>): Promise<T> {
    await this.init();
    let result!: T;

    const run = this.writeQueue.then(async () => {
      result = await operation(this.db!);
      await this.persist();
    });

    this.writeQueue = run.catch(() => undefined);
    await run;
    return structuredClone(result);
  }

  async listCollections(): Promise<CollectionSummary[]> {
    const db = await this.snapshot();
    return db.collections
      .map((collection) => {
        const docs = db.documents.filter((document) => document.collectionId === collection.id);
        const chunks = db.chunks.filter((chunk) => chunk.collectionId === collection.id);
        return {
          ...collection,
          documentCount: docs.length,
          readyDocumentCount: docs.filter((document) => document.status === "ready").length,
          chunkCount: chunks.length
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getCollection(id: string) {
    const db = await this.snapshot();
    return db.collections.find((collection) => collection.id === id);
  }

  async findCollectionByName(name: string) {
    const db = await this.snapshot();
    return db.collections.find(
      (collection) => collection.name.toLowerCase() === name.toLowerCase()
    );
  }

  async addCollection(collection: CollectionRecord) {
    return this.mutate((db) => {
      db.collections.push(collection);
      return collection;
    });
  }

  async updateCollection(collectionId: string, patch: Partial<CollectionRecord>) {
    return this.mutate((db) => {
      const collection = db.collections.find((item) => item.id === collectionId);
      if (!collection) return undefined;
      Object.assign(collection, patch);
      return collection;
    });
  }

  async listDocuments(collectionId?: string) {
    const db = await this.snapshot();
    return db.documents
      .filter((document) => !collectionId || document.collectionId === collectionId)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  async getDocument(documentId: string) {
    const db = await this.snapshot();
    return db.documents.find((document) => document.id === documentId);
  }

  async hasDuplicateDocumentName(collectionId: string, originalName: string) {
    const db = await this.snapshot();
    return db.documents.some(
      (document) =>
        document.collectionId === collectionId &&
        document.originalName.toLowerCase() === originalName.toLowerCase()
    );
  }

  async addDocument(document: DocumentRecord) {
    return this.mutate((db) => {
      db.documents.push(document);
      const collection = db.collections.find((item) => item.id === document.collectionId);
      if (collection) collection.updatedAt = document.updatedAt;
      return document;
    });
  }

  async updateDocument(documentId: string, patch: Partial<DocumentRecord>) {
    return this.mutate((db) => {
      const document = db.documents.find((item) => item.id === documentId);
      if (!document) return undefined;
      Object.assign(document, patch);
      const collection = db.collections.find((item) => item.id === document.collectionId);
      if (collection) collection.updatedAt = document.updatedAt;
      return document;
    });
  }

  async removeDocument(documentId: string) {
    return this.mutate((db) => {
      const document = db.documents.find((item) => item.id === documentId);
      db.documents = db.documents.filter((item) => item.id !== documentId);
      db.chunks = db.chunks.filter((chunk) => chunk.documentId !== documentId);
      if (document) {
        const collection = db.collections.find((item) => item.id === document.collectionId);
        if (collection) collection.updatedAt = new Date().toISOString();
      }
      return document;
    });
  }

  async addChunks(chunks: ChunkRecord[]) {
    return this.mutate((db) => {
      db.chunks.push(...chunks);
      return chunks;
    });
  }

  async replaceDocumentChunks(documentId: string, chunks: ChunkRecord[]) {
    return this.mutate((db) => {
      db.chunks = db.chunks.filter((chunk) => chunk.documentId !== documentId);
      db.chunks.push(...chunks);
      return chunks;
    });
  }

  async getChunksByDocument(documentId: string) {
    const db = await this.snapshot();
    return db.chunks
      .filter((chunk) => chunk.documentId === documentId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  async getChunk(chunkId: string) {
    const db = await this.snapshot();
    return db.chunks.find((chunk) => chunk.id === chunkId);
  }

  async getReadyDocuments(collectionId: string) {
    const db = await this.snapshot();
    return db.documents.filter(
      (document) => document.collectionId === collectionId && document.status === "ready"
    );
  }

  async addChatMessages(messages: ChatMessageRecord[]) {
    return this.mutate((db) => {
      db.chatMessages.push(...messages);
      return messages;
    });
  }

  async getChatHistory(collectionId: string) {
    const db = await this.snapshot();
    return db.chatMessages
      .filter((message) => message.collectionId === collectionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async clearChatHistory(collectionId: string) {
    return this.mutate((db) => {
      const removed = db.chatMessages.filter((message) => message.collectionId === collectionId);
      db.chatMessages = db.chatMessages.filter((message) => message.collectionId !== collectionId);
      return removed.length;
    });
  }

  private async persist() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const tempFile = `${this.filePath}.${process.pid}.${Date.now()}.${Math.random()
      .toString(16)
      .slice(2)}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(this.db ?? emptyDatabase(), null, 2), "utf8");
    await fs.rename(tempFile, this.filePath);
  }
}
