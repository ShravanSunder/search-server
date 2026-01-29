import type { GroupByClause, SearchResultItem } from "@search-server/sdk";
import { describe, expect, it } from "vitest";
import { GroupByAggregatorService } from "../group-by-aggregator.service.js";

describe("GroupByAggregatorService", () => {
  const service = new GroupByAggregatorService();

  const sampleResults: SearchResultItem[] = [
    { id: "1", metadata: { category: "A", year: 2024 }, score: 0.1 },
    { id: "2", metadata: { category: "A", year: 2023 }, score: 0.2 },
    { id: "3", metadata: { category: "A", year: 2024 }, score: 0.3 },
    { id: "4", metadata: { category: "B", year: 2024 }, score: 0.15 },
    { id: "5", metadata: { category: "B", year: 2023 }, score: 0.25 },
  ];

  describe("grouping", () => {
    it("groups by single metadata field", () => {
      const config: GroupByClause = {
        keys: { field: "category" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 10 } },
      };

      const groups = service.process(sampleResults, config);

      expect(groups.length).toBe(2);
      expect(groups.find((g) => g.groupValue === "A")?.items.length).toBe(3);
      expect(groups.find((g) => g.groupValue === "B")?.items.length).toBe(2);
    });

    it("groups by composite keys (array)", () => {
      const config: GroupByClause = {
        keys: [{ field: "category" }, { field: "year" }],
        aggregate: { $min_k: { keys: { field: "#score" }, k: 10 } },
      };

      const groups = service.process(sampleResults, config);

      // A|2024, A|2023, B|2024, B|2023
      expect(groups.length).toBe(4);
    });

    it("sets correct groupKey for single field", () => {
      const config: GroupByClause = {
        keys: { field: "category" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 10 } },
      };

      const groups = service.process(sampleResults, config);

      expect(groups[0]?.groupKey).toBe("category");
    });

    it("sets correct groupKey for composite fields", () => {
      const config: GroupByClause = {
        keys: [{ field: "category" }, { field: "year" }],
        aggregate: { $min_k: { keys: { field: "#score" }, k: 10 } },
      };

      const groups = service.process(sampleResults, config);

      expect(groups[0]?.groupKey).toBe("category,year");
    });

    it("excludes items with missing group field", () => {
      const resultsWithMissing: SearchResultItem[] = [
        { id: "1", metadata: { category: "A" }, score: 0.1 },
        { id: "2", metadata: {}, score: 0.2 }, // missing category
        { id: "3", score: 0.3 }, // missing metadata entirely
      ];

      const config: GroupByClause = {
        keys: { field: "category" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 10 } },
      };

      const groups = service.process(resultsWithMissing, config);

      expect(groups.length).toBe(1);
      expect(groups[0]?.items.length).toBe(1);
    });

    it("returns empty array for empty input", () => {
      const config: GroupByClause = {
        keys: { field: "category" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 10 } },
      };

      const groups = service.process([], config);
      expect(groups).toEqual([]);
    });
  });

  describe("$min_k aggregation", () => {
    it("keeps k items with lowest scores (ascending)", () => {
      const config: GroupByClause = {
        keys: { field: "category" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 2 } },
      };

      const groups = service.process(sampleResults, config);

      const groupA = groups.find((g) => g.groupValue === "A");
      expect(groupA?.items.length).toBe(2);
      expect(groupA?.items[0]?.score).toBe(0.1);
      expect(groupA?.items[1]?.score).toBe(0.2);
    });

    it("keeps all items when k exceeds group size", () => {
      const config: GroupByClause = {
        keys: { field: "category" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 100 } },
      };

      const groups = service.process(sampleResults, config);

      const groupA = groups.find((g) => g.groupValue === "A");
      expect(groupA?.items.length).toBe(3);
    });

    it("handles k=1 correctly", () => {
      const config: GroupByClause = {
        keys: { field: "category" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 1 } },
      };

      const groups = service.process(sampleResults, config);

      groups.forEach((group) => {
        expect(group.items.length).toBe(1);
      });
    });

    it("sorts by metadata field when specified", () => {
      const config: GroupByClause = {
        keys: { field: "category" },
        aggregate: { $min_k: { keys: { field: "year" }, k: 2 } },
      };

      const groups = service.process(sampleResults, config);

      const groupA = groups.find((g) => g.groupValue === "A");
      // 2023 < 2024, so year 2023 items come first
      expect(groupA?.items[0]?.metadata?.year).toBe(2023);
    });
  });

  describe("$max_k aggregation", () => {
    it("keeps k items with highest scores (descending)", () => {
      const config: GroupByClause = {
        keys: { field: "category" },
        aggregate: { $max_k: { keys: { field: "#score" }, k: 2 } },
      };

      const groups = service.process(sampleResults, config);

      const groupA = groups.find((g) => g.groupValue === "A");
      expect(groupA?.items.length).toBe(2);
      expect(groupA?.items[0]?.score).toBe(0.3);
      expect(groupA?.items[1]?.score).toBe(0.2);
    });

    it("sorts by metadata field when specified", () => {
      const config: GroupByClause = {
        keys: { field: "category" },
        aggregate: { $max_k: { keys: { field: "year" }, k: 2 } },
      };

      const groups = service.process(sampleResults, config);

      const groupA = groups.find((g) => g.groupValue === "A");
      // 2024 > 2023, so year 2024 items come first
      expect(groupA?.items[0]?.metadata?.year).toBe(2024);
    });
  });

  describe("special fields", () => {
    it("groups by #score", () => {
      const resultsWithSameScore: SearchResultItem[] = [
        { id: "1", score: 0.5, metadata: { name: "a" } },
        { id: "2", score: 0.5, metadata: { name: "b" } },
        { id: "3", score: 0.8, metadata: { name: "c" } },
      ];

      const config: GroupByClause = {
        keys: { field: "#score" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 10 } },
      };

      const groups = service.process(resultsWithSameScore, config);

      expect(groups.length).toBe(2); // 0.5 and 0.8
    });

    it("groups by #distance", () => {
      const resultsWithDistance: SearchResultItem[] = [
        { id: "1", distance: 0.1 },
        { id: "2", distance: 0.1 },
        { id: "3", distance: 0.2 },
      ];

      const config: GroupByClause = {
        keys: { field: "#distance" },
        aggregate: { $min_k: { keys: { field: "#distance" }, k: 10 } },
      };

      const groups = service.process(resultsWithDistance, config);

      expect(groups.length).toBe(2);
    });

    it("groups by #id", () => {
      const config: GroupByClause = {
        keys: { field: "#id" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 10 } },
      };

      const groups = service.process(sampleResults, config);

      // Each doc has unique ID, so 5 groups
      expect(groups.length).toBe(5);
    });

    it("sorts by #distance in $min_k", () => {
      const resultsWithDistance: SearchResultItem[] = [
        { id: "1", distance: 0.5, metadata: { category: "A" } },
        { id: "2", distance: 0.2, metadata: { category: "A" } },
        { id: "3", distance: 0.8, metadata: { category: "A" } },
      ];

      const config: GroupByClause = {
        keys: { field: "category" },
        aggregate: { $min_k: { keys: { field: "#distance" }, k: 2 } },
      };

      const groups = service.process(resultsWithDistance, config);

      expect(groups[0]?.items[0]?.distance).toBe(0.2);
      expect(groups[0]?.items[1]?.distance).toBe(0.5);
    });
  });

  describe("edge cases", () => {
    it("handles undefined score values in sorting", () => {
      const results: SearchResultItem[] = [
        { id: "1", metadata: { category: "A" }, score: 0.1 },
        { id: "2", metadata: { category: "A" } }, // no score
        { id: "3", metadata: { category: "A" }, score: 0.3 },
      ];

      const config: GroupByClause = {
        keys: { field: "category" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 3 } },
      };

      const groups = service.process(results, config);

      // Undefined scores should sort to end in ascending
      expect(groups[0]?.items.length).toBe(3);
      expect(groups[0]?.items[0]?.score).toBe(0.1);
      expect(groups[0]?.items[1]?.score).toBe(0.3);
      expect(groups[0]?.items[2]?.score).toBeUndefined();
    });

    it("handles string value sorting", () => {
      const results: SearchResultItem[] = [
        { id: "1", metadata: { category: "A", name: "zebra" } },
        { id: "2", metadata: { category: "A", name: "apple" } },
        { id: "3", metadata: { category: "A", name: "banana" } },
      ];

      const config: GroupByClause = {
        keys: { field: "category" },
        aggregate: { $min_k: { keys: { field: "name" }, k: 2 } },
      };

      const groups = service.process(results, config);

      // Alphabetically: apple, banana
      expect(groups[0]?.items[0]?.metadata?.name).toBe("apple");
      expect(groups[0]?.items[1]?.metadata?.name).toBe("banana");
    });

    it("handles numeric metadata value grouping", () => {
      const config: GroupByClause = {
        keys: { field: "year" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 10 } },
      };

      const groups = service.process(sampleResults, config);

      // years: 2023 and 2024
      expect(groups.length).toBe(2);
      expect(groups.map((g) => g.groupValue).sort()).toEqual([2023, 2024]);
    });

    it("handles boolean metadata value grouping", () => {
      const results: SearchResultItem[] = [
        { id: "1", metadata: { active: true }, score: 0.1 },
        { id: "2", metadata: { active: false }, score: 0.2 },
        { id: "3", metadata: { active: true }, score: 0.3 },
      ];

      const config: GroupByClause = {
        keys: { field: "active" },
        aggregate: { $min_k: { keys: { field: "#score" }, k: 10 } },
      };

      const groups = service.process(results, config);

      expect(groups.length).toBe(2);
    });
  });
});
