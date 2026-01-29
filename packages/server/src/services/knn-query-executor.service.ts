import type { Collection } from "chromadb";
import type {
  KnnQuery,
  WhereClause,
  WhereDocumentClause,
  SearchResultItem,
} from "@search-server/sdk";
import { ChromaResultTransformerService } from "./chroma-result-transformer.service.js";

export class KnnQueryExecutorService {
  private readonly transformer: ChromaResultTransformerService;

  constructor(private readonly collection: Collection) {
    this.transformer = new ChromaResultTransformerService();
  }

  async execute(
    knn: KnnQuery,
    where?: WhereClause,
    whereDocument?: WhereDocumentClause
  ): Promise<SearchResultItem[]> {
    // Reject custom embedding keys until feature is implemented
    if (knn.key !== undefined && knn.key !== "#embedding") {
      throw new Error(
        `Custom embedding key "${knn.key}" is not yet supported. Use default #embedding or omit the key parameter.`
      );
    }

    // Determine if query is embedding or text
    const isTextQuery = typeof knn.query === "string";

    // Build query params - use explicit any to bypass ChromaDB's strict types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryParams: any = {
      nResults: knn.limit ?? 100,
      include: ["documents", "embeddings", "metadatas", "distances"],
    };

    if (isTextQuery) {
      queryParams.queryTexts = [knn.query as string];
    } else {
      queryParams.queryEmbeddings = [[...(knn.query as readonly number[])]];
    }

    if (where) queryParams.where = where;
    if (whereDocument) queryParams.whereDocument = whereDocument;

    const chromaResults = await this.collection.query(queryParams);

    // Transform ChromaDB results to SearchResultItem[]
    // Cast to any to bypass strict ChromaDB types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = chromaResults as any;
    return this.transformer.transformQueryResults(
      {
        ids: results.ids,
        documents: results.documents ?? null,
        embeddings: results.embeddings ?? null,
        metadatas: results.metadatas ?? null,
        distances: results.distances ?? null,
      },
      knn.returnRank
    );
  }
}
