import { Router } from "express";
import { z } from "zod";
import { collectionController } from "../controllers/collectionController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";

const collectionSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional()
});

export const collectionRoutes = Router();

collectionRoutes.get("/", asyncHandler(collectionController.list.bind(collectionController)));
collectionRoutes.post(
  "/",
  validateBody(collectionSchema),
  asyncHandler(collectionController.create.bind(collectionController))
);
