import { z } from "zod";

// ============================================================================
// Key Reference Schema (for sorting by score or metadata field)
// ============================================================================

export const keyRefSchema = z.object({
  field: z.string(), // "#score" or metadata field name
});

export type KeyRef = z.infer<typeof keyRefSchema>;

// Helper for single or array of key refs
const keysInputSchema = z.union([keyRefSchema, z.array(keyRefSchema).readonly()]);

// ============================================================================
// MinK Schema (keep k records with SMALLEST values)
// ============================================================================

export const minKClauseSchema = z.object({
  keys: keysInputSchema,
  k: z.number().int().positive(),
});

export type MinKClause = z.infer<typeof minKClauseSchema>;

// ============================================================================
// MaxK Schema (keep k records with LARGEST values)
// ============================================================================

export const maxKClauseSchema = z.object({
  keys: keysInputSchema,
  k: z.number().int().positive(),
});

export type MaxKClause = z.infer<typeof maxKClauseSchema>;

// ============================================================================
// GroupBy Schema
// ============================================================================

export const groupByClauseSchema = z.object({
  keys: keysInputSchema, // Metadata field(s) to group by
  aggregate: z.union([
    z.object({ $min_k: minKClauseSchema }),
    z.object({ $max_k: maxKClauseSchema }),
  ]),
});

export type GroupByClause = z.infer<typeof groupByClauseSchema>;

// ============================================================================
// Examples:
// ============================================================================
// Group by category, keep top 3 per category by score:
// { keys: { field: "category" }, aggregate: { $min_k: { keys: { field: "#score" }, k: 3 } } }

// Group by (category, year), keep top 1 per combination:
// { keys: [{ field: "category" }, { field: "year" }], aggregate: { $min_k: { keys: { field: "#score" }, k: 1 } } }
