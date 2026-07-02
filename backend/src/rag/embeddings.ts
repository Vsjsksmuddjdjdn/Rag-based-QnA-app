import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from "../config/env.js";
import { AppError } from "../middleware/errors.js";

export interface EmbeddingProvider {
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAIEmbeddings | null = null;

  async embedDocuments(texts: string[]) {
    return this.getClient().embedDocuments(texts);
  }

  async embedQuery(text: string) {
    return this.getClient().embedQuery(text);
  }

  private getClient() {
    if (!config.openai.apiKey) {
      throw new AppError(
        503,
        "OPENAI_API_KEY is missing. Add it to .env before indexing documents.",
        "OPENAI_API_KEY_MISSING"
      );
    }

    this.client ??= new OpenAIEmbeddings({
      apiKey: config.openai.apiKey,
      model: config.openai.embeddingModel
    });

    return this.client;
  }
}

export const embeddingProvider = new OpenAIEmbeddingProvider();
