import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";
import { ChromaClient, type Collection, type Metadata } from "chromadb";

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
      host: config.host,
      port: config.port,
      ssl: false,
    });
    this.embeddingFunction = new DefaultEmbeddingFunction();
  }

  async heartbeat(): Promise<number> {
    return this.client.heartbeat();
  }

  async createCollection(
    name: string,
    metadata?: Metadata,
    getOrCreate?: boolean,
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
    return collections.map((col) => ({
      name: col.name,
      ...(col.metadata && { metadata: col.metadata }),
    }));
  }

  async deleteCollection(name: string): Promise<void> {
    await this.client.deleteCollection({ name });
  }
}
