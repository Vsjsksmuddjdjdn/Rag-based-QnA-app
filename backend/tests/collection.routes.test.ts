import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { store } from "../src/storage/index.js";

const app = createApp();

beforeEach(async () => {
  await store.reset();
});

describe("collection routes", () => {
  it("creates and lists collections with summary counts", async () => {
    const created = await request(app)
      .post("/api/collections")
      .send({ name: "Operating System Notes", description: "Semester PDFs" })
      .expect(201);

    expect(created.body.collection.name).toBe("Operating System Notes");

    const listed = await request(app).get("/api/collections").expect(200);
    expect(listed.body.collections).toHaveLength(1);
    expect(listed.body.collections[0]).toMatchObject({
      name: "Operating System Notes",
      documentCount: 0,
      readyDocumentCount: 0,
      chunkCount: 0
    });
  });

  it("rejects duplicate collection names", async () => {
    await request(app).post("/api/collections").send({ name: "ML Papers" }).expect(201);
    const duplicate = await request(app).post("/api/collections").send({ name: "ml papers" }).expect(409);
    expect(duplicate.body.error.code).toBe("DUPLICATE_COLLECTION");
  });

  it("validates collection payloads", async () => {
    const response = await request(app).post("/api/collections").send({ name: "A" }).expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
