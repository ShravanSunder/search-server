import { z } from "zod";

// ============================================================================
// Built-in Field Schemas
// ============================================================================

export const builtInFieldSchema = z.enum([
  "#id",
  "#document",
  "#embedding",
  "#metadata",
  "#score",
]);

export type BuiltInField = z.infer<typeof builtInFieldSchema>;

// ============================================================================
// Select Field Schema (built-in or custom metadata field)
// ============================================================================

export const selectFieldSchema = z.union([
  builtInFieldSchema,
  z.string(), // Custom metadata field (e.g., "title", "author")
]);

export type SelectField = z.infer<typeof selectFieldSchema>;

// ============================================================================
// Select Clause Schema
// ============================================================================

export const selectClauseSchema = z.object({
  keys: z.array(selectFieldSchema).readonly(),
});

export type SelectClause = z.infer<typeof selectClauseSchema>;

// ============================================================================
// K() Expression Constants (matching Cloud API)
// ============================================================================

export const K = {
  ID: "#id",
  DOCUMENT: "#document",
  EMBEDDING: "#embedding",
  METADATA: "#metadata",
  SCORE: "#score",
} as const satisfies Record<string, BuiltInField>;

// ============================================================================
// Examples:
// ============================================================================
// Return only document and score: { keys: ["#document", "#score"] }
// Return specific metadata: { keys: ["#document", "#score", "title", "author"] }
// Return all: { keys: ["#id", "#document", "#embedding", "#metadata", "#score"] }
