import { ChatOpenAI } from "@langchain/openai";
import type { BaseMessageLike } from "@langchain/core/messages";
import { config } from "../config/env.js";
import { AppError } from "../middleware/errors.js";

export interface ChatModelOptions {
  model?: string;
  temperature?: number;
}

export interface ChatProvider {
  generate(
    messages: BaseMessageLike[],
    options: ChatModelOptions,
    onToken?: (token: string) => void
  ): Promise<string>;
}

export class OpenAIChatProvider implements ChatProvider {
  async generate(
    messages: BaseMessageLike[],
    options: ChatModelOptions,
    onToken?: (token: string) => void
  ) {
    if (!config.openai.apiKey) {
      throw new AppError(
        503,
        "OPENAI_API_KEY is missing. Add it to .env before asking questions.",
        "OPENAI_API_KEY_MISSING"
      );
    }

    const client = new ChatOpenAI({
      apiKey: config.openai.apiKey,
      model: options.model || config.openai.chatModel,
      temperature: options.temperature ?? 0.2,
      streaming: Boolean(onToken)
    });

    if (onToken) {
      let answer = "";
      const stream = await client.stream(messages);
      for await (const chunk of stream) {
        const token = contentToString(chunk.content);
        if (!token) continue;
        answer += token;
        onToken(token);
      }
      return answer;
    }

    const response = await client.invoke(messages);
    return contentToString(response.content);
  }
}

export const chatProvider = new OpenAIChatProvider();

function contentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .join("");
  }
  return "";
}
