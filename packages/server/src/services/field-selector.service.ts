import type {
  SearchResultItem,
  SelectClause,
  DefaultMetadata,
} from "@search-server/sdk";

export class FieldSelectorService {
  process(
    results: readonly SearchResultItem[],
    select: SelectClause
  ): SearchResultItem[] {
    const keysSet = new Set(select.keys);
    const includeAll = keysSet.size === 0;
    const includeMetadata = keysSet.has("#metadata");

    // Find specific metadata fields (not #metadata)
    const specificMetadataFields = select.keys.filter(
      (k): k is string => typeof k === "string" && !k.startsWith("#")
    );

    return results.map((item) => {
      const filtered: Partial<SearchResultItem> = {};

      // ID is always included
      filtered.id = item.id;

      // Include document if selected
      if (includeAll || keysSet.has("#document")) {
        if (item.document !== undefined) {
          filtered.document = item.document;
        }
      }

      // Include embedding if selected
      if (includeAll || keysSet.has("#embedding")) {
        if (item.embedding !== undefined) {
          filtered.embedding = item.embedding;
        }
      }

      // Include score if selected
      if (includeAll || keysSet.has("#score")) {
        if (item.score !== undefined) {
          filtered.score = item.score;
        }
        if (item.distance !== undefined) {
          filtered.distance = item.distance;
        }
      }

      // Handle metadata selection
      if (item.metadata !== undefined) {
        if (includeAll || includeMetadata) {
          // Include all metadata
          filtered.metadata = item.metadata;
        } else if (specificMetadataFields.length > 0) {
          // Include only specific metadata fields
          const partialMetadata: Record<string, unknown> = {};
          for (const field of specificMetadataFields) {
            if (item.metadata[field] !== undefined) {
              partialMetadata[field] = item.metadata[field];
            }
          }
          if (Object.keys(partialMetadata).length > 0) {
            filtered.metadata = partialMetadata as DefaultMetadata;
          }
        }
      }

      return filtered as SearchResultItem;
    });
  }
}
