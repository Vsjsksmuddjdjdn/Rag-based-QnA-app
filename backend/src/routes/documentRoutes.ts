import { Router } from "express";
import { documentController } from "../controllers/documentController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { uploadMiddleware } from "../middleware/upload.js";

export const documentRoutes = Router();

documentRoutes.get("/", asyncHandler(documentController.list.bind(documentController)));
documentRoutes.post(
  "/upload",
  uploadMiddleware.array("documents", 10),
  asyncHandler(documentController.upload.bind(documentController))
);
documentRoutes.get("/:id/chunks", asyncHandler(documentController.chunks.bind(documentController)));
documentRoutes.post("/:id/reindex", asyncHandler(documentController.reindex.bind(documentController)));
documentRoutes.delete("/:id", asyncHandler(documentController.remove.bind(documentController)));
