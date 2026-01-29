import type { Collection } from "chromadb";
import type {
  SearchRequest,
  SearchResponse,
  SearchResultItem,
  KnnQuery,
  RrfClause,
} from "@search-server/sdk";
import { KnnQueryExecutorService } from "./knn-query-executor.service.js";
import { RrfFusionService } from "./rrf-fusion.service.js";
import { GroupByAggregatorService } from "./group-by-aggregator.service.js";
import { FieldSelectorService } from "./field-selector.service.js";

export class SearchExecutorService {
  private readonly knnExecutor: KnnQueryExecutorService;
  private readonly rrfProcessor: RrfFusionService;
  private readonly groupByProcessor: GroupByAggregatorService;
  private readonly selectProcessor: FieldSelectorService;

  constructor(private readonly collection: Collection) {
    this.knnExecutor = new KnnQueryExecutorService(collection);
    this.rrfProcessor = new RrfFusionService();
    this.groupByProcessor = new GroupByAggregatorService();
    this.selectProcessor = new FieldSelectorService();
  }

  async execute(request: SearchRequest): Promise<SearchResponse> {
    const startTime = performance.now();

    // 1. Execute ranking (KNN or RRF)
    let results: SearchResultItem[];
    if (this.isRrfClause(request.rank)) {
      results = await this.executeRrf(request);
    } else if (request.rank) {
      results = await this.executeKnn(request);
    } else {
      throw new Error("rank (KNN or RRF) is required");
    }

    // 2. Apply offset (server-side, ChromaDB query doesn't support it)
    const offset = this.getOffset(request.limit);
    if (offset > 0) {
      results = results.slice(offset);
    }

    // 3. Apply limit
    const limit = this.getLimit(request.limit);
    if (limit !== undefined) {
      results = results.slice(0, limit);
    }

    // 4. Apply field selection
    if (request.select) {
      results = this.selectProcessor.process(results, request.select);
    }

    // 5. Apply GroupBy aggregation (if present)
    if (request.groupBy) {
      const groups = this.groupByProcessor.process(results, request.groupBy);
      const took = performance.now() - startTime;
      return {
        grouped: true,
        groups,
        totalGroups: groups.length,
        totalItems: groups.reduce((sum, g) => sum + g.items.length, 0),
        took,
      };
    }

    // 6. Return non-grouped response
    const took = performance.now() - startTime;
    return {
      grouped: false,
      results,
      total: results.length,
      took,
    };
  }

  private isRrfClause(rank: unknown): rank is RrfClause {
    return rank !== null && typeof rank === "object" && "ranks" in rank;
  }

  private async executeKnn(
    request: SearchRequest
  ): Promise<SearchResultItem[]> {
    const knn = request.rank as KnnQuery;
    return this.knnExecutor.execute(knn, request.where, request.whereDocument);
  }

  private async executeRrf(
    request: SearchRequest
  ): Promise<SearchResultItem[]> {
    const rrf = request.rank as RrfClause;

    // Execute each KNN query in the RRF
    const queryResults: SearchResultItem[][] = [];
    for (const knn of rrf.ranks) {
      const results = await this.knnExecutor.execute(
        knn,
        request.where,
        request.whereDocument
      );
      queryResults.push(results);
    }

    // Fuse results using RRF algorithm
    return this.rrfProcessor.process(queryResults, rrf);
  }

  private getLimit(limit: SearchRequest["limit"]): number | undefined {
    if (limit === undefined) return undefined;
    if (typeof limit === "number") return limit;
    return limit.limit;
  }

  private getOffset(limit: SearchRequest["limit"]): number {
    if (limit === undefined) return 0;
    if (typeof limit === "number") return 0;
    return limit.offset ?? 0;
  }
}
