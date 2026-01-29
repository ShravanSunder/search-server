import { z } from "zod";
import { metadataValueSchema } from "./common.schema.js";

// ============================================================================
// Comparison Operator Schemas
// ============================================================================

const whereEqOperatorSchema = z.object({ $eq: metadataValueSchema });
const whereNeOperatorSchema = z.object({ $ne: metadataValueSchema });
const whereGtOperatorSchema = z.object({ $gt: z.number() });
const whereGteOperatorSchema = z.object({ $gte: z.number() });
const whereLtOperatorSchema = z.object({ $lt: z.number() });
const whereLteOperatorSchema = z.object({ $lte: z.number() });
const whereInOperatorSchema = z.object({
  $in: z.array(metadataValueSchema),
});
const whereNinOperatorSchema = z.object({
  $nin: z.array(metadataValueSchema),
});

// Combined comparison value (field value or operator object)
export const whereComparisonValueSchema = z.union([
  metadataValueSchema, // Implicit $eq
  whereEqOperatorSchema,
  whereNeOperatorSchema,
  whereGtOperatorSchema,
  whereGteOperatorSchema,
  whereLtOperatorSchema,
  whereLteOperatorSchema,
  whereInOperatorSchema,
  whereNinOperatorSchema,
]);

export type WhereComparisonValue = z.infer<typeof whereComparisonValueSchema>;

// ============================================================================
// Recursive Where Clause Schema (supports $and, $or nesting)
// Uses z.lazy for recursive types in Zod v3
// ============================================================================

// Define the base where clause type for recursion - exported for type references
export type WhereClauseBase = {
  readonly $and?: readonly WhereClauseBase[];
  readonly $or?: readonly WhereClauseBase[];
  readonly [key: string]: WhereComparisonValue | readonly WhereClauseBase[] | undefined;
};

// Create the recursive schema - use simple approach without strict typing
// to avoid TypeScript recursive type issues
export const whereClauseSchema = z.lazy(
  (): z.ZodTypeAny =>
    z
      .object({
        $and: z.array(whereClauseSchema).optional(),
        $or: z.array(whereClauseSchema).optional(),
      })
      .catchall(whereComparisonValueSchema),
);

export type WhereClause = z.infer<typeof whereClauseSchema>;

// ============================================================================
// Examples:
// ============================================================================
// Simple:     { "category": "electronics" }
// Comparison: { "price": { "$gte": 100 } }
// Logical:    { "$and": [{ "category": "electronics" }, { "price": { "$lt": 500 } }] }
// Complex:    { "$or": [{ "brand": "Apple" }, { "$and": [{ "brand": "Samsung" }, { "year": { "$gte": 2023 } }] }] }
