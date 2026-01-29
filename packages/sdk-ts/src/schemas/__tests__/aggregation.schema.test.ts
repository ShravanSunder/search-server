import { describe, it, expect } from "vitest";
import {
  keyRefSchema,
  minKClauseSchema,
  maxKClauseSchema,
  groupByClauseSchema,
} from "../aggregation.schema.js";

describe("keyRefSchema", () => {
  it("accepts score field reference", () => {
    const ref = { field: "#score" };
    expect(keyRefSchema.parse(ref)).toEqual(ref);
  });

  it("accepts metadata field reference", () => {
    const ref = { field: "category" };
    expect(keyRefSchema.parse(ref)).toEqual(ref);
  });

  it("rejects missing field", () => {
    expect(() => keyRefSchema.parse({})).toThrow();
  });
});

describe("minKClauseSchema", () => {
  it("accepts single key with k", () => {
    const clause = {
      keys: { field: "#score" },
      k: 3,
    };
    expect(minKClauseSchema.parse(clause)).toEqual(clause);
  });

  it("accepts array of keys", () => {
    const clause = {
      keys: [{ field: "#score" }, { field: "date" }],
      k: 5,
    };
    expect(minKClauseSchema.parse(clause)).toEqual(clause);
  });

  it("rejects non-positive k", () => {
    expect(() =>
      minKClauseSchema.parse({
        keys: { field: "#score" },
        k: 0,
      })
    ).toThrow();
    expect(() =>
      minKClauseSchema.parse({
        keys: { field: "#score" },
        k: -1,
      })
    ).toThrow();
  });

  it("rejects non-integer k", () => {
    expect(() =>
      minKClauseSchema.parse({
        keys: { field: "#score" },
        k: 2.5,
      })
    ).toThrow();
  });
});

describe("maxKClauseSchema", () => {
  it("accepts single key with k", () => {
    const clause = {
      keys: { field: "#score" },
      k: 3,
    };
    expect(maxKClauseSchema.parse(clause)).toEqual(clause);
  });

  it("accepts array of keys", () => {
    const clause = {
      keys: [{ field: "#score" }],
      k: 10,
    };
    expect(maxKClauseSchema.parse(clause)).toEqual(clause);
  });

  it("rejects non-positive k", () => {
    expect(() =>
      maxKClauseSchema.parse({
        keys: { field: "#score" },
        k: 0,
      })
    ).toThrow();
  });
});

describe("groupByClauseSchema", () => {
  describe("with $min_k aggregate", () => {
    it("accepts single group key", () => {
      const clause = {
        keys: { field: "category" },
        aggregate: {
          $min_k: { keys: { field: "#score" }, k: 3 },
        },
      };
      expect(groupByClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts multiple group keys", () => {
      const clause = {
        keys: [{ field: "category" }, { field: "year" }],
        aggregate: {
          $min_k: { keys: { field: "#score" }, k: 1 },
        },
      };
      expect(groupByClauseSchema.parse(clause)).toEqual(clause);
    });

    it("accepts multiple sort keys in aggregate", () => {
      const clause = {
        keys: { field: "category" },
        aggregate: {
          $min_k: {
            keys: [{ field: "#score" }, { field: "date" }],
            k: 5,
          },
        },
      };
      expect(groupByClauseSchema.parse(clause)).toEqual(clause);
    });
  });

  describe("with $max_k aggregate", () => {
    it("accepts $max_k aggregate", () => {
      const clause = {
        keys: { field: "category" },
        aggregate: {
          $max_k: { keys: { field: "#score" }, k: 10 },
        },
      };
      expect(groupByClauseSchema.parse(clause)).toEqual(clause);
    });
  });

  describe("invalid cases", () => {
    it("rejects missing aggregate", () => {
      expect(() =>
        groupByClauseSchema.parse({
          keys: { field: "category" },
        })
      ).toThrow();
    });

    it("rejects missing keys", () => {
      expect(() =>
        groupByClauseSchema.parse({
          aggregate: { $min_k: { keys: { field: "#score" }, k: 3 } },
        })
      ).toThrow();
    });

    it("rejects unknown aggregate type", () => {
      expect(() =>
        groupByClauseSchema.parse({
          keys: { field: "category" },
          aggregate: { $unknown: { keys: { field: "#score" }, k: 3 } },
        })
      ).toThrow();
    });
  });
});
