import type { SearchResultItem, DefaultMetadata } from "@search-server/sdk";

export interface ChromaQueryResult {
  ids: string[][];
  documents?: (string | null)[][] | null;
  embeddings?: (number[] | null)[][] | null;
  metadatas?: (Record<string, unknown> | null)[][] | null;
  distances?: number[][] | null;
}

export class ChromaResultTransformerService {
  transformQueryResults(
    chromaResults: ChromaQueryResult,
    returnRank?: boolean
  ): SearchResultItem[] {
    const results: SearchResultItem[] = [];

    // ChromaDB returns arrays of arrays (for batch queries)
    // We only send single queries, so take first element
    const ids = chromaResults.ids[0] ?? [];
    const documents = chromaResults.documents?.[0];
    const embeddings = chromaResults.embeddings?.[0];
    const metadatas = chromaResults.metadatas?.[0];
    const distances = chromaResults.distances?.[0];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (!id) continue;

      const rawMetadata = metadatas?.[i];
      const metadata = rawMetadata
        ? (rawMetadata as DefaultMetadata)
        : undefined;

      const item: SearchResultItem = {
        id,
        document: documents?.[i] ?? undefined,
        embedding: embeddings?.[i] ?? undefined,
        metadata,
        // Use rank (index) if returnRank is true, otherwise use distance
        score: returnRank ? i : undefined,
        distance: returnRank ? undefined : distances?.[i],
      };

      results.push(item);
    }

    return results;
  }
}
