import { describe, expect, it } from "vitest";
import {
  type ChromaQueryResult,
  ChromaResultTransformerService,
} from "../chroma-result-transformer.service.js";

describe("ChromaResultTransformerService", () => {
  const service = new ChromaResultTransformerService();

  describe("basic transformation", () => {
    it("transforms full ChromaDB result to SearchResultItem array", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["doc1", "doc2"]],
        documents: [["Hello world", "Foo bar"]],
        embeddings: [
          [
            [0.1, 0.2, 0.3],
            [0.4, 0.5, 0.6],
          ],
        ],
        metadatas: [[{ title: "First" }, { title: "Second" }]],
        distances: [[0.1, 0.2]],
      };

      const result = service.transformQueryResults(chromaResult);

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        id: "doc1",
        document: "Hello world",
        embedding: [0.1, 0.2, 0.3],
        metadata: { title: "First" },
        score: undefined,
        distance: 0.1,
      });
      expect(result[1]).toEqual({
        id: "doc2",
        document: "Foo bar",
        embedding: [0.4, 0.5, 0.6],
        metadata: { title: "Second" },
        score: undefined,
        distance: 0.2,
      });
    });

    it("handles empty results", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [[]],
        documents: [[]],
        embeddings: [[]],
        metadatas: [[]],
        distances: [[]],
      };

      const result = service.transformQueryResults(chromaResult);
      expect(result).toEqual([]);
    });

    it("handles completely empty response", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [],
      };

      const result = service.transformQueryResults(chromaResult);
      expect(result).toEqual([]);
    });
  });

  describe("optional fields", () => {
    it("handles missing documents", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["doc1"]],
        distances: [[0.1]],
      };

      const result = service.transformQueryResults(chromaResult);

      expect(result[0]?.id).toBe("doc1");
      expect(result[0]?.document).toBeUndefined();
    });

    it("handles missing embeddings", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["doc1"]],
        documents: [["Hello"]],
      };

      const result = service.transformQueryResults(chromaResult);

      expect(result[0]?.embedding).toBeUndefined();
    });

    it("handles missing metadatas", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["doc1"]],
        documents: [["Hello"]],
      };

      const result = service.transformQueryResults(chromaResult);

      expect(result[0]?.metadata).toBeUndefined();
    });

    it("handles missing distances", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["doc1"]],
        documents: [["Hello"]],
      };

      const result = service.transformQueryResults(chromaResult);

      expect(result[0]?.distance).toBeUndefined();
    });

    it("handles null values in arrays", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["doc1", "doc2"]],
        documents: [["Hello", null]],
        embeddings: [[null, [0.1, 0.2]]],
        metadatas: [[{ title: "Test" }, null]],
        distances: [[0.1, 0.2]],
      };

      const result = service.transformQueryResults(chromaResult);

      expect(result[0]?.document).toBe("Hello");
      expect(result[0]?.embedding).toBeUndefined();
      expect(result[0]?.metadata).toEqual({ title: "Test" });

      expect(result[1]?.document).toBeUndefined();
      expect(result[1]?.embedding).toEqual([0.1, 0.2]);
      expect(result[1]?.metadata).toBeUndefined();
    });

    it("handles null top-level arrays", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["doc1"]],
        documents: null,
        embeddings: null,
        metadatas: null,
        distances: null,
      };

      const result = service.transformQueryResults(chromaResult);

      expect(result[0]?.id).toBe("doc1");
      expect(result[0]?.document).toBeUndefined();
      expect(result[0]?.embedding).toBeUndefined();
      expect(result[0]?.metadata).toBeUndefined();
      expect(result[0]?.distance).toBeUndefined();
    });
  });

  describe("returnRank mode", () => {
    it("uses rank index as score when returnRank is true", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["doc1", "doc2", "doc3"]],
        distances: [[0.1, 0.2, 0.3]],
      };

      const result = service.transformQueryResults(chromaResult, true);

      expect(result[0]?.score).toBe(0);
      expect(result[1]?.score).toBe(1);
      expect(result[2]?.score).toBe(2);
      expect(result[0]?.distance).toBeUndefined();
      expect(result[1]?.distance).toBeUndefined();
      expect(result[2]?.distance).toBeUndefined();
    });

    it("uses distance when returnRank is false", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["doc1", "doc2"]],
        distances: [[0.1, 0.2]],
      };

      const result = service.transformQueryResults(chromaResult, false);

      expect(result[0]?.score).toBeUndefined();
      expect(result[0]?.distance).toBe(0.1);
      expect(result[1]?.distance).toBe(0.2);
    });

    it("uses distance when returnRank is undefined", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["doc1"]],
        distances: [[0.15]],
      };

      const result = service.transformQueryResults(chromaResult);

      expect(result[0]?.score).toBeUndefined();
      expect(result[0]?.distance).toBe(0.15);
    });
  });

  describe("batch query handling", () => {
    it("only uses first batch from ChromaDB response", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [
          ["doc1", "doc2"],
          ["doc3", "doc4"], // Second batch should be ignored
        ],
        documents: [
          ["Hello", "World"],
          ["Foo", "Bar"],
        ],
      };

      const result = service.transformQueryResults(chromaResult);

      expect(result.length).toBe(2);
      expect(result[0]?.id).toBe("doc1");
      expect(result[1]?.id).toBe("doc2");
    });
  });

  describe("edge cases", () => {
    it("skips items with falsy IDs", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["doc1", "", "doc3"]],
        documents: [["Hello", "Empty ID", "World"]],
      };

      const result = service.transformQueryResults(chromaResult);

      // Empty string ID should be skipped
      expect(result.length).toBe(2);
      expect(result[0]?.id).toBe("doc1");
      expect(result[1]?.id).toBe("doc3");
    });

    it("handles mismatched array lengths gracefully", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["doc1", "doc2", "doc3"]],
        documents: [["Only one"]],
        distances: [[0.1, 0.2]],
      };

      const result = service.transformQueryResults(chromaResult);

      expect(result.length).toBe(3);
      expect(result[0]?.document).toBe("Only one");
      expect(result[1]?.document).toBeUndefined();
      expect(result[2]?.document).toBeUndefined();
    });

    it("preserves metadata with various types", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["doc1"]],
        metadatas: [
          [
            {
              stringField: "hello",
              numberField: 42,
              boolField: true,
              floatField: 3.14,
            },
          ],
        ],
      };

      const result = service.transformQueryResults(chromaResult);

      expect(result[0]?.metadata).toEqual({
        stringField: "hello",
        numberField: 42,
        boolField: true,
        floatField: 3.14,
      });
    });

    it("handles single result", () => {
      const chromaResult: ChromaQueryResult = {
        ids: [["single-doc"]],
        documents: [["Single document content"]],
        distances: [[0.05]],
      };

      const result = service.transformQueryResults(chromaResult);

      expect(result.length).toBe(1);
      expect(result[0]?.id).toBe("single-doc");
      expect(result[0]?.document).toBe("Single document content");
      expect(result[0]?.distance).toBe(0.05);
    });
  });
});
