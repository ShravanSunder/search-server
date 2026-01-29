import { zValidator } from "@hono/zod-validator";
import { batchSearchRequestSchema, searchRequestSchema } from "@search-server/sdk";
import { Hono } from "hono";
import { SearchExecutorService } from "../../services/search-executor.service.js";
import type { AppEnv } from "../app-context.js";
import { getCollectionName } from "./route-utils.js";

export const searchRouter = new Hono<AppEnv>();

// POST / - Search API (main endpoint)
searchRouter.post("/", zValidator("json", searchRequestSchema), async (c) => {
  const name = getCollectionName(c);
  const body = c.req.valid("json");
  const chromaClient = c.get("chromaClient");

  const collection = await chromaClient.getCollection(name);
  const executor = new SearchExecutorService(collection);
  const response = await executor.execute(body);

  return c.json(response);
});

// POST /batch - Batch search
searchRouter.post("/batch", zValidator("json", batchSearchRequestSchema), async (c) => {
  const name = getCollectionName(c);
  const body = c.req.valid("json");
  const chromaClient = c.get("chromaClient");

  const collection = await chromaClient.getCollection(name);
  const executor = new SearchExecutorService(collection);

  const startTime = performance.now();
  const results = await Promise.all(body.searches.map((search) => executor.execute(search)));
  const took = performance.now() - startTime;

  return c.json({
    results,
    took,
  });
});
