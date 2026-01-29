import { z } from "zod";
import {
  documentIdSchema,
  documentContentSchema,
  embeddingSchema,
  defaultMetadataSchema,
  metadataValueSchema,
} from "./common.schema.js";

// ============================================================================
// Search Result Item Schema
// ============================================================================

export const searchResultItemSchema = z.object({
  id: documentIdSchema,
  document: documentContentSchema.optional(),
  embedding: embeddingSchema.optional(),
  metadata: defaultMetadataSchema.optional(),
  score: z.number().optional(),
  distance: z.number().optional(),
});

export type SearchResultItem = z.infer<typeof searchResultItemSchema>;

// ============================================================================
// Generic Search Result Item (for typed metadata)
// ============================================================================

export function createSearchResultItemSchema<
  TMetadataSchema extends z.ZodTypeAny,
>(
  metadataSchema: TMetadataSchema
): z.ZodObject<{
  id: typeof documentIdSchema;
  document: z.ZodOptional<typeof documentContentSchema>;
  embedding: z.ZodOptional<typeof embeddingSchema>;
  metadata: z.ZodOptional<TMetadataSchema>;
  score: z.ZodOptional<z.ZodNumber>;
  distance: z.ZodOptional<z.ZodNumber>;
}> {
  return z.object({
    id: documentIdSchema,
    document: documentContentSchema.optional(),
    embedding: embeddingSchema.optional(),
    metadata: metadataSchema.optional(),
    score: z.number().optional(),
    distance: z.number().optional(),
  });
}

// ============================================================================
// Grouped Search Result Schema
// ============================================================================

export const groupedSearchResultSchema = z.object({
  groupKey: z.string(),
  groupValue: metadataValueSchema,
  items: z.array(searchResultItemSchema).readonly(),
});

export type GroupedSearchResult = z.infer<typeof groupedSearchResultSchema>;

// ============================================================================
// Search Response Schema (discriminated union)
// ============================================================================

export const ungroupedSearchResponseSchema = z.object({
  grouped: z.literal(false),
  results: z.array(searchResultItemSchema).readonly(),
  total: z.number().int().nonnegative(),
  took: z.number().nonnegative(),
});

export const groupedSearchResponseSchema = z.object({
  grouped: z.literal(true),
  groups: z.array(groupedSearchResultSchema).readonly(),
  totalGroups: z.number().int().nonnegative(),
  totalItems: z.number().int().nonnegative(),
  took: z.number().nonnegative(),
});

export const searchResponseSchema = z.discriminatedUnion("grouped", [
  ungroupedSearchResponseSchema,
  groupedSearchResponseSchema,
]);

export type SearchResponse = z.infer<typeof searchResponseSchema>;
export type UngroupedSearchResponse = z.infer<
  typeof ungroupedSearchResponseSchema
>;
export type GroupedSearchResponse = z.infer<typeof groupedSearchResponseSchema>;

// ============================================================================
// Batch Search Response Schema
// ============================================================================

export const batchSearchResponseSchema = z.object({
  results: z.array(searchResponseSchema).readonly(),
  took: z.number().nonnegative(),
});

export type BatchSearchResponse = z.infer<typeof batchSearchResponseSchema>;
