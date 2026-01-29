import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createCollectionRequestSchema } from "@search-server/sdk";
import type { AppEnv } from "../app-context.js";
import { getCollectionName } from "./route-utils.js";

export const collectionsRouter = new Hono<AppEnv>();

// POST / - Create collection
collectionsRouter.post(
  "/",
  zValidator("json", createCollectionRequestSchema),
  async (c) => {
    const body = c.req.valid("json");
    const chromaClient = c.get("chromaClient");

    const collection = await chromaClient.createCollection(
      body.name,
      body.metadata,
      body.getOrCreate
    );

    const count = await collection.count();

    return c.json(
      {
        collection: {
          name: collection.name,
          id: collection.id,
          metadata: collection.metadata,
          count,
        },
      },
      201
    );
  }
);

// GET / - List collections
collectionsRouter.get("/", async (c) => {
  const chromaClient = c.get("chromaClient");
  const collections = await chromaClient.listCollections();

  return c.json({
    collections: collections.map((col) => ({
      name: col.name,
      metadata: col.metadata,
    })),
  });
});

// GET /:name - Get collection
collectionsRouter.get("/:name", async (c) => {
  const name = getCollectionName(c);
  const chromaClient = c.get("chromaClient");

  const collection = await chromaClient.getCollection(name);
  const count = await collection.count();

  return c.json({
    collection: {
      name: collection.name,
      id: collection.id,
      metadata: collection.metadata,
      count,
    },
  });
});

// DELETE /:name - Delete collection
collectionsRouter.delete("/:name", async (c) => {
  const name = getCollectionName(c);
  const chromaClient = c.get("chromaClient");

  await chromaClient.deleteCollection(name);

  return c.json({
    deleted: true,
    name,
  });
});
