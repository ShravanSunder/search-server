import { z } from "zod";
import {
  documentIdSchema,
  documentContentSchema,
  embeddingSchema,
  defaultMetadataSchema,
  includeOptionsSchema,
} from "./common.schema.js";
import { whereClauseSchema } from "./where-filter.schema.js";
import { whereDocumentClauseSchema } from "./where-document-filter.schema.js";

// ============================================================================
// Add Documents Schemas
// ============================================================================

export const addDocumentsRequestSchema = z
  .object({
    ids: z.array(documentIdSchema).min(1).readonly(),
    documents: z.array(documentContentSchema).readonly().optional(),
    embeddings: z.array(embeddingSchema).readonly().optional(),
    metadatas: z.array(defaultMetadataSchema).readonly().optional(),
  })
  .refine(
    (data) => data.documents !== undefined || data.embeddings !== undefined,
    { message: "Either documents or embeddings must be provided" }
  );

export type AddDocumentsRequest = z.infer<typeof addDocumentsRequestSchema>;

export const addDocumentsResponseSchema = z.object({
  added: z.number().int().nonnegative(),
  ids: z.array(documentIdSchema).readonly(),
});

export type AddDocumentsResponse = z.infer<typeof addDocumentsResponseSchema>;

// ============================================================================
// Get Documents Schemas
// ============================================================================

export const getDocumentsRequestSchema = z.object({
  ids: z.array(documentIdSchema).readonly().optional(),
  where: whereClauseSchema.optional(),
  whereDocument: whereDocumentClauseSchema.optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  include: includeOptionsSchema.optional(),
});

export type GetDocumentsRequest = z.infer<typeof getDocumentsRequestSchema>;

export const getDocumentsResponseSchema = z.object({
  ids: z.array(documentIdSchema).readonly(),
  documents: z.array(documentContentSchema.nullable()).readonly().optional(),
  embeddings: z.array(embeddingSchema.nullable()).readonly().optional(),
  metadatas: z.array(defaultMetadataSchema.nullable()).readonly().optional(),
});

export type GetDocumentsResponse = z.infer<typeof getDocumentsResponseSchema>;

// ============================================================================
// Query Documents Schemas (standard ChromaDB query, not Search API)
// ============================================================================

export const queryDocumentsRequestSchema = z
  .object({
    queryEmbeddings: z.array(embeddingSchema).readonly().optional(),
    queryTexts: z.array(z.string()).readonly().optional(),
    nResults: z.number().int().positive().optional(),
    where: whereClauseSchema.optional(),
    whereDocument: whereDocumentClauseSchema.optional(),
    include: includeOptionsSchema.optional(),
  })
  .refine(
    (data) =>
      data.queryEmbeddings !== undefined || data.queryTexts !== undefined,
    { message: "Either queryEmbeddings or queryTexts must be provided" }
  );

export type QueryDocumentsRequest = z.infer<typeof queryDocumentsRequestSchema>;

export const queryDocumentsResponseSchema = z.object({
  ids: z.array(z.array(documentIdSchema).readonly()).readonly(),
  documents: z
    .array(z.array(documentContentSchema.nullable()).readonly())
    .readonly()
    .optional(),
  embeddings: z
    .array(z.array(embeddingSchema.nullable()).readonly())
    .readonly()
    .optional(),
  metadatas: z
    .array(z.array(defaultMetadataSchema.nullable()).readonly())
    .readonly()
    .optional(),
  distances: z.array(z.array(z.number()).readonly()).readonly().optional(),
});

export type QueryDocumentsResponse = z.infer<
  typeof queryDocumentsResponseSchema
>;

// ============================================================================
// Update Documents Schemas
// ============================================================================

export const updateDocumentsRequestSchema = z.object({
  ids: z.array(documentIdSchema).min(1).readonly(),
  documents: z.array(documentContentSchema).readonly().optional(),
  embeddings: z.array(embeddingSchema).readonly().optional(),
  metadatas: z.array(defaultMetadataSchema).readonly().optional(),
});

export type UpdateDocumentsRequest = z.infer<
  typeof updateDocumentsRequestSchema
>;

export const updateDocumentsResponseSchema = z.object({
  updated: z.number().int().nonnegative(),
});

export type UpdateDocumentsResponse = z.infer<
  typeof updateDocumentsResponseSchema
>;

// ============================================================================
// Upsert Documents Schemas
// ============================================================================

export const upsertDocumentsRequestSchema = z
  .object({
    ids: z.array(documentIdSchema).min(1).readonly(),
    documents: z.array(documentContentSchema).readonly().optional(),
    embeddings: z.array(embeddingSchema).readonly().optional(),
    metadatas: z.array(defaultMetadataSchema).readonly().optional(),
  })
  .refine(
    (data) => data.documents !== undefined || data.embeddings !== undefined,
    { message: "Either documents or embeddings must be provided" }
  );

export type UpsertDocumentsRequest = z.infer<
  typeof upsertDocumentsRequestSchema
>;

export const upsertDocumentsResponseSchema = z.object({
  upserted: z.number().int().nonnegative(),
});

export type UpsertDocumentsResponse = z.infer<
  typeof upsertDocumentsResponseSchema
>;

// ============================================================================
// Delete Documents Schemas
// ============================================================================

export const deleteDocumentsRequestSchema = z
  .object({
    ids: z.array(documentIdSchema).readonly().optional(),
    where: whereClauseSchema.optional(),
    whereDocument: whereDocumentClauseSchema.optional(),
  })
  .refine((data) => data.ids !== undefined || data.where !== undefined, {
    message: "Either ids or where filter must be provided",
  });

export type DeleteDocumentsRequest = z.infer<
  typeof deleteDocumentsRequestSchema
>;

export const deleteDocumentsResponseSchema = z.object({
  deleted: z.boolean(),
});

export type DeleteDocumentsResponse = z.infer<
  typeof deleteDocumentsResponseSchema
>;

// ============================================================================
// Count Documents Schema
// ============================================================================

export const countDocumentsResponseSchema = z.object({
  count: z.number().int().nonnegative(),
});

export type CountDocumentsResponse = z.infer<
  typeof countDocumentsResponseSchema
>;

// ============================================================================
// Peek Documents Schemas
// ============================================================================

export const peekDocumentsRequestSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(10),
});

export type PeekDocumentsRequest = z.infer<typeof peekDocumentsRequestSchema>;

export const peekDocumentsResponseSchema = z.object({
  ids: z.array(documentIdSchema).readonly(),
  documents: z.array(documentContentSchema.nullable()).readonly().optional(),
  embeddings: z.array(embeddingSchema.nullable()).readonly().optional(),
  metadatas: z.array(defaultMetadataSchema.nullable()).readonly().optional(),
});

export type PeekDocumentsResponse = z.infer<typeof peekDocumentsResponseSchema>;
