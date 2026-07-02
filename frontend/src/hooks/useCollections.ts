import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Collection } from "../types";

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const next = await api.listCollections();
      setCollections(next);
      setSelectedCollectionId((current) => current || next[0]?.id || "");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load collections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createCollection = async (name: string, description?: string) => {
    const created = await api.createCollection({ name, description });
    await refresh();
    setSelectedCollectionId(created.id);
    return created;
  };

  return {
    collections,
    selectedCollectionId,
    selectedCollection: collections.find((collection) => collection.id === selectedCollectionId),
    setSelectedCollectionId,
    createCollection,
    refresh,
    loading,
    error
  };
}
