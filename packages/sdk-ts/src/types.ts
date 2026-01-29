// These are stubs and fake types that shoulkd nto be follwoed, yoku will rewrite this when you have the actual types.

export interface SearchQuery {
  query: string;
  limit?: number;
  offset?: number;
  fields?: readonly string[];
}

export interface SearchResult {
  id: string;
  score: number;
  document: Record<string, unknown>;
  highlights?: Record<string, string>;
}

export interface SearchResponse {
  results: readonly SearchResult[];
  total: number;
  took: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
