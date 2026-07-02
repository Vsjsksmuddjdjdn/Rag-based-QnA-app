import { config } from "../config/env.js";
import { JsonStore } from "./jsonStore.js";

export const store = new JsonStore(config.storage.file);
