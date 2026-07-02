import type { Request, Response } from "express";
import { AppError } from "../middleware/errors.js";
import { documentService } from "../services/documentService.js";

export class DocumentController {
  async upload(req: Request, res: Response) {
    const collectionId = String(req.body.collectionId ?? "");
    if (!collectionId) {
      throw new AppError(400, "collectionId is required.", "COLLECTION_ID_REQUIRED");
    }

    const files = (req.files ?? []) as Express.Multer.File[];
    const results = await documentService.uploadDocuments({
      files,
      collectionId
    });

    const successCount = results.filter((result) => result.ok).length;
    res.status(successCount ? 201 : 400).json({
      results,
      successCount,
      failureCount: results.length - successCount
    });
  }

  async list(req: Request, res: Response) {
    const collectionId = req.query.collectionId ? String(req.query.collectionId) : undefined;
    const documents = await documentService.listDocuments(collectionId);
    res.json({ documents });
  }

  async remove(req: Request, res: Response) {
    const document = await documentService.deleteDocument(req.params.id);
    res.json({ document });
  }

  async reindex(req: Request, res: Response) {
    const document = await documentService.reindexDocument(req.params.id);
    res.json({ document });
  }

  async chunks(req: Request, res: Response) {
    const chunks = await documentService.getChunks(req.params.id);
    res.json({ chunks });
  }
}

export const documentController = new DocumentController();
