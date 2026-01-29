import { describe, it, expect } from "vitest";
import {
  whereClauseSchema,
  whereComparisonValueSchema,
} from "../where-filter.schema.js";

describe("whereComparisonValueSchema", () => {
  it("accepts direct values (implicit $eq)", () => {
    expect(whereComparisonValueSchema.parse("electronics")).toBe("electronics");
    expect(whereComparisonValueSchema.parse(100)).toBe(100);
    expect(whereComparisonValueSchema.parse(true)).toBe(true);
  });

  it("accepts $eq operator", () => {
    expect(whereComparisonValueSchema.parse({ $eq: "test" })).toEqual({
      $eq: "test",
    });
  });

  it("accepts $ne operator", () => {
    expect(whereComparisonValueSchema.parse({ $ne: "test" })).toEqual({
      $ne: "test",
    });
  });

  it("accepts numeric comparison operators", () => {
    expect(whereComparisonValueSchema.parse({ $gt: 100 })).toEqual({
      $gt: 100,
    });
    expect(whereComparisonValueSchema.parse({ $gte: 100 })).toEqual({
      $gte: 100,
    });
    expect(whereComparisonValueSchema.parse({ $lt: 100 })).toEqual({
      $lt: 100,
    });
    expect(whereComparisonValueSchema.parse({ $lte: 100 })).toEqual({
      $lte: 100,
    });
  });

  it("accepts $in and $nin operators", () => {
    expect(whereComparisonValueSchema.parse({ $in: ["a", "b", "c"] })).toEqual({
      $in: ["a", "b", "c"],
    });
    expect(whereComparisonValueSchema.parse({ $nin: [1, 2, 3] })).toEqual({
      $nin: [1, 2, 3],
    });
  });
});

describe("whereClauseSchema", () => {
  it("parses simple field equality", () => {
    const where = { category: "electronics" };
    expect(whereClauseSchema.parse(where)).toEqual(where);
  });

  it("parses comparison operators", () => {
    const where = { price: { $gte: 100 }, stock: { $gt: 0 } };
    expect(whereClauseSchema.parse(where)).toEqual(where);
  });

  it("parses $and operator", () => {
    const where = {
      $and: [{ category: "electronics" }, { price: { $lt: 500 } }],
    };
    expect(whereClauseSchema.parse(where)).toEqual(where);
  });

  it("parses $or operator", () => {
    const where = {
      $or: [{ brand: "Apple" }, { brand: "Samsung" }],
    };
    expect(whereClauseSchema.parse(where)).toEqual(where);
  });

  it("parses nested logical operators", () => {
    const where = {
      $or: [
        { brand: "Apple" },
        {
          $and: [{ brand: "Samsung" }, { year: { $gte: 2023 } }],
        },
      ],
    };
    expect(whereClauseSchema.parse(where)).toEqual(where);
  });

  it("parses mixed fields and operators", () => {
    const where = {
      category: "electronics",
      price: { $lt: 1000 },
      $or: [{ brand: "Apple" }, { rating: { $gte: 4.5 } }],
    };
    expect(whereClauseSchema.parse(where)).toEqual(where);
  });
});
