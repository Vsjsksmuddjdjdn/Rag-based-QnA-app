import multer from "multer";
import { config } from "../config/env.js";

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxUploadBytes,
    files: 10
  }
});
