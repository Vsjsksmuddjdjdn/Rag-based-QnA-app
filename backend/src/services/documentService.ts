import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import { detectFileType } from "../loaders/fileTypes.js";
import { loadDocumentText } from "../loaders/documentLoader.js";
import { AppError } from "../middleware/errors.js";
import { buildChunks } from "../rag/chunking.js";
import { embeddingProvider } from "../rag/embeddings.js";
import { vectorStore } from "../rag/vectorStore.js";
import { store } from "../storage/index.js";
import type { DocumentRecord, UploadResult } from "../types/domain.js";
import { createId, nowIso, sanitizeFilename } from "../utils/ids.js";
import { collectionService } from "./collectionService.js";

export class DocumentService {
  async listDocuments(collectionId?: string) {
    return store.listDocuments(collectionId);
  }

  async uploadDocuments(input: {
    files: Express.Multer.File[];
    collectionId: string;
  }): Promise<UploadResult[]> {
    const collection = await collectionService.requireCollection(input.collectionId);
    if (!input.files?.length) {
      throw new AppError(400, "Attach at least one document file.", "NO_FILES_UPLOADED");
    }

    const results: UploadResult[] = [];
    const batchNames = new Set<string>();

    for (const file of input.files) {
      const duplicateInBatch = batchNames.has(file.originalname.toLowerCase());
      batchNames.add(file.originalname.toLowerCase());

      if (duplicateInBatch) {
        results.push({
          ok: false,
          filename: file.originalname,
          error: "Duplicate filename in this upload batch."
        });
        continue;
      }

      const existingDuplicate = await store.hasDuplicateDocumentName(collection.id, file.originalname);
      const validationError = this.validateFile(file, existingDuplicate);
      if (validationError) {
        results.push({
          ok: false,
          filename: file.originalname,
          error: validationError
        });
        continue;
      }

      results.push(await this.indexSingleFile(file, collection.id, collection.name));
    }

    return results;
  }

  async deleteDocument(documentId: string) {
    const document = await store.getDocument(documentId);
    if (!document) {
      throw new AppError(404, "Document not found.", "DOCUMENT_NOT_FOUND");
    }

    await vectorStore.deleteDocument(document.id);
    const removed = await store.removeDocument(document.id);
    if (removed?.storagePath) {
      await fs.rm(removed.storagePath, { force: true }).catch((error) => {
        logger.warn({ error, documentId }, "Failed to delete uploaded file from disk");
      });
    }

    return removed;
  }

  async reindexDocument(documentId: string) {
    const document = await store.getDocument(documentId);
    if (!document) {
      throw new AppError(404, "Document not found.", "DOCUMENT_NOT_FOUND");
    }

    if (!document.storagePath) {
      throw new AppError(
        409,
        "This document has no stored file to re-index.",
        "DOCUMENT_FILE_MISSING"
      );
    }

    const fileBuffer = await fs.readFile(document.storagePath);
    await store.updateDocument(document.id, {
      status: "parsing",
      statusMessage: "Re-reading document text",
      updatedAt: nowIso()
    });

    try {
      await vectorStore.deleteDocument(document.id);
      const loaded = await loadDocumentText(fileBuffer, document.fileType);
      const chunks = await buildChunks({
        documentId: document.id,
        collectionId: document.collectionId,
        sourceFile: document.originalName,
        loaded
      });

      if (!chunks.length) {
        throw new AppError(422, "Document produced no indexable chunks.", "NO_CHUNKS_CREATED");
      }

      await store.updateDocument(document.id, {
        status: "indexing",
        statusMessage: "Generating embeddings and updating vectors",
        updatedAt: nowIso()
      });

      const embeddings = await embeddingProvider.embedDocuments(chunks.map((chunk) => chunk.text));
      await vectorStore.upsertChunks(chunks, embeddings);
      await store.replaceDocumentChunks(document.id, chunks);

      return store.updateDocument(document.id, {
        status: "ready",
        statusMessage: "Indexed successfully",
        pageCount: loaded.pageCount,
        chunkCount: chunks.length,
        updatedAt: nowIso()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Re-indexing failed.";
      await store.updateDocument(document.id, {
        status: "failed",
        statusMessage: message,
        updatedAt: nowIso()
      });
      throw error;
    }
  }

  async getChunks(documentId: string) {
    const document = await store.getDocument(documentId);
    if (!document) {
      throw new AppError(404, "Document not found.", "DOCUMENT_NOT_FOUND");
    }
    return store.getChunksByDocument(documentId);
  }

  private validateFile(file: Express.Multer.File, duplicateExists: boolean) {
    if (!file.size) return "File is empty.";
    if (file.size > config.maxUploadBytes) return "File exceeds the configured upload size limit.";
    if (duplicateExists) return "A document with this filename already exists in the collection.";
    if (!detectFileType(file.originalname, file.mimetype)) {
      return "Unsupported file type. Use PDF, DOCX, TXT, or Markdown.";
    }
    return null;
  }

  private async indexSingleFile(
    file: Express.Multer.File,
    collectionId: string,
    collectionName: string
  ): Promise<UploadResult> {
    const fileType = detectFileType(file.originalname, file.mimetype);
    if (!fileType) {
      return {
        ok: false,
        filename: file.originalname,
        error: "Unsupported file type. Use PDF, DOCX, TXT, or Markdown."
      };
    }

    const timestamp = nowIso();
    const documentId = createId("doc");
    const safeOriginal = sanitizeFilename(file.originalname);
    const storedFilename = `${documentId}-${safeOriginal}`;
    const storagePath = path.join(config.storage.uploadsDir, storedFilename);
    const document: DocumentRecord = {
      id: documentId,
      collectionId,
      collectionName,
      filename: storedFilename,
      originalName: file.originalname,
      fileType,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedAt: timestamp,
      updatedAt: timestamp,
      status: "parsing",
      statusMessage: "Parsing document text",
      chunkCount: 0
    };

    await store.addDocument(document);

    try {
      const loaded = await loadDocumentText(file.buffer, fileType);
      const chunks = await buildChunks({
        documentId,
        collectionId,
        sourceFile: file.originalname,
        loaded
      });

      if (!chunks.length) {
        throw new AppError(422, "Document produced no indexable chunks.", "NO_CHUNKS_CREATED");
      }

      await fs.mkdir(config.storage.uploadsDir, { recursive: true });
      await fs.writeFile(storagePath, file.buffer);

      await store.updateDocument(documentId, {
        status: "indexing",
        statusMessage: "Generating embeddings and writing vectors",
        pageCount: loaded.pageCount,
        storagePath,
        updatedAt: nowIso()
      });

      const embeddings = await embeddingProvider.embedDocuments(chunks.map((chunk) => chunk.text));
      await vectorStore.upsertChunks(chunks, embeddings);
      await store.addChunks(chunks);

      const readyDocument = await store.updateDocument(documentId, {
        status: "ready",
        statusMessage: "Indexed successfully",
        pageCount: loaded.pageCount,
        chunkCount: chunks.length,
        storagePath,
        updatedAt: nowIso()
      });

      return {
        ok: true,
        filename: file.originalname,
        document: readyDocument
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Document indexing failed.";
      const failedDocument = await store.updateDocument(documentId, {
        status: "failed",
        statusMessage: message,
        updatedAt: nowIso()
      });

      logger.warn({ error, filename: file.originalname }, "Document upload failed");
      return {
        ok: false,
        filename: file.originalname,
        document: failedDocument,
        error: message
      };
    }
  }
}

export const documentService = new DocumentService();
