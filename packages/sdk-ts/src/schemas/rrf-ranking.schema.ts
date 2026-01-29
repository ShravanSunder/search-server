import { z } from "zod";
import { knnQuerySchema } from "./knn-query.schema.js";

// ============================================================================
// RRF Clause Schema
// ============================================================================

export const rrfClauseSchema = z.object({
  // Multiple KNN queries to fuse (each should have returnRank: true)
  ranks: z.array(knnQuerySchema).min(1).readonly(),

  // RRF smoothing constant (default: 60)
  k: z.number().int().positive().optional(),

  // Weights for each ranking (default: all 1.0)
  weights: z.array(z.number()).readonly().optional(),

  // Normalize weights to sum to 1.0
  normalize: z.boolean().optional(),
});

export type RrfClause = z.infer<typeof rrfClauseSchema>;

// ============================================================================
// RRF Formula: score = -sum(weight_i / (k + rank_i))
// Negative because lower score = better (matches ChromaDB distance semantics)
// ============================================================================

// ============================================================================
// Examples:
// ============================================================================
// Dense + Sparse hybrid:
// {
//   ranks: [
//     { query: "machine learning", key: "#embedding", returnRank: true, limit: 200 },
//     { query: "machine learning", key: "sparse_embedding", returnRank: true, limit: 200 }
//   ],
//   k: 60,
//   weights: [0.7, 0.3]
// }
