import { z } from "zod";
import { embeddingSchema } from "./common.schema.js";

// ============================================================================
// KNN Query Schema
// ============================================================================

export const knnQuerySchema = z.object({
  // Query can be embedding vector OR text (ChromaDB generates embedding)
  query: z.union([embeddingSchema, z.string()]),

  // Which embedding field to search (default: #embedding)
  key: z.string().optional(),

  // Max candidates to consider (internal ChromaDB limit)
  limit: z.number().int().positive().optional(),

  // For RRF: return rank positions instead of distances
  returnRank: z.boolean().optional(),

  // Default rank for documents not in this query's results (for RRF)
  default: z.number().optional(),
});

export type KnnQuery = z.infer<typeof knnQuerySchema>;

// ============================================================================
// Examples:
// ============================================================================
// With embedding: { query: [0.1, 0.2, 0.3, ...], limit: 100 }
// With text: { query: "machine learning applications", limit: 50 }
// For RRF: { query: "AI research", returnRank: true, limit: 200 }
