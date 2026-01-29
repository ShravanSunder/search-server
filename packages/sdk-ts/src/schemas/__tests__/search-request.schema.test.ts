import { describe, it, expect } from "vitest";
import {
  searchRequestSchema,
  limitClauseSchema,
} from "../search-request.schema.js";

describe("limitClauseSchema", () => {
  it("accepts number directly", () => {
    expect(limitClauseSchema.parse(10)).toBe(10);
  });

  it("accepts object with limit and offset", () => {
    expect(limitClauseSchema.parse({ limit: 10, offset: 20 })).toEqual({
      limit: 10,
      offset: 20,
    });
  });

  it("accepts object with limit only", () => {
    expect(limitClauseSchema.parse({ limit: 10 })).toEqual({ limit: 10 });
  });

  it("rejects negative numbers", () => {
    expect(() => limitClauseSchema.parse(-1)).toThrow();
    expect(() => limitClauseSchema.parse({ limit: -1 })).toThrow();
  });

  it("rejects zero", () => {
    expect(() => limitClauseSchema.parse(0)).toThrow();
    expect(() => limitClauseSchema.parse({ limit: 0 })).toThrow();
  });
});

describe("searchRequestSchema", () => {
  it("parses simple KNN search with text query", () => {
    const request = {
      rank: {
        query: "machine learning",
        limit: 10,
      },
    };
    expect(searchRequestSchema.parse(request)).toEqual(request);
  });

  it("parses KNN search with embedding", () => {
    const request = {
      rank: {
        query: [0.1, 0.2, 0.3, 0.4],
        limit: 100,
      },
    };
    expect(searchRequestSchema.parse(request)).toEqual(request);
  });

  it("parses search with where filter", () => {
    const request = {
      rank: { query: "AI", limit: 10 },
      where: { category: "technology" },
    };
    expect(searchRequestSchema.parse(request)).toEqual(request);
  });

  it("parses search with whereDocument filter", () => {
    const request = {
      rank: { query: "AI", limit: 10 },
      whereDocument: { $contains: "neural network" },
    };
    expect(searchRequestSchema.parse(request)).toEqual(request);
  });

  it("parses search with select clause", () => {
    const request = {
      rank: { query: "AI", limit: 10 },
      select: { keys: ["#document", "#score", "title"] },
    };
    expect(searchRequestSchema.parse(request)).toEqual(request);
  });

  it("parses search with groupBy", () => {
    const request = {
      rank: { query: "AI", limit: 50 },
      groupBy: {
        keys: { field: "category" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 3 } },
      },
    };
    expect(searchRequestSchema.parse(request)).toEqual(request);
  });

  it("parses search with pagination", () => {
    const request = {
      rank: { query: "AI", limit: 100 },
      limit: { limit: 10, offset: 20 },
    };
    expect(searchRequestSchema.parse(request)).toEqual(request);
  });

  it("parses RRF search", () => {
    const request = {
      rank: {
        ranks: [
          { query: "machine learning", returnRank: true, limit: 100 },
          { query: [0.1, 0.2, 0.3], returnRank: true, limit: 100 },
        ],
        k: 60,
        weights: [0.7, 0.3],
      },
    };
    expect(searchRequestSchema.parse(request)).toEqual(request);
  });

  it("parses full featured search request", () => {
    const request = {
      rank: { query: "AI research", limit: 100 },
      where: { category: "technology", year: { $gte: 2023 } },
      whereDocument: { $contains: "transformer" },
      select: { keys: ["#document", "#score", "title", "author"] },
      groupBy: {
        keys: { field: "category" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 2 } },
      },
      limit: { limit: 20, offset: 0 },
    };
    expect(searchRequestSchema.parse(request)).toEqual(request);
  });

  it("rejects search without rank", () => {
    expect(() =>
      searchRequestSchema.parse({ where: { category: "test" } })
    ).toThrow();
  });
});
