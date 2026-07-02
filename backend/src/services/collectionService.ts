import { AppError } from "../middleware/errors.js";
import { store } from "../storage/index.js";
import type { CollectionRecord } from "../types/domain.js";
import { createId, nowIso } from "../utils/ids.js";

export class CollectionService {
  async listCollections() {
    return store.listCollections();
  }

  async createCollection(input: { name: string; description?: string }) {
    const name = input.name.trim();
    const existing = await store.findCollectionByName(name);
    if (existing) {
      throw new AppError(409, "A collection with this name already exists.", "DUPLICATE_COLLECTION");
    }

    const timestamp = nowIso();
    const collection: CollectionRecord = {
      id: createId("col"),
      name,
      description: input.description?.trim() || undefined,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    return store.addCollection(collection);
  }

  async requireCollection(collectionId: string) {
    const collection = await store.getCollection(collectionId);
    if (!collection) {
      throw new AppError(404, "Collection not found.", "COLLECTION_NOT_FOUND");
    }
    return collection;
  }
}

export const collectionService = new CollectionService();
