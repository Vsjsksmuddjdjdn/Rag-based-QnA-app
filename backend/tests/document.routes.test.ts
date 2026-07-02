import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { store } from "../src/storage/index.js";

const app = createApp();

beforeEach(async () => {
  await store.reset();
});

describe("document routes", () => {
  it("rejects uploads without a collection id", async () => {
    const response = await request(app)
      .post("/api/documents/upload")
      .attach("documents", Buffer.from("hello"), "note.txt")
      .expect(400);

    expect(response.body.error.code).toBe("COLLECTION_ID_REQUIRED");
  });

  it("returns a per-file failure for unsupported files", async () => {
    const collection = await request(app)
      .post("/api/collections")
      .send({ name: "Security Notes" })
      .expect(201);

    const response = await request(app)
      .post("/api/documents/upload")
      .field("collectionId", collection.body.collection.id)
      .attach("documents", Buffer.from("not a real executable"), "payload.exe")
      .expect(400);

    expect(response.body.successCount).toBe(0);
    expect(response.body.results[0]).toMatchObject({
      ok: false,
      filename: "payload.exe"
    });
  });
});
