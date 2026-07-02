import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { config } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { apiRoutes } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: config.env !== "test"
    })
  );

  app.use("/api", apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
