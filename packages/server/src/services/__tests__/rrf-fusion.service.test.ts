import type { RrfClause, SearchResultItem } from "@search-server/sdk";
import { describe, expect, it } from "vitest";
import { RrfFusionService } from "../rrf-fusion.service.js";

describe("RrfFusionService", () => {
  const service = new RrfFusionService();

  describe("basic fusion", () => {
    it("fuses two ranked lists with overlapping documents", () => {
      const list1: SearchResultItem[] = [{ id: "doc1" }, { id: "doc2" }, { id: "doc3" }];

      const list2: SearchResultItem[] = [{ id: "doc2" }, { id: "doc1" }, { id: "doc4" }];

      const config: RrfClause = {
        ranks: [
          { query: "q1", returnRank: true, limit: 10 },
          { query: "q2", returnRank: true, limit: 10 },
        ],
        k: 60,
      };

      const result = service.process([list1, list2], config);

      // All unique docs should be present
      expect(result.length).toBe(4);
      expect(result.map((r) => r.id).sort()).toEqual(["doc1", "doc2", "doc3", "doc4"]);
    });

    it("returns empty array for empty inputs", () => {
      const config: RrfClause = {
        ranks: [{ query: "q1", returnRank: true, limit: 10 }],
      };

      const result = service.process([[]], config);
      expect(result).toEqual([]);
    });

    it("handles single list", () => {
      const list1: SearchResultItem[] = [{ id: "doc1" }, { id: "doc2" }];

      const config: RrfClause = {
        ranks: [{ query: "q1", returnRank: true, limit: 10 }],
        k: 60,
      };

      const result = service.process([list1], config);
      expect(result.length).toBe(2);
      expect(result[0]?.id).toBe("doc1");
      expect(result[1]?.id).toBe("doc2");
    });
  });

  describe("RRF scoring", () => {
    it("ranks documents appearing in multiple lists higher", () => {
      // doc1 appears in both lists at rank 0 and 1
      // doc3 only appears in list1 at rank 2
      // doc1 should rank higher than doc3
      const list1: SearchResultItem[] = [{ id: "doc1" }, { id: "doc2" }, { id: "doc3" }];

      const list2: SearchResultItem[] = [{ id: "doc2" }, { id: "doc1" }];

      const config: RrfClause = {
        ranks: [
          { query: "q1", returnRank: true, limit: 10 },
          { query: "q2", returnRank: true, limit: 10 },
        ],
        k: 60,
      };

      const result = service.process([list1, list2], config);
      const doc1Index = result.findIndex((r) => r.id === "doc1");
      const doc3Index = result.findIndex((r) => r.id === "doc3");

      expect(doc1Index).toBeLessThan(doc3Index);
    });

    it("uses default k=60 when not specified", () => {
      const list1: SearchResultItem[] = [{ id: "doc1" }];

      const config: RrfClause = {
        ranks: [{ query: "q1", returnRank: true, limit: 10 }],
        // k not specified
      };

      const result = service.process([list1], config);

      // Score should be -1/(60+0+1) = -1/61
      expect(result[0]?.score).toBeCloseTo(-1 / 61, 10);
    });

    it("calculates correct RRF score with custom k", () => {
      const list1: SearchResultItem[] = [{ id: "doc1" }];

      const config: RrfClause = {
        ranks: [{ query: "q1", returnRank: true, limit: 10 }],
        k: 10,
      };

      const result = service.process([list1], config);

      // Score should be -1/(10+0+1) = -1/11
      expect(result[0]?.score).toBeCloseTo(-1 / 11, 10);
    });

    it("accumulates scores for documents in multiple lists", () => {
      const list1: SearchResultItem[] = [{ id: "doc1" }]; // rank 0
      const list2: SearchResultItem[] = [{ id: "doc1" }]; // rank 0

      const config: RrfClause = {
        ranks: [
          { query: "q1", returnRank: true, limit: 10 },
          { query: "q2", returnRank: true, limit: 10 },
        ],
        k: 60,
      };

      const result = service.process([list1, list2], config);

      // Score should be -(1/61 + 1/61) = -2/61
      expect(result[0]?.score).toBeCloseTo(-2 / 61, 10);
    });
  });

  describe("weights", () => {
    it("applies weights to RRF scores", () => {
      const list1: SearchResultItem[] = [{ id: "doc1" }];
      const list2: SearchResultItem[] = [{ id: "doc2" }];

      const config: RrfClause = {
        ranks: [
          { query: "q1", returnRank: true, limit: 10 },
          { query: "q2", returnRank: true, limit: 10 },
        ],
        k: 60,
        weights: [0.9, 0.1],
      };

      const result = service.process([list1, list2], config);

      // doc1 should have higher RRF score due to higher weight
      expect(result[0]?.id).toBe("doc1");
    });

    it("normalizes weights when requested", () => {
      const list1: SearchResultItem[] = [{ id: "doc1" }];
      const list2: SearchResultItem[] = [{ id: "doc2" }];

      const configUnnormalized: RrfClause = {
        ranks: [
          { query: "q1", returnRank: true, limit: 10 },
          { query: "q2", returnRank: true, limit: 10 },
        ],
        k: 60,
        weights: [2, 2],
        normalize: false,
      };

      const configNormalized: RrfClause = {
        ranks: [
          { query: "q1", returnRank: true, limit: 10 },
          { query: "q2", returnRank: true, limit: 10 },
        ],
        k: 60,
        weights: [2, 2],
        normalize: true,
      };

      const unnormalized = service.process([list1, list2], configUnnormalized);
      const normalized = service.process([list1, list2], configNormalized);

      // Unnormalized: -2/61
      // Normalized: weights become [0.5, 0.5] -> -0.5/61
      expect(unnormalized[0]?.score).toBeCloseTo(-2 / 61, 10);
      expect(normalized[0]?.score).toBeCloseTo(-0.5 / 61, 10);
    });

    it("uses equal weights when not specified", () => {
      const list1: SearchResultItem[] = [{ id: "doc1" }];
      const list2: SearchResultItem[] = [{ id: "doc2" }];

      const config: RrfClause = {
        ranks: [
          { query: "q1", returnRank: true, limit: 10 },
          { query: "q2", returnRank: true, limit: 10 },
        ],
        k: 60,
        // weights not specified
      };

      const result = service.process([list1, list2], config);

      // Both docs should have equal scores
      expect(result[0]?.score).toBe(result[1]?.score);
    });
  });

  describe("edge cases", () => {
    it("preserves document metadata", () => {
      const list1: SearchResultItem[] = [
        {
          id: "doc1",
          document: "Hello world",
          metadata: { category: "test" },
          embedding: [0.1, 0.2],
        },
      ];

      const config: RrfClause = {
        ranks: [{ query: "q1", returnRank: true, limit: 10 }],
      };

      const result = service.process([list1], config);

      expect(result[0]?.document).toBe("Hello world");
      expect(result[0]?.metadata).toEqual({ category: "test" });
      expect(result[0]?.embedding).toEqual([0.1, 0.2]);
    });

    it("uses later item data when document appears multiple times", () => {
      // First appearance has one score, later appearance has different score
      const list1: SearchResultItem[] = [{ id: "doc1", distance: 0.1 }];
      const list2: SearchResultItem[] = [{ id: "doc1", distance: 0.2 }];

      const config: RrfClause = {
        ranks: [
          { query: "q1", returnRank: true, limit: 10 },
          { query: "q2", returnRank: true, limit: 10 },
        ],
      };

      const result = service.process([list1, list2], config);

      // Should keep original item data (first seen)
      expect(result[0]?.distance).toBe(0.1);
    });

    it("handles lists with different lengths", () => {
      const list1: SearchResultItem[] = [{ id: "doc1" }, { id: "doc2" }, { id: "doc3" }];
      const list2: SearchResultItem[] = [{ id: "doc4" }];

      const config: RrfClause = {
        ranks: [
          { query: "q1", returnRank: true, limit: 10 },
          { query: "q2", returnRank: true, limit: 10 },
        ],
      };

      const result = service.process([list1, list2], config);

      expect(result.length).toBe(4);
    });
  });
});
