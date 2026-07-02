import type { Request, Response } from "express";
import { chatService } from "../services/chatService.js";

export class ChatController {
  async chat(req: Request, res: Response) {
    if (req.body.stream) {
      await this.streamChat(req, res);
      return;
    }

    const result = await chatService.answer(req.body);
    res.json(result);
  }

  async history(req: Request, res: Response) {
    const messages = await chatService.history(req.params.collectionId);
    res.json({ messages });
  }

  async clearHistory(req: Request, res: Response) {
    const removed = await chatService.clearHistory(req.params.collectionId);
    res.json({ removed });
  }

  private async streamChat(req: Request, res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const result = await chatService.answer(req.body, (token) => {
        send("token", { token });
      });

      send("done", result);
      res.end();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Chat failed.";
      send("error", { message });
      res.end();
    }
  }
}

export const chatController = new ChatController();
