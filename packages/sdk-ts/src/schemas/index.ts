// ============================================================================
// Common schemas and types
// ============================================================================
export {
  metadataValueSchema,
  defaultMetadataSchema,
  embeddingSchema,
  documentIdSchema,
  documentContentSchema,
  documentSchema,
  apiErrorSchema,
  includeOptionSchema,
  includeOptionsSchema,
  createDocumentSchema,
  createApiResponseSchema,
  type MetadataValue,
  type DefaultMetadata,
  type Embedding,
  type DocumentId,
  type DocumentContent,
  type Document,
  type ApiError,
  type Result,
  type IncludeOption,
  type IncludeOptions,
} from "./common.schema.js";

// ============================================================================
// Where filter schemas
// ============================================================================
export {
  whereComparisonValueSchema,
  whereClauseSchema,
  type WhereComparisonValue,
  type WhereClause,
} from "./where-filter.schema.js";

// ============================================================================
// WhereDocument filter schemas
// ============================================================================
export {
  whereDocumentClauseSchema,
  type WhereDocumentClause,
} from "./where-document-filter.schema.js";

// ============================================================================
// Field selection schemas
// ============================================================================
export {
  builtInFieldSchema,
  selectFieldSchema,
  selectClauseSchema,
  K,
  type BuiltInField,
  type SelectField,
  type SelectClause,
} from "./field-selection.schema.js";

// ============================================================================
// KNN query schemas
// ============================================================================
export { knnQuerySchema, type KnnQuery } from "./knn-query.schema.js";

// ============================================================================
// Aggregation schemas
// ============================================================================
export {
  keyRefSchema,
  minKClauseSchema,
  maxKClauseSchema,
  groupByClauseSchema,
  type KeyRef,
  type MinKClause,
  type MaxKClause,
  type GroupByClause,
} from "./aggregation.schema.js";

// ============================================================================
// RRF ranking schemas
// ============================================================================
export { rrfClauseSchema, type RrfClause } from "./rrf-ranking.schema.js";

// ============================================================================
// Search request schemas
// ============================================================================
export {
  limitClauseSchema,
  searchRequestSchema,
  batchSearchRequestSchema,
  type LimitClause,
  type SearchRequest,
  type BatchSearchRequest,
} from "./search-request.schema.js";

// ============================================================================
// Search response schemas
// ============================================================================
export {
  searchResultItemSchema,
  groupedSearchResultSchema,
  ungroupedSearchResponseSchema,
  groupedSearchResponseSchema,
  searchResponseSchema,
  batchSearchResponseSchema,
  createSearchResultItemSchema,
  type SearchResultItem,
  type GroupedSearchResult,
  type UngroupedSearchResponse,
  type GroupedSearchResponse,
  type SearchResponse,
  type BatchSearchResponse,
} from "./search-response.schema.js";

// ============================================================================
// Collection operation schemas
// ============================================================================
export {
  createCollectionRequestSchema,
  collectionInfoSchema,
  createCollectionResponseSchema,
  listCollectionsResponseSchema,
  getCollectionResponseSchema,
  deleteCollectionResponseSchema,
  type CreateCollectionRequest,
  type CollectionInfo,
  type CreateCollectionResponse,
  type ListCollectionsResponse,
  type GetCollectionResponse,
  type DeleteCollectionResponse,
} from "./collection-operations.schema.js";

// ============================================================================
// Document operation schemas
// ============================================================================
export {
  addDocumentsRequestSchema,
  addDocumentsResponseSchema,
  getDocumentsRequestSchema,
  getDocumentsResponseSchema,
  queryDocumentsRequestSchema,
  queryDocumentsResponseSchema,
  updateDocumentsRequestSchema,
  updateDocumentsResponseSchema,
  upsertDocumentsRequestSchema,
  upsertDocumentsResponseSchema,
  deleteDocumentsRequestSchema,
  deleteDocumentsResponseSchema,
  countDocumentsResponseSchema,
  peekDocumentsRequestSchema,
  peekDocumentsResponseSchema,
  type AddDocumentsRequest,
  type AddDocumentsResponse,
  type GetDocumentsRequest,
  type GetDocumentsResponse,
  type QueryDocumentsRequest,
  type QueryDocumentsResponse,
  type UpdateDocumentsRequest,
  type UpdateDocumentsResponse,
  type UpsertDocumentsRequest,
  type UpsertDocumentsResponse,
  type DeleteDocumentsRequest,
  type DeleteDocumentsResponse,
  type CountDocumentsResponse,
  type PeekDocumentsRequest,
  type PeekDocumentsResponse,
} from "./document-operations.schema.js";
