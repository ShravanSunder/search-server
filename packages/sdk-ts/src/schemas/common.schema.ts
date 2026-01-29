import { z } from "zod";

// ============================================================================
// Primitive Schemas (Base building blocks)
// ============================================================================

export const metadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);

// Default metadata schema - clients can override with their own
export const defaultMetadataSchema = z
  .record(z.string(), metadataValueSchema)
  .readonly();

export const embeddingSchema = z.array(z.number()).readonly();

export const documentIdSchema = z.string().min(1);

export const documentContentSchema = z.string();

// ============================================================================
// Base Inferred Types
// ============================================================================

export type MetadataValue = z.infer<typeof metadataValueSchema>;
export type DefaultMetadata = z.infer<typeof defaultMetadataSchema>;
export type Embedding = z.infer<typeof embeddingSchema>;
export type DocumentId = z.infer<typeof documentIdSchema>;
export type DocumentContent = z.infer<typeof documentContentSchema>;

// ============================================================================
// Generic Document Type (allows clients to specify their metadata shape)
// ============================================================================

/**
 * Generic document type - clients can provide their own TMetadata type
 *
 * @example
 * // Client defines their own metadata type
 * interface ArticleMetadata {
 *   title: string;
 *   author: string;
 *   publishedAt: number;
 *   tags: string[];
 * }
 *
 * // Use with generic
 * type ArticleDocument = Document<ArticleMetadata>;
 */
export interface Document<TMetadata = DefaultMetadata> {
  readonly id: DocumentId;
  readonly content?: DocumentContent;
  readonly embedding?: Embedding;
  readonly metadata?: TMetadata;
}

// ============================================================================
// Generic Schema Factory (for creating typed schemas)
// ============================================================================

/**
 * Creates a document schema with custom metadata type
 *
 * @example
 * const articleMetadataSchema = z.object({
 *   title: z.string(),
 *   author: z.string(),
 *   publishedAt: z.number(),
 *   tags: z.array(z.string()),
 * });
 *
 * const articleDocumentSchema = createDocumentSchema(articleMetadataSchema);
 */
export function createDocumentSchema<TMetadataSchema extends z.ZodTypeAny>(
  metadataSchema: TMetadataSchema
): z.ZodObject<{
  id: typeof documentIdSchema;
  content: z.ZodOptional<typeof documentContentSchema>;
  embedding: z.ZodOptional<typeof embeddingSchema>;
  metadata: z.ZodOptional<TMetadataSchema>;
}> {
  return z.object({
    id: documentIdSchema,
    content: documentContentSchema.optional(),
    embedding: embeddingSchema.optional(),
    metadata: metadataSchema.optional(),
  });
}

// Default document schema (uses DefaultMetadata)
export const documentSchema = createDocumentSchema(defaultMetadataSchema);

// ============================================================================
// API Error Schema
// ============================================================================

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

// ============================================================================
// Generic Result Type (for type-safe error handling)
// ============================================================================

export type Result<TData, TError = ApiError> =
  | { readonly ok: true; readonly data: TData }
  | { readonly ok: false; readonly error: TError };

// Generic API response wrapper factory
export function createApiResponseSchema<TDataSchema extends z.ZodTypeAny>(
  dataSchema: TDataSchema
): z.ZodObject<{
  data: TDataSchema;
  meta: z.ZodOptional<z.ZodObject<{ took: z.ZodNumber }>>;
}> {
  return z.object({
    data: dataSchema,
    meta: z
      .object({
        took: z.number(),
      })
      .optional(),
  });
}

// ============================================================================
// Include Options Schema
// ============================================================================

export const includeOptionSchema = z.enum([
  "documents",
  "embeddings",
  "metadatas",
  "distances",
]);

export const includeOptionsSchema = z.array(includeOptionSchema).readonly();

export type IncludeOption = z.infer<typeof includeOptionSchema>;
export type IncludeOptions = z.infer<typeof includeOptionsSchema>;
