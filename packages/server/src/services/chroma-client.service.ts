import {
  ChromaClient,
  type Collection,
  type Metadata,
  DefaultEmbeddingFunction,
} from "chromadb";

export interface ChromaClientConfig {
  readonly host: string;
  readonly port: number;
}

export interface CollectionInfo {
  readonly name: string;
  readonly metadata?: Metadata;
}

export class ChromaClientService {
  private readonly client: ChromaClient;
  private readonly embeddingFunction: DefaultEmbeddingFunction;

  constructor(config: ChromaClientConfig) {
    this.client = new ChromaClient({
      path: `http://${config.host}:${config.port}`,
    });
    this.embeddingFunction = new DefaultEmbeddingFunction();
  }

  async heartbeat(): Promise<number> {
    return this.client.heartbeat();
  }

  async createCollection(
    name: string,
    metadata?: Metadata,
    getOrCreate?: boolean
  ): Promise<Collection> {
    const params = {
      name,
      embeddingFunction: this.embeddingFunction,
      ...(metadata ? { metadata } : {}),
    };

    if (getOrCreate) {
      return this.client.getOrCreateCollection(params);
    }
    return this.client.createCollection(params);
  }

  async getCollection(name: string): Promise<Collection> {
    return this.client.getCollection({
      name,
      embeddingFunction: this.embeddingFunction,
    });
  }

  async listCollections(): Promise<CollectionInfo[]> {
    const collections = await this.client.listCollections();
    // ChromaDB returns array of strings in newer versions
    const result: CollectionInfo[] = [];
    for (const col of collections as unknown[]) {
      if (typeof col === "string") {
        result.push({ name: col });
      } else {
        const typed = col as { name: string; metadata?: Metadata };
        if (typed.metadata) {
          result.push({ name: typed.name, metadata: typed.metadata });
        } else {
          result.push({ name: typed.name });
        }
      }
    }
    return result;
  }

  async deleteCollection(name: string): Promise<void> {
    await this.client.deleteCollection({ name });
  }
}
