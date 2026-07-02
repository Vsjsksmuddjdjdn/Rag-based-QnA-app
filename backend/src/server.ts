import { config } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(config.port, () => {
  logger.info(`RAG Document Q&A backend listening on http://localhost:${config.port}`);
});
