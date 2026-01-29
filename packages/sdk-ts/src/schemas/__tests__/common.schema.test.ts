import { describe, it, expect } from "vitest";
import {
  metadataValueSchema,
  defaultMetadataSchema,
  embeddingSchema,
  documentIdSchema,
  documentContentSchema,
  apiErrorSchema,
  createDocumentSchema,
} from "../common.schema.js";
import { z } from "zod";

describe("metadataValueSchema", () => {
  it("accepts string values", () => {
    expect(metadataValueSchema.parse("hello")).toBe("hello");
  });

  it("accepts number values", () => {
    expect(metadataValueSchema.parse(42)).toBe(42);
    expect(metadataValueSchema.parse(3.14)).toBe(3.14);
  });

  it("accepts boolean values", () => {
    expect(metadataValueSchema.parse(true)).toBe(true);
    expect(metadataValueSchema.parse(false)).toBe(false);
  });

  it("rejects null and undefined", () => {
    expect(() => metadataValueSchema.parse(null)).toThrow();
    expect(() => metadataValueSchema.parse(undefined)).toThrow();
  });

  it("rejects objects and arrays", () => {
    expect(() => metadataValueSchema.parse({})).toThrow();
    expect(() => metadataValueSchema.parse([])).toThrow();
  });
});

describe("defaultMetadataSchema", () => {
  it("accepts record of string to metadata values", () => {
    const meta = { key1: "string", key2: 42, key3: true };
    expect(defaultMetadataSchema.parse(meta)).toEqual(meta);
  });

  it("accepts empty object", () => {
    expect(defaultMetadataSchema.parse({})).toEqual({});
  });
});

describe("embeddingSchema", () => {
  it("accepts array of numbers", () => {
    const embedding = [0.1, 0.2, 0.3];
    expect(embeddingSchema.parse(embedding)).toEqual(embedding);
  });

  it("accepts empty array", () => {
    expect(embeddingSchema.parse([])).toEqual([]);
  });

  it("rejects array with non-numbers", () => {
    expect(() => embeddingSchema.parse(["a", "b"])).toThrow();
    expect(() => embeddingSchema.parse([1, "2", 3])).toThrow();
  });
});

describe("documentIdSchema", () => {
  it("accepts non-empty strings", () => {
    expect(documentIdSchema.parse("doc-123")).toBe("doc-123");
  });

  it("rejects empty strings", () => {
    expect(() => documentIdSchema.parse("")).toThrow();
  });
});

describe("documentContentSchema", () => {
  it("accepts any string", () => {
    expect(documentContentSchema.parse("Hello world")).toBe("Hello world");
    expect(documentContentSchema.parse("")).toBe("");
  });
});

describe("createDocumentSchema", () => {
  it("creates schema with custom metadata type", () => {
    const articleMetadataSchema = z.object({
      title: z.string(),
      author: z.string(),
      publishedAt: z.number(),
    });

    const articleDocumentSchema = createDocumentSchema(articleMetadataSchema);

    const validDoc = {
      id: "article-1",
      content: "Article content",
      metadata: {
        title: "My Article",
        author: "John Doe",
        publishedAt: 1704067200000,
      },
    };

    expect(articleDocumentSchema.parse(validDoc)).toEqual(validDoc);
  });
});

describe("apiErrorSchema", () => {
  it("parses valid error with required fields", () => {
    const error = { code: "NOT_FOUND", message: "Resource not found" };
    expect(apiErrorSchema.parse(error)).toEqual(error);
  });

  it("parses error with optional details", () => {
    const error = {
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      details: { field: "name", issue: "required" },
    };
    expect(apiErrorSchema.parse(error)).toEqual(error);
  });

  it("rejects error without required fields", () => {
    expect(() => apiErrorSchema.parse({ code: "ERROR" })).toThrow();
    expect(() => apiErrorSchema.parse({ message: "Error" })).toThrow();
  });
});
