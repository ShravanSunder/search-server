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

    // 2. Branch: grouped vs ungrouped
    if (request.groupBy) {
      // GroupBy FIRST on all results (before pagination/selection)
      const allGroups = this.groupByProcessor.process(results, request.groupBy);
      const totalItems = allGroups.reduce((sum, g) => sum + g.items.length, 0);

      // Paginate GROUPS (not items)
      const offset = this.getOffset(request.limit);
      const limit = this.getLimit(request.limit);
      const paginatedGroups = allGroups.slice(
        offset,
        limit !== undefined ? offset + limit : undefined
      );

      // Field selection on items within paginated groups (last)
      if (request.select) {
        for (const group of paginatedGroups) {
          group.items = this.selectProcessor.process(group.items, request.select);
        }
      }

      const took = performance.now() - startTime;
      return {
        grouped: true,
        groups: paginatedGroups,
        totalGroups: allGroups.length,
        totalItems,
        took,
      };
    }

    // Ungrouped: paginate items, then select
    const offset = this.getOffset(request.limit);
    if (offset > 0) {
      results = results.slice(offset);
    }

    const limit = this.getLimit(request.limit);
    if (limit !== undefined) {
      results = results.slice(0, limit);
    }

    if (request.select) {
      results = this.selectProcessor.process(results, request.select);
    }

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
