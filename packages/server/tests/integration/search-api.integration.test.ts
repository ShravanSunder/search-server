/**
 * Integration tests for the Search API
 *
 * These tests require ChromaDB to be running on localhost:8000
 * Run with: pnpm test:integration
 *
 * Start ChromaDB: chroma run --host 0.0.0.0 --port 8000
 */

import type { Hono } from "hono";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AppEnv } from "../../src/server/app-context.js";
import { createApp } from "../../src/server/hono-app.js";
import { ChromaClientService } from "../../src/services/chroma-client.service.js";

describe("Search API Integration", () => {
  let app: Hono<AppEnv>;
  let chromaClient: ChromaClientService;
  const testCollectionName = `test-search-${Date.now()}`;

  beforeAll(async () => {
    chromaClient = new ChromaClientService({
      host: process.env.CHROMA_HOST ?? "localhost",
      port: Number(process.env.CHROMA_PORT) || 8000,
    });

    // Verify ChromaDB is running
    try {
      await chromaClient.heartbeat();
    } catch {
      throw new Error(
        "ChromaDB is not running. Start it with: chroma run --host 0.0.0.0 --port 8000",
      );
    }

    app = createApp({ chromaClient });

    // Create test collection
    const collection = await chromaClient.createCollection(testCollectionName, undefined, true);

    // Add test documents with embeddings
    await collection.add({
      ids: ["doc1", "doc2", "doc3", "doc4", "doc5"],
      embeddings: [
        [0.1, 0.2, 0.3, 0.4, 0.5],
        [0.2, 0.3, 0.4, 0.5, 0.6],
        [0.3, 0.4, 0.5, 0.6, 0.7],
        [0.4, 0.5, 0.6, 0.7, 0.8],
        [0.5, 0.6, 0.7, 0.8, 0.9],
      ],
      metadatas: [
        { category: "AI", year: 2024 },
        { category: "AI", year: 2023 },
        { category: "NLP", year: 2024 },
        { category: "NLP", year: 2023 },
        { category: "ML", year: 2024 },
      ],
    });
  });

  afterAll(async () => {
    // Clean up test collection
    try {
      await chromaClient.deleteCollection(testCollectionName);
    } catch {
      // Collection may not exist
    }
  });

  describe("Health endpoint", () => {
    it("returns ok status when ChromaDB is connected", async () => {
      const res = await app.request("/health", { method: "GET" });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.status).toBe("ok");
      expect(body.chromadb).toBe("connected");
      expect(body.heartbeat).toBeDefined();
    });
  });

  describe("KNN Search", () => {
    it("performs basic KNN search", async () => {
      const res = await app.request(`/collections/${testCollectionName}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rank: { query: [0.2, 0.3, 0.4, 0.5, 0.6], limit: 10 },
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.grouped).toBe(false);
      expect(body.results.length).toBeGreaterThan(0);
      expect(body.results[0].id).toBe("doc2"); // Exact match
    });

    it("applies where filter", async () => {
      const res = await app.request(`/collections/${testCollectionName}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rank: { query: [0.3, 0.4, 0.5, 0.6, 0.7], limit: 10 },
          where: { category: "AI" },
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();

      // All results should have category "AI"
      for (const result of body.results) {
        expect(result.metadata?.category).toBe("AI");
      }
    });

    it("applies pagination with limit and offset", async () => {
      const res = await app.request(`/collections/${testCollectionName}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rank: { query: [0.3, 0.4, 0.5, 0.6, 0.7], limit: 10 },
          limit: { limit: 2, offset: 1 },
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results.length).toBe(2);
    });
  });

  describe("Field Selection", () => {
    it("returns only selected fields", async () => {
      const res = await app.request(`/collections/${testCollectionName}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rank: { query: [0.2, 0.3, 0.4, 0.5, 0.6], limit: 10 },
          select: { keys: ["#score", "category"] },
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();

      for (const result of body.results) {
        expect(result.id).toBeDefined(); // ID is always included
        expect(result.distance).toBeDefined(); // Distance is included with #score
        expect(result.embedding).toBeUndefined(); // Not selected
        // Only category should be in metadata
        if (result.metadata) {
          expect(Object.keys(result.metadata)).toContain("category");
          expect(result.metadata.year).toBeUndefined();
        }
      }
    });
  });

  describe("GroupBy", () => {
    it("groups results by metadata field", async () => {
      const res = await app.request(`/collections/${testCollectionName}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rank: { query: [0.3, 0.4, 0.5, 0.6, 0.7], limit: 10 },
          groupBy: {
            keys: { field: "category" },
            aggregate: { $min_k: { keys: { field: "#distance" }, k: 1 } },
          },
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.grouped).toBe(true);
      expect(body.groups.length).toBe(3); // AI, NLP, ML

      // Each group should have max 1 item
      for (const group of body.groups) {
        expect(group.items.length).toBeLessThanOrEqual(1);
        expect(group.groupKey).toBe("category");
      }
    });
  });

  describe("Collections CRUD", () => {
    const crudCollectionName = `test-crud-${Date.now()}`;

    afterAll(async () => {
      try {
        await chromaClient.deleteCollection(crudCollectionName);
      } catch {
        // Collection may not exist
      }
    });

    it("creates a new collection", async () => {
      const res = await app.request("/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: crudCollectionName }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.collection.name).toBe(crudCollectionName);
      expect(body.collection.count).toBe(0);
    });

    it("lists collections", async () => {
      const res = await app.request("/collections", { method: "GET" });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.collections).toBeInstanceOf(Array);

      const collectionNames = body.collections.map((c: { name: string }) => c.name);
      expect(collectionNames).toContain(crudCollectionName);
    });

    it("gets a specific collection", async () => {
      const res = await app.request(`/collections/${crudCollectionName}`, {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.collection.name).toBe(crudCollectionName);
    });

    it("deletes a collection", async () => {
      const res = await app.request(`/collections/${crudCollectionName}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);

      // Verify it's deleted
      const listRes = await app.request("/collections", { method: "GET" });
      const listBody = await listRes.json();
      const collectionNames = listBody.collections.map((c: { name: string }) => c.name);
      expect(collectionNames).not.toContain(crudCollectionName);
    });
  });

  describe("Document Operations", () => {
    const docCollectionName = `test-docs-${Date.now()}`;

    beforeAll(async () => {
      await chromaClient.createCollection(docCollectionName, undefined, true);
    });

    afterAll(async () => {
      try {
        await chromaClient.deleteCollection(docCollectionName);
      } catch {
        // Collection may not exist
      }
    });

    it("adds documents with embeddings", async () => {
      const res = await app.request(`/collections/${docCollectionName}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: ["d1", "d2"],
          embeddings: [
            [0.1, 0.2, 0.3],
            [0.4, 0.5, 0.6],
          ],
          metadatas: [{ type: "a" }, { type: "b" }],
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.added).toBe(2);
    });

    it("gets document count", async () => {
      const res = await app.request(`/collections/${docCollectionName}/count`, {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.count).toBe(2);
    });

    it("gets documents by ID", async () => {
      const res = await app.request(`/collections/${docCollectionName}/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ["d1"] }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ids).toContain("d1");
    });

    it("updates documents", async () => {
      const res = await app.request(`/collections/${docCollectionName}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: ["d1"],
          metadatas: [{ type: "updated" }],
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(1);

      // Verify update
      const getRes = await app.request(`/collections/${docCollectionName}/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ["d1"] }),
      });
      const getBody = await getRes.json();
      expect(getBody.metadatas?.[0]?.type).toBe("updated");
    });

    it("deletes documents by ID", async () => {
      const res = await app.request(`/collections/${docCollectionName}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ["d2"] }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);

      // Verify deletion
      const countRes = await app.request(`/collections/${docCollectionName}/count`, {
        method: "GET",
      });
      const countBody = await countRes.json();
      expect(countBody.count).toBe(1);
    });
  });
});
