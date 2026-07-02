import { Router } from "express";
import { vectorStore } from "../rag/vectorStore.js";
import { chatRoutes } from "./chatRoutes.js";
import { collectionRoutes } from "./collectionRoutes.js";
import { documentRoutes } from "./documentRoutes.js";

export const apiRoutes = Router();

apiRoutes.get("/health", async (_req, res) => {
  const vector = await vectorStore.health();
  res.json({
    ok: true,
    service: "rag-document-qa-backend",
    vector
  });
});

apiRoutes.use("/collections", collectionRoutes);
apiRoutes.use("/documents", documentRoutes);
apiRoutes.use("/chat", chatRoutes);
