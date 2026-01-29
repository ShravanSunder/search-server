import { z } from "zod";

// ============================================================================
// WhereDocument Operator Schemas (content filtering)
// ============================================================================

const whereDocContainsSchema = z.object({ $contains: z.string() });
const whereDocNotContainsSchema = z.object({ $not_contains: z.string() });

// ============================================================================
// Recursive WhereDocument Clause Schema (uses z.lazy for Zod v3)
// ============================================================================

// Define the base type for recursion
type WhereDocumentClauseInput =
  | { $contains: string }
  | { $not_contains: string }
  | { $and: WhereDocumentClauseInput[] }
  | { $or: WhereDocumentClauseInput[] };

export const whereDocumentClauseSchema: z.ZodType<WhereDocumentClauseInput> =
  z.lazy(() =>
    z.union([
      whereDocContainsSchema,
      whereDocNotContainsSchema,
      z.object({ $and: z.array(whereDocumentClauseSchema) }),
      z.object({ $or: z.array(whereDocumentClauseSchema) }),
    ])
  );

// Inferred type from schema
export type WhereDocumentClause = z.infer<typeof whereDocumentClauseSchema>;

// ============================================================================
// Examples:
// ============================================================================
// Simple:   { "$contains": "machine learning" }
// Negation: { "$not_contains": "deprecated" }
// Logical:  { "$or": [{ "$contains": "AI" }, { "$contains": "ML" }] }
