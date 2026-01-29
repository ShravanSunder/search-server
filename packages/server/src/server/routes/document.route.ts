import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  addDocumentsRequestSchema,
  getDocumentsRequestSchema,
  queryDocumentsRequestSchema,
  updateDocumentsRequestSchema,
  upsertDocumentsRequestSchema,
  deleteDocumentsRequestSchema,
  peekDocumentsRequestSchema,
} from "@search-server/sdk";
import type { AppEnv } from "../app-context.js";
import { getCollectionName } from "./route-utils.js";

export const documentsRouter = new Hono<AppEnv>();

// POST /add - Add documents
documentsRouter.post(
  "/add",
  zValidator("json", addDocumentsRequestSchema),
  async (c) => {
    const name = getCollectionName(c);
    const body = c.req.valid("json");
    const chromaClient = c.get("chromaClient");

    const collection = await chromaClient.getCollection(name);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addParams: any = { ids: [...body.ids] };
    if (body.documents) addParams.documents = [...body.documents];
    if (body.embeddings)
      addParams.embeddings = body.embeddings.map((e) => [...e]);
    if (body.metadatas) addParams.metadatas = [...body.metadatas];

    await collection.add(addParams);

    return c.json({ added: body.ids.length, ids: body.ids }, 201);
  }
);

// POST /get - Get documents
documentsRouter.post(
  "/get",
  zValidator("json", getDocumentsRequestSchema),
  async (c) => {
    const name = getCollectionName(c);
    const body = c.req.valid("json");
    const chromaClient = c.get("chromaClient");

    const collection = await chromaClient.getCollection(name);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getParams: any = {};
    if (body.ids) getParams.ids = [...body.ids];
    if (body.where) getParams.where = body.where;
    if (body.whereDocument) getParams.whereDocument = body.whereDocument;
    if (body.limit) getParams.limit = body.limit;
    if (body.offset) getParams.offset = body.offset;
    if (body.include) getParams.include = [...body.include];

    const results = await collection.get(getParams);

    return c.json({
      ids: results.ids,
      documents: results.documents,
      embeddings: results.embeddings,
      metadatas: results.metadatas,
    });
  }
);

// POST /query - Standard ChromaDB query
documentsRouter.post(
  "/query",
  zValidator("json", queryDocumentsRequestSchema),
  async (c) => {
    const name = getCollectionName(c);
    const body = c.req.valid("json");
    const chromaClient = c.get("chromaClient");

    const collection = await chromaClient.getCollection(name);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryParams: any = { nResults: body.nResults ?? 10 };
    if (body.queryEmbeddings)
      queryParams.queryEmbeddings = body.queryEmbeddings.map((e) => [...e]);
    if (body.queryTexts) queryParams.queryTexts = [...body.queryTexts];
    if (body.where) queryParams.where = body.where;
    if (body.whereDocument) queryParams.whereDocument = body.whereDocument;
    if (body.include) queryParams.include = [...body.include];

    const results = await collection.query(queryParams);

    return c.json({
      ids: results.ids,
      documents: results.documents,
      embeddings: results.embeddings,
      metadatas: results.metadatas,
      distances: results.distances,
    });
  }
);

// POST /update - Update documents
documentsRouter.post(
  "/update",
  zValidator("json", updateDocumentsRequestSchema),
  async (c) => {
    const name = getCollectionName(c);
    const body = c.req.valid("json");
    const chromaClient = c.get("chromaClient");

    const collection = await chromaClient.getCollection(name);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateParams: any = { ids: [...body.ids] };
    if (body.documents) updateParams.documents = [...body.documents];
    if (body.embeddings)
      updateParams.embeddings = body.embeddings.map((e) => [...e]);
    if (body.metadatas) updateParams.metadatas = [...body.metadatas];

    await collection.update(updateParams);

    return c.json({ updated: body.ids.length });
  }
);

// POST /upsert - Upsert documents
documentsRouter.post(
  "/upsert",
  zValidator("json", upsertDocumentsRequestSchema),
  async (c) => {
    const name = getCollectionName(c);
    const body = c.req.valid("json");
    const chromaClient = c.get("chromaClient");

    const collection = await chromaClient.getCollection(name);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upsertParams: any = { ids: [...body.ids] };
    if (body.documents) upsertParams.documents = [...body.documents];
    if (body.embeddings)
      upsertParams.embeddings = body.embeddings.map((e) => [...e]);
    if (body.metadatas) upsertParams.metadatas = [...body.metadatas];

    await collection.upsert(upsertParams);

    return c.json({ upserted: body.ids.length });
  }
);

// DELETE /documents - Delete documents
documentsRouter.delete(
  "/documents",
  zValidator("json", deleteDocumentsRequestSchema),
  async (c) => {
    const name = getCollectionName(c);
    const body = c.req.valid("json");
    const chromaClient = c.get("chromaClient");

    const collection = await chromaClient.getCollection(name);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deleteParams: any = {};
    if (body.ids) deleteParams.ids = [...body.ids];
    if (body.where) deleteParams.where = body.where;
    if (body.whereDocument) deleteParams.whereDocument = body.whereDocument;

    await collection.delete(deleteParams);

    return c.json({ deleted: true });
  }
);

// GET /count - Count documents
documentsRouter.get("/count", async (c) => {
  const name = getCollectionName(c);
  const chromaClient = c.get("chromaClient");

  const collection = await chromaClient.getCollection(name);
  const count = await collection.count();

  return c.json({ count });
});

// POST /peek - Peek documents
documentsRouter.post(
  "/peek",
  zValidator("json", peekDocumentsRequestSchema),
  async (c) => {
    const name = getCollectionName(c);
    const body = c.req.valid("json");
    const chromaClient = c.get("chromaClient");

    const collection = await chromaClient.getCollection(name);
    const results = await collection.peek({ limit: body.limit });

    return c.json({
      ids: results.ids,
      documents: results.documents,
      embeddings: results.embeddings,
      metadatas: results.metadatas,
    });
  }
);
