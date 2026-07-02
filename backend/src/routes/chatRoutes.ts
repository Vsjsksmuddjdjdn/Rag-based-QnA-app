import { Router } from "express";
import { z } from "zod";
import { chatController } from "../controllers/chatController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";

const chatSchema = z.object({
  collectionId: z.string().min(1),
  message: z.string().trim().min(1).max(4000),
  topK: z.number().int().min(1).max(12).optional(),
  temperature: z.number().min(0).max(1.5).optional(),
  model: z.string().trim().min(1).max(80).optional(),
  retrievalMode: z.enum(["similarity", "mmr"]).optional(),
  showContext: z.boolean().optional(),
  stream: z.boolean().optional()
});

export const chatRoutes = Router();

chatRoutes.post("/", validateBody(chatSchema), asyncHandler(chatController.chat.bind(chatController)));
chatRoutes.get(
  "/history/:collectionId",
  asyncHandler(chatController.history.bind(chatController))
);
chatRoutes.delete(
  "/history/:collectionId",
  asyncHandler(chatController.clearHistory.bind(chatController))
);
