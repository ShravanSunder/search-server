import { describe, it, expect } from "vitest";
import { knnQuerySchema } from "../knn-query.schema.js";

describe("knnQuerySchema", () => {
  describe("query field", () => {
    it("accepts text query", () => {
      const query = { query: "machine learning" };
      expect(knnQuerySchema.parse(query)).toEqual(query);
    });

    it("accepts embedding query", () => {
      const query = { query: [0.1, 0.2, 0.3, 0.4] };
      expect(knnQuerySchema.parse(query)).toEqual(query);
    });

    it("accepts empty embedding array", () => {
      const query = { query: [] };
      expect(knnQuerySchema.parse(query)).toEqual(query);
    });

    it("rejects null query", () => {
      expect(() => knnQuerySchema.parse({ query: null })).toThrow();
    });
  });

  describe("optional fields", () => {
    it("accepts key field", () => {
      const query = { query: "test", key: "#embedding" };
      expect(knnQuerySchema.parse(query)).toEqual(query);
    });

    it("accepts custom embedding key", () => {
      const query = { query: "test", key: "sparse_embedding" };
      expect(knnQuerySchema.parse(query)).toEqual(query);
    });

    it("accepts limit", () => {
      const query = { query: "test", limit: 100 };
      expect(knnQuerySchema.parse(query)).toEqual(query);
    });

    it("rejects non-positive limit", () => {
      expect(() => knnQuerySchema.parse({ query: "test", limit: 0 })).toThrow();
      expect(() =>
        knnQuerySchema.parse({ query: "test", limit: -1 })
      ).toThrow();
    });

    it("rejects non-integer limit", () => {
      expect(() =>
        knnQuerySchema.parse({ query: "test", limit: 10.5 })
      ).toThrow();
    });

    it("accepts returnRank", () => {
      const query = { query: "test", returnRank: true };
      expect(knnQuerySchema.parse(query)).toEqual(query);
    });

    it("accepts default rank value", () => {
      const query = { query: "test", default: 1000 };
      expect(knnQuerySchema.parse(query)).toEqual(query);
    });
  });

  describe("full query", () => {
    it("parses complete KNN query for RRF", () => {
      const query = {
        query: "machine learning applications",
        key: "#embedding",
        limit: 200,
        returnRank: true,
        default: 1000,
      };
      expect(knnQuerySchema.parse(query)).toEqual(query);
    });

    it("parses complete KNN query with embedding", () => {
      const query = {
        query: [0.1, 0.2, 0.3],
        limit: 50,
      };
      expect(knnQuerySchema.parse(query)).toEqual(query);
    });
  });
});
