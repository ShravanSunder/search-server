import { z } from "zod";
import { defaultMetadataSchema } from "./common.schema.js";

// ============================================================================
// Create Collection Request Schema
// ============================================================================

export const createCollectionRequestSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(512)
    .regex(/^[a-zA-Z0-9_-]+$/),
  metadata: defaultMetadataSchema.optional(),
  getOrCreate: z.boolean().optional(),
});

export type CreateCollectionRequest = z.infer<typeof createCollectionRequestSchema>;

// ============================================================================
// Collection Info Schema
// ============================================================================

export const collectionInfoSchema = z.object({
  name: z.string(),
  id: z.string(),
  metadata: defaultMetadataSchema.optional(),
  count: z.number().int().nonnegative(),
});

export type CollectionInfo = z.infer<typeof collectionInfoSchema>;

// ============================================================================
// Response Schemas
// ============================================================================

export const createCollectionResponseSchema = z.object({
  collection: collectionInfoSchema,
});

export type CreateCollectionResponse = z.infer<typeof createCollectionResponseSchema>;

export const listCollectionsResponseSchema = z.object({
  collections: z.array(collectionInfoSchema).readonly(),
});

export type ListCollectionsResponse = z.infer<typeof listCollectionsResponseSchema>;

export const getCollectionResponseSchema = z.object({
  collection: collectionInfoSchema,
});

export type GetCollectionResponse = z.infer<typeof getCollectionResponseSchema>;

export const deleteCollectionResponseSchema = z.object({
  deleted: z.boolean(),
  name: z.string(),
});

export type DeleteCollectionResponse = z.infer<typeof deleteCollectionResponseSchema>;
