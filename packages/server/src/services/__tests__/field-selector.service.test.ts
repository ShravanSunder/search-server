import { describe, it, expect } from "vitest";
import { FieldSelectorService } from "../field-selector.service.js";
import type { SearchResultItem, SelectClause } from "@search-server/sdk";

describe("FieldSelectorService", () => {
  const service = new FieldSelectorService();

  const fullItem: SearchResultItem = {
    id: "doc1",
    document: "Hello world",
    embedding: [0.1, 0.2, 0.3],
    metadata: { title: "Test", author: "John", year: 2024 },
    score: 0.95,
    distance: 0.05,
  };

  describe("built-in fields", () => {
    it("always includes id regardless of selection", () => {
      const select: SelectClause = { keys: ["#document"] };
      const result = service.process([fullItem], select);

      expect(result[0]?.id).toBe("doc1");
    });

    it("includes #document when selected", () => {
      const select: SelectClause = { keys: ["#document"] };
      const result = service.process([fullItem], select);

      expect(result[0]?.document).toBe("Hello world");
      expect(result[0]?.embedding).toBeUndefined();
      expect(result[0]?.metadata).toBeUndefined();
      expect(result[0]?.score).toBeUndefined();
    });

    it("includes #embedding when selected", () => {
      const select: SelectClause = { keys: ["#embedding"] };
      const result = service.process([fullItem], select);

      expect(result[0]?.embedding).toEqual([0.1, 0.2, 0.3]);
      expect(result[0]?.document).toBeUndefined();
    });

    it("includes #score and #distance when #score is selected", () => {
      const select: SelectClause = { keys: ["#score"] };
      const result = service.process([fullItem], select);

      expect(result[0]?.score).toBe(0.95);
      expect(result[0]?.distance).toBe(0.05);
    });

    it("includes #metadata when selected", () => {
      const select: SelectClause = { keys: ["#metadata"] };
      const result = service.process([fullItem], select);

      expect(result[0]?.metadata).toEqual({
        title: "Test",
        author: "John",
        year: 2024,
      });
    });

    it("includes multiple built-in fields when selected", () => {
      const select: SelectClause = { keys: ["#document", "#score"] };
      const result = service.process([fullItem], select);

      expect(result[0]?.document).toBe("Hello world");
      expect(result[0]?.score).toBe(0.95);
      expect(result[0]?.embedding).toBeUndefined();
    });
  });

  describe("specific metadata fields", () => {
    it("includes only specified metadata fields", () => {
      const select: SelectClause = { keys: ["title", "author"] };
      const result = service.process([fullItem], select);

      expect(result[0]?.metadata).toEqual({ title: "Test", author: "John" });
    });

    it("excludes non-selected metadata fields", () => {
      const select: SelectClause = { keys: ["title"] };
      const result = service.process([fullItem], select);

      expect(result[0]?.metadata?.["title"]).toBe("Test");
      expect(result[0]?.metadata?.["author"]).toBeUndefined();
      expect(result[0]?.metadata?.["year"]).toBeUndefined();
    });

    it("handles non-existent metadata field gracefully", () => {
      const select: SelectClause = { keys: ["nonexistent"] };
      const result = service.process([fullItem], select);

      // Should not include metadata if no fields match
      expect(result[0]?.metadata).toBeUndefined();
    });

    it("includes both built-in and metadata fields", () => {
      const select: SelectClause = { keys: ["#score", "title", "author"] };
      const result = service.process([fullItem], select);

      expect(result[0]?.score).toBe(0.95);
      expect(result[0]?.metadata).toEqual({ title: "Test", author: "John" });
      expect(result[0]?.document).toBeUndefined();
    });
  });

  describe("empty selection (all fields)", () => {
    it("includes all fields when keys array is empty", () => {
      const select: SelectClause = { keys: [] };
      const result = service.process([fullItem], select);

      expect(result[0]).toEqual(fullItem);
    });
  });

  describe("multiple items", () => {
    it("applies selection to all items", () => {
      const items: SearchResultItem[] = [
        {
          id: "doc1",
          document: "First",
          metadata: { title: "One" },
          score: 0.9,
        },
        {
          id: "doc2",
          document: "Second",
          metadata: { title: "Two" },
          score: 0.8,
        },
      ];

      const select: SelectClause = { keys: ["#score"] };
      const result = service.process(items, select);

      expect(result.length).toBe(2);
      expect(result[0]?.document).toBeUndefined();
      expect(result[1]?.document).toBeUndefined();
      expect(result[0]?.score).toBe(0.9);
      expect(result[1]?.score).toBe(0.8);
    });

    it("returns empty array for empty input", () => {
      const select: SelectClause = { keys: ["#document"] };
      const result = service.process([], select);

      expect(result).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("handles item with missing optional fields", () => {
      const minimalItem: SearchResultItem = { id: "doc1" };
      const select: SelectClause = { keys: ["#document", "#score", "title"] };
      const result = service.process([minimalItem], select);

      expect(result[0]).toEqual({ id: "doc1" });
    });

    it("handles item with null/undefined values gracefully", () => {
      const itemWithUndefined: SearchResultItem = {
        id: "doc1",
        document: undefined,
        metadata: undefined,
        score: undefined,
      };

      const select: SelectClause = { keys: ["#document", "#metadata", "#score"] };
      const result = service.process([itemWithUndefined], select);

      expect(result[0]).toEqual({ id: "doc1" });
    });

    it("does not mutate original items", () => {
      const originalItem: SearchResultItem = {
        id: "doc1",
        document: "Hello",
        metadata: { title: "Test" },
      };
      const originalCopy = JSON.parse(JSON.stringify(originalItem));

      const select: SelectClause = { keys: ["#score"] };
      service.process([originalItem], select);

      expect(originalItem).toEqual(originalCopy);
    });

    it("handles metadata with various value types", () => {
      const itemWithVariousTypes: SearchResultItem = {
        id: "doc1",
        metadata: {
          strField: "string",
          numField: 42,
          boolField: true,
        },
      };

      const select: SelectClause = { keys: ["strField", "numField", "boolField"] };
      const result = service.process([itemWithVariousTypes], select);

      expect(result[0]?.metadata).toEqual({
        strField: "string",
        numField: 42,
        boolField: true,
      });
    });

    it("handles #metadata taking precedence over specific fields", () => {
      const select: SelectClause = { keys: ["#metadata", "title"] };
      const result = service.process([fullItem], select);

      // When #metadata is present, all metadata is included
      expect(result[0]?.metadata).toEqual({
        title: "Test",
        author: "John",
        year: 2024,
      });
    });

    it("handles item with only distance, no score", () => {
      const itemWithDistance: SearchResultItem = {
        id: "doc1",
        distance: 0.15,
      };

      const select: SelectClause = { keys: ["#score"] };
      const result = service.process([itemWithDistance], select);

      expect(result[0]?.distance).toBe(0.15);
      expect(result[0]?.score).toBeUndefined();
    });
  });
});
