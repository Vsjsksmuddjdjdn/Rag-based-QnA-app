import type { Request, Response } from "express";
import { collectionService } from "../services/collectionService.js";

export class CollectionController {
  async list(_req: Request, res: Response) {
    const collections = await collectionService.listCollections();
    res.json({ collections });
  }

  async create(req: Request, res: Response) {
    const collection = await collectionService.createCollection(req.body);
    res.status(201).json({ collection });
  }
}

export const collectionController = new CollectionController();
