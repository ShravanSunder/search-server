import { describe, it, expect } from "vitest";
import { rrfClauseSchema } from "../rrf-ranking.schema.js";

describe("rrfClauseSchema", () => {
  describe("ranks field", () => {
    it("accepts single KNN query", () => {
      const clause = {
        ranks: [{ query: "machine learning", returnRank: true, limit: 100 }],
      };
      expect(rrfClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts multiple KNN queries", () => {
      const clause = {
        ranks: [
          { query: "machine learning", returnRank: true, limit: 100 },
          { query: [0.1, 0.2, 0.3], returnRank: true, limit: 100 },
        ],
      };
      expect(rrfClauseSchema.parse(clause)).toEqual(clause);
    });

    it("rejects empty ranks array", () => {
      expect(() => rrfClauseSchema.parse({ ranks: [] })).toThrow();
    });

    it("rejects missing ranks", () => {
      expect(() => rrfClauseSchema.parse({})).toThrow();
    });
  });

  describe("optional k parameter", () => {
    it("accepts k value", () => {
      const clause = {
        ranks: [{ query: "test", returnRank: true }],
        k: 60,
      };
      expect(rrfClauseSchema.parse(clause)).toEqual(clause);
    });

    it("rejects non-positive k", () => {
      expect(() =>
        rrfClauseSchema.parse({
          ranks: [{ query: "test" }],
          k: 0,
        })
      ).toThrow();
      expect(() =>
        rrfClauseSchema.parse({
          ranks: [{ query: "test" }],
          k: -1,
        })
      ).toThrow();
    });

    it("rejects non-integer k", () => {
      expect(() =>
        rrfClauseSchema.parse({
          ranks: [{ query: "test" }],
          k: 60.5,
        })
      ).toThrow();
    });
  });

  describe("weights", () => {
    it("accepts weights array", () => {
      const clause = {
        ranks: [{ query: "test1" }, { query: "test2" }],
        weights: [0.7, 0.3],
      };
      expect(rrfClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts empty weights array", () => {
      const clause = {
        ranks: [{ query: "test" }],
        weights: [],
      };
      expect(rrfClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts decimal weights", () => {
      const clause = {
        ranks: [{ query: "test1" }, { query: "test2" }],
        weights: [0.5, 0.5],
      };
      expect(rrfClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts weights greater than 1", () => {
      const clause = {
        ranks: [{ query: "test1" }, { query: "test2" }],
        weights: [2, 3],
      };
      expect(rrfClauseSchema.parse(clause)).toEqual(clause);
    });
  });

  describe("normalize", () => {
    it("accepts normalize flag", () => {
      const clause = {
        ranks: [{ query: "test1" }, { query: "test2" }],
        weights: [2, 2],
        normalize: true,
      };
      expect(rrfClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts false normalize", () => {
      const clause = {
        ranks: [{ query: "test" }],
        normalize: false,
      };
      expect(rrfClauseSchema.parse(clause)).toEqual(clause);
    });
  });

  describe("full RRF clause", () => {
    it("parses complete hybrid search clause", () => {
      const clause = {
        ranks: [
          {
            query: "machine learning",
            key: "#embedding",
            returnRank: true,
            limit: 200,
          },
          {
            query: "machine learning",
            key: "sparse_embedding",
            returnRank: true,
            limit: 200,
          },
        ],
        k: 60,
        weights: [0.7, 0.3],
        normalize: false,
      };
      expect(rrfClauseSchema.parse(clause)).toEqual(clause);
    });

    it("parses minimal RRF clause", () => {
      const clause = {
        ranks: [{ query: "test" }],
      };
      expect(rrfClauseSchema.parse(clause)).toEqual(clause);
    });
  });
});
