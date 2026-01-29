import type { RrfClause, SearchResultItem } from "@search-server/sdk";

interface RankedDocument {
  item: SearchResultItem;
  rrfScore: number;
}

export class RrfFusionService {
  /**
   * Combine multiple ranked result lists using RRF.
   *
   * Formula: score = -sum(weight_i / (k + rank_i + 1))
   *
   * The negative sign ensures lower scores are better (matching ChromaDB distance semantics).
   * We add 1 to rank because ranks are 0-indexed.
   */
  process(
    queryResults: readonly (readonly SearchResultItem[])[],
    config: RrfClause,
  ): SearchResultItem[] {
    const k = config.k ?? 60;
    let weights = config.weights ? [...config.weights] : queryResults.map(() => 1);

    // Normalize weights if requested
    if (config.normalize && weights.length > 0) {
      const sum = weights.reduce((a, b) => a + b, 0);
      weights = weights.map((w) => w / sum);
    }

    // Map document ID -> accumulated RRF data
    const scoreMap = new Map<string, RankedDocument>();

    // Process each query's results
    for (let queryIdx = 0; queryIdx < queryResults.length; queryIdx++) {
      const results = queryResults[queryIdx];
      const weight = weights[queryIdx] ?? 1;

      if (!results) continue;

      for (let rank = 0; rank < results.length; rank++) {
        const item = results[rank];
        if (!item) continue;

        // RRF contribution: weight / (k + rank + 1)
        const contribution = weight / (k + rank + 1);

        const existing = scoreMap.get(item.id);
        if (existing) {
          // Accumulate RRF score
          existing.rrfScore += contribution;
        } else {
          scoreMap.set(item.id, {
            item,
            rrfScore: contribution,
          });
        }
      }
    }

    // Handle documents that didn't appear in some rankings (using default rank)
    // This is only relevant if KNN queries have a `default` value set
    // For now, we only include documents that appear in at least one ranking

    // Sort by RRF score (higher contribution = better, but we negate for distance semantics)
    const sortedResults = Array.from(scoreMap.values()).sort((a, b) => b.rrfScore - a.rrfScore);

    // Return items with RRF score as the score field (negated)
    return sortedResults.map(({ item, rrfScore }) => ({
      ...item,
      score: -rrfScore, // Negate so lower is better
    }));
  }
}
