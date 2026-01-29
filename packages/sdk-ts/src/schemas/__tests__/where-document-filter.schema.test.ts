import { describe, it, expect } from "vitest";
import { whereDocumentClauseSchema } from "../where-document-filter.schema.js";

describe("whereDocumentClauseSchema", () => {
  describe("$contains operator", () => {
    it("accepts simple $contains", () => {
      const clause = { $contains: "machine learning" };
      expect(whereDocumentClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts empty string", () => {
      const clause = { $contains: "" };
      expect(whereDocumentClauseSchema.parse(clause)).toEqual(clause);
    });

    it("rejects non-string value", () => {
      expect(() =>
        whereDocumentClauseSchema.parse({ $contains: 123 })
      ).toThrow();
    });
  });

  describe("$not_contains operator", () => {
    it("accepts simple $not_contains", () => {
      const clause = { $not_contains: "deprecated" };
      expect(whereDocumentClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts empty string", () => {
      const clause = { $not_contains: "" };
      expect(whereDocumentClauseSchema.parse(clause)).toEqual(clause);
    });

    it("rejects non-string value", () => {
      expect(() =>
        whereDocumentClauseSchema.parse({ $not_contains: null })
      ).toThrow();
    });
  });

  describe("$and operator", () => {
    it("accepts $and with multiple conditions", () => {
      const clause = {
        $and: [{ $contains: "AI" }, { $not_contains: "deprecated" }],
      };
      expect(whereDocumentClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts $and with single condition", () => {
      const clause = {
        $and: [{ $contains: "test" }],
      };
      expect(whereDocumentClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts empty $and array", () => {
      const clause = { $and: [] };
      expect(whereDocumentClauseSchema.parse(clause)).toEqual(clause);
    });
  });

  describe("$or operator", () => {
    it("accepts $or with multiple conditions", () => {
      const clause = {
        $or: [{ $contains: "AI" }, { $contains: "ML" }],
      };
      expect(whereDocumentClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts $or with single condition", () => {
      const clause = {
        $or: [{ $contains: "test" }],
      };
      expect(whereDocumentClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts empty $or array", () => {
      const clause = { $or: [] };
      expect(whereDocumentClauseSchema.parse(clause)).toEqual(clause);
    });
  });

  describe("nested operators", () => {
    it("accepts nested $and inside $or", () => {
      const clause = {
        $or: [
          { $contains: "AI" },
          {
            $and: [{ $contains: "machine" }, { $contains: "learning" }],
          },
        ],
      };
      expect(whereDocumentClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts nested $or inside $and", () => {
      const clause = {
        $and: [
          { $not_contains: "deprecated" },
          {
            $or: [{ $contains: "AI" }, { $contains: "ML" }],
          },
        ],
      };
      expect(whereDocumentClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts deeply nested conditions", () => {
      const clause = {
        $and: [
          {
            $or: [
              { $contains: "AI" },
              {
                $and: [{ $contains: "deep" }, { $contains: "learning" }],
              },
            ],
          },
          { $not_contains: "deprecated" },
        ],
      };
      expect(whereDocumentClauseSchema.parse(clause)).toEqual(clause);
    });
  });

  describe("invalid cases", () => {
    it("rejects unknown operator", () => {
      expect(() =>
        whereDocumentClauseSchema.parse({ $unknown: "test" })
      ).toThrow();
    });

    it("parses first match when mixed operators present (Zod union behavior)", () => {
      // Zod unions match first valid option - $contains matches first
      const result = whereDocumentClauseSchema.parse({
        $contains: "AI",
        $not_contains: "ML",
      });
      // Only $contains is preserved due to Zod union behavior
      expect(result).toEqual({ $contains: "AI" });
    });

    it("rejects non-array value for $and", () => {
      expect(() =>
        whereDocumentClauseSchema.parse({ $and: { $contains: "test" } })
      ).toThrow();
    });

    it("rejects non-array value for $or", () => {
      expect(() =>
        whereDocumentClauseSchema.parse({ $or: { $contains: "test" } })
      ).toThrow();
    });
  });
});
