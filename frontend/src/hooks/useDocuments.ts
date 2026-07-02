import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { DocumentRecord, UploadResult } from "../types";

export function useDocuments(collectionId: string, onRefreshCollections: () => Promise<void>) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState<string>("");

  const refresh = useCallback(async () => {
    if (!collectionId) {
      setDocuments([]);
      return;
    }

    try {
      setLoading(true);
      setDocuments(await api.listDocuments(collectionId));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upload = async (files: File[]) => {
    if (!collectionId) {
      setError("Create or select a collection before uploading.");
      return;
    }

    setUploadResults([]);
    setUploadProgress(0);
    try {
      const response = await api.uploadDocuments(collectionId, files, setUploadProgress);
      setUploadResults(response.results);
      await refresh();
      await onRefreshCollections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadProgress(null);
    }
  };

  const remove = async (documentId: string) => {
    await api.deleteDocument(documentId);
    await refresh();
    await onRefreshCollections();
  };

  const reindex = async (documentId: string) => {
    await api.reindexDocument(documentId);
    await refresh();
    await onRefreshCollections();
  };

  return {
    documents,
    loading,
    upload,
    uploadProgress,
    uploadResults,
    remove,
    reindex,
    refresh,
    error
  };
}
