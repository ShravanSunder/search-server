import { describe, it, expect } from "vitest";
import {
  searchResultItemSchema,
  searchResponseSchema,
  ungroupedSearchResponseSchema,
  groupedSearchResponseSchema,
} from "../search-response.schema.js";

describe("searchResultItemSchema", () => {
  it("parses minimal result item", () => {
    const item = { id: "doc-1" };
    expect(searchResultItemSchema.parse(item)).toEqual(item);
  });

  it("parses full result item", () => {
    const item = {
      id: "doc-1",
      document: "Hello world",
      embedding: [0.1, 0.2, 0.3],
      metadata: { title: "Test", year: 2024 },
      score: 0.95,
      distance: 0.05,
    };
    expect(searchResultItemSchema.parse(item)).toEqual(item);
  });

  it("rejects item without id", () => {
    expect(() =>
      searchResultItemSchema.parse({ document: "Hello" })
    ).toThrow();
  });

  it("rejects item with empty id", () => {
    expect(() => searchResultItemSchema.parse({ id: "" })).toThrow();
  });
});

describe("ungroupedSearchResponseSchema", () => {
  it("parses valid ungrouped response", () => {
    const response = {
      grouped: false,
      results: [
        { id: "doc-1", score: 0.9 },
        { id: "doc-2", score: 0.8 },
      ],
      total: 2,
      took: 15.5,
    };
    expect(ungroupedSearchResponseSchema.parse(response)).toEqual(response);
  });

  it("parses empty results", () => {
    const response = {
      grouped: false,
      results: [],
      total: 0,
      took: 5.0,
    };
    expect(ungroupedSearchResponseSchema.parse(response)).toEqual(response);
  });

  it("rejects if grouped is true", () => {
    expect(() =>
      ungroupedSearchResponseSchema.parse({
        grouped: true,
        results: [],
        total: 0,
        took: 5.0,
      })
    ).toThrow();
  });
});

describe("groupedSearchResponseSchema", () => {
  it("parses valid grouped response", () => {
    const response = {
      grouped: true,
      groups: [
        {
          groupKey: "category",
          groupValue: "electronics",
          items: [{ id: "doc-1", score: 0.9 }],
        },
        {
          groupKey: "category",
          groupValue: "books",
          items: [{ id: "doc-2", score: 0.8 }],
        },
      ],
      totalGroups: 2,
      totalItems: 2,
      took: 20.0,
    };
    expect(groupedSearchResponseSchema.parse(response)).toEqual(response);
  });

  it("parses empty groups", () => {
    const response = {
      grouped: true,
      groups: [],
      totalGroups: 0,
      totalItems: 0,
      took: 5.0,
    };
    expect(groupedSearchResponseSchema.parse(response)).toEqual(response);
  });

  it("rejects if grouped is false", () => {
    expect(() =>
      groupedSearchResponseSchema.parse({
        grouped: false,
        groups: [],
        totalGroups: 0,
        totalItems: 0,
        took: 5.0,
      })
    ).toThrow();
  });
});

describe("searchResponseSchema (discriminated union)", () => {
  it("parses ungrouped response", () => {
    const response = {
      grouped: false,
      results: [{ id: "doc-1", score: 0.9 }],
      total: 1,
      took: 10.0,
    };
    const parsed = searchResponseSchema.parse(response);
    expect(parsed.grouped).toBe(false);
    if (parsed.grouped === false) {
      expect(parsed.results).toHaveLength(1);
      expect(parsed.total).toBe(1);
    }
  });

  it("parses grouped response", () => {
    const response = {
      grouped: true,
      groups: [
        {
          groupKey: "category",
          groupValue: "tech",
          items: [{ id: "doc-1" }],
        },
      ],
      totalGroups: 1,
      totalItems: 1,
      took: 10.0,
    };
    const parsed = searchResponseSchema.parse(response);
    expect(parsed.grouped).toBe(true);
    if (parsed.grouped === true) {
      expect(parsed.groups).toHaveLength(1);
      expect(parsed.totalGroups).toBe(1);
    }
  });

  it("narrows type based on grouped discriminator", () => {
    const response = searchResponseSchema.parse({
      grouped: false,
      results: [],
      total: 0,
      took: 5.0,
    });

    // TypeScript should narrow this correctly
    if (response.grouped === false) {
      expect(response.results).toBeDefined();
      expect(response.total).toBeDefined();
    } else {
      expect(response.groups).toBeDefined();
      expect(response.totalGroups).toBeDefined();
    }
  });
});
