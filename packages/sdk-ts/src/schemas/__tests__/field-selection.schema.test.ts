import { describe, it, expect } from "vitest";
import {
  builtInFieldSchema,
  selectFieldSchema,
  selectClauseSchema,
  K,
} from "../field-selection.schema.js";

describe("builtInFieldSchema", () => {
  it("accepts #id", () => {
    expect(builtInFieldSchema.parse("#id")).toBe("#id");
  });

  it("accepts #document", () => {
    expect(builtInFieldSchema.parse("#document")).toBe("#document");
  });

  it("accepts #embedding", () => {
    expect(builtInFieldSchema.parse("#embedding")).toBe("#embedding");
  });

  it("accepts #metadata", () => {
    expect(builtInFieldSchema.parse("#metadata")).toBe("#metadata");
  });

  it("accepts #score", () => {
    expect(builtInFieldSchema.parse("#score")).toBe("#score");
  });

  it("rejects unknown built-in field", () => {
    expect(() => builtInFieldSchema.parse("#unknown")).toThrow();
    expect(() => builtInFieldSchema.parse("#distance")).toThrow();
  });
});

describe("selectFieldSchema", () => {
  it("accepts built-in fields", () => {
    expect(selectFieldSchema.parse("#document")).toBe("#document");
    expect(selectFieldSchema.parse("#score")).toBe("#score");
  });

  it("accepts custom metadata field names", () => {
    expect(selectFieldSchema.parse("title")).toBe("title");
    expect(selectFieldSchema.parse("author")).toBe("author");
    expect(selectFieldSchema.parse("published_date")).toBe("published_date");
  });

  it("rejects non-string values", () => {
    expect(() => selectFieldSchema.parse(123)).toThrow();
    expect(() => selectFieldSchema.parse(null)).toThrow();
  });
});

describe("selectClauseSchema", () => {
  it("accepts empty keys array", () => {
    const clause = { keys: [] };
    expect(selectClauseSchema.parse(clause)).toEqual(clause);
  });

  it("accepts built-in fields", () => {
    const clause = { keys: ["#document", "#score"] };
    expect(selectClauseSchema.parse(clause)).toEqual(clause);
  });

  it("accepts metadata fields", () => {
    const clause = { keys: ["title", "author"] };
    expect(selectClauseSchema.parse(clause)).toEqual(clause);
  });

  it("accepts mixed fields", () => {
    const clause = { keys: ["#document", "#score", "title", "author"] };
    expect(selectClauseSchema.parse(clause)).toEqual(clause);
  });

  it("accepts all built-in fields", () => {
    const clause = {
      keys: ["#id", "#document", "#embedding", "#metadata", "#score"],
    };
    expect(selectClauseSchema.parse(clause)).toEqual(clause);
  });

  it("rejects missing keys property", () => {
    expect(() => selectClauseSchema.parse({})).toThrow();
  });

  it("rejects non-array keys", () => {
    expect(() => selectClauseSchema.parse({ keys: "#document" })).toThrow();
  });
});

describe("K constants", () => {
  it("has correct ID constant", () => {
    expect(K.ID).toBe("#id");
  });

  it("has correct DOCUMENT constant", () => {
    expect(K.DOCUMENT).toBe("#document");
  });

  it("has correct EMBEDDING constant", () => {
    expect(K.EMBEDDING).toBe("#embedding");
  });

  it("has correct METADATA constant", () => {
    expect(K.METADATA).toBe("#metadata");
  });

  it("has correct SCORE constant", () => {
    expect(K.SCORE).toBe("#score");
  });

  it("can be used with selectClauseSchema", () => {
    const clause = { keys: [K.DOCUMENT, K.SCORE] };
    expect(selectClauseSchema.parse(clause)).toEqual({
      keys: ["#document", "#score"],
    });
  });
});
