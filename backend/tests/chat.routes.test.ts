import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { store } from "../src/storage/index.js";

const app = createApp();

beforeEach(async () => {
  await store.reset();
});

describe("chat routes", () => {
  it("returns a grounded no-documents answer without calling an LLM", async () => {
    const collection = await request(app)
      .post("/api/collections")
      .send({ name: "Fresh Collection" })
      .expect(201);

    const response = await request(app)
      .post("/api/chat")
      .send({
        collectionId: collection.body.collection.id,
        message: "What is the refund policy?",
        topK: 4,
        retrievalMode: "similarity"
      })
      .expect(200);

    expect(response.body.answer).toContain("I do not know");
    expect(response.body.citations).toEqual([]);

    const history = await request(app)
      .get(`/api/chat/history/${collection.body.collection.id}`)
      .expect(200);
    expect(history.body.messages).toHaveLength(2);
  });
});
