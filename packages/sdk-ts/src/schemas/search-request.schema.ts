import { z } from "zod";
import { groupByClauseSchema } from "./aggregation.schema.js";
import { selectClauseSchema } from "./field-selection.schema.js";
import { knnQuerySchema } from "./knn-query.schema.js";
import { rrfClauseSchema } from "./rrf-ranking.schema.js";
import { whereDocumentClauseSchema } from "./where-document-filter.schema.js";
import { whereClauseSchema } from "./where-filter.schema.js";

// ============================================================================
// Limit Clause Schema (pagination)
// ============================================================================

export const limitClauseSchema = z.union([
  z.number().int().positive(),
  z.object({
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative().optional(),
  }),
]);

export type LimitClause = z.infer<typeof limitClauseSchema>;

// ============================================================================
// Search Request Schema
// ============================================================================

export const searchRequestSchema = z.object({
  // RANKING (one required)
  rank: z.union([knnQuerySchema, rrfClauseSchema]),

  // FILTERING (optional)
  where: whereClauseSchema.optional(),
  whereDocument: whereDocumentClauseSchema.optional(),

  // PAGINATION (optional)
  limit: limitClauseSchema.optional(),

  // FIELD SELECTION (optional)
  select: selectClauseSchema.optional(),

  // AGGREGATION (optional, in-memory)
  groupBy: groupByClauseSchema.optional(),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

// ============================================================================
// Batch Search Request Schema
// ============================================================================

export const batchSearchRequestSchema = z.object({
  searches: z.array(searchRequestSchema).min(1).readonly(),
});

export type BatchSearchRequest = z.infer<typeof batchSearchRequestSchema>;
