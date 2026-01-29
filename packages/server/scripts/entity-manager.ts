#!/usr/bin/env tsx
/**
 * Entity Manager Script
 *
 * Upload entities from JSONL files and search for them via the Search Server API.
 *
 * Usage:
 *   # Upload entities from JSONL file
 *   pnpm entity upload <collection> <file.jsonl> [--server-url=http://localhost:3000]
 *
 *   # Search for entities
 *   pnpm entity search <collection> <query> [--limit=10] [--server-url=http://localhost:3000]
 *
 *   # List collections
 *   pnpm entity list [--server-url=http://localhost:3000]
 *
 *   # Create collection
 *   pnpm entity create <collection> [--server-url=http://localhost:3000]
 *
 *   # Delete collection
 *   pnpm entity delete <collection> [--server-url=http://localhost:3000]
 *
 *   # Count documents in collection
 *   pnpm entity count <collection> [--server-url=http://localhost:3000]
 *
 * JSONL Format:
 *   Each line should be a JSON object with:
 *   - id: string (required) - unique identifier
 *   - content: string (optional) - document text content
 *   - embedding: number[] (optional) - pre-computed embedding vector
 *   - metadata: object (optional) - key-value metadata
 *
 *   At least one of content or embedding must be provided.
 *
 * Example JSONL:
 *   {"id":"doc1","content":"Machine learning is fascinating","metadata":{"category":"AI","year":2024}}
 *   {"id":"doc2","content":"Deep learning uses neural networks","metadata":{"category":"AI","year":2023}}
 */

import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import type { SearchRequest, SearchResponse, SearchResultItem } from "@search-server/sdk";

interface Entity {
  id: string;
  content?: string;
  embedding?: number[];
  metadata?: Record<string, string | number | boolean>;
}

interface ParsedArgs {
  serverUrl: string;
  limit: number;
}

function parseCliArgs(): ParsedArgs {
  const { values } = parseArgs({
    options: {
      "server-url": { type: "string", default: "http://localhost:3000" },
      limit: { type: "string", default: "10" },
    },
    allowPositionals: true,
  });

  return {
    serverUrl: values["server-url"] ?? "http://localhost:3000",
    limit: Number.parseInt(values.limit ?? "10", 10),
  };
}

async function readJsonlFile(filePath: string): Promise<Entity[]> {
  const entities: Entity[] = [];
  const fileStream = createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Number.POSITIVE_INFINITY,
  });

  let lineNumber = 0;
  for await (const line of rl) {
    lineNumber++;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#")) {
      continue; // Skip empty lines and comments
    }

    try {
      const entity = JSON.parse(trimmed) as Entity;
      if (!entity.id) {
        console.error(`Line ${lineNumber}: Missing required 'id' field`);
        continue;
      }
      if (!entity.content && !entity.embedding) {
        console.error(`Line ${lineNumber}: Entity must have 'content' or 'embedding'`);
        continue;
      }
      entities.push(entity);
    } catch (err) {
      console.error(`Line ${lineNumber}: Invalid JSON - ${err}`);
    }
  }

  return entities;
}

async function uploadEntities(
  serverUrl: string,
  collection: string,
  entities: Entity[],
): Promise<void> {
  const batchSize = 100;

  for (let i = 0; i < entities.length; i += batchSize) {
    const batch = entities.slice(i, i + batchSize);

    const payload = {
      ids: batch.map((e) => e.id),
      documents: batch.some((e) => e.content) ? batch.map((e) => e.content ?? "") : undefined,
      embeddings: batch.some((e) => e.embedding) ? batch.map((e) => e.embedding ?? []) : undefined,
      metadatas: batch.some((e) => e.metadata) ? batch.map((e) => e.metadata ?? {}) : undefined,
    };

    const response = await fetch(`${serverUrl}/collections/${collection}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as { added: number };
    console.log(`Uploaded batch ${Math.floor(i / batchSize) + 1}: ${result.added} entities`);
  }
}

async function loadSearchRequest(input: string): Promise<SearchRequest> {
  // Check if input is a file path
  if (input.endsWith(".json")) {
    const fs = await import("node:fs/promises");
    const content = await fs.readFile(input, "utf-8");
    return JSON.parse(content) as SearchRequest;
  }

  // Try to parse as inline JSON
  return JSON.parse(input) as SearchRequest;
}

async function searchEntities(
  serverUrl: string,
  collection: string,
  request: SearchRequest,
): Promise<void> {
  const response = await fetch(`${serverUrl}/collections/${collection}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Search failed: ${response.status} - ${error}`);
  }

  const result = (await response.json()) as SearchResponse;

  if (result.grouped) {
    console.log(
      `\nFound ${result.totalGroups} groups (${result.totalItems} items) in ${result.took.toFixed(2)}ms:\n`,
    );

    for (const group of result.groups) {
      console.log(`Group: ${group.groupKey} = ${group.groupValue}`);
      for (let i = 0; i < group.items.length; i++) {
        const item = group.items[i];
        if (!item) continue;
        printResultItem(item, i + 1, "  ");
      }
      console.log();
    }
  } else {
    console.log(`\nFound ${result.results.length} results in ${result.took.toFixed(2)}ms:\n`);

    for (let i = 0; i < result.results.length; i++) {
      const item = result.results[i];
      if (!item) continue;
      printResultItem(item, i + 1, "");
    }
  }
}

function printResultItem(item: SearchResultItem, index: number, indent: string): void {
  console.log(`${indent}${index}. [${item.id}]`);
  if (item.distance !== undefined) {
    console.log(`${indent}   Distance: ${item.distance.toFixed(4)}`);
  }
  if (item.score !== undefined) {
    console.log(`${indent}   Score: ${item.score.toFixed(4)}`);
  }
  if (item.document) {
    const preview =
      item.document.length > 100 ? `${item.document.slice(0, 100)}...` : item.document;
    console.log(`${indent}   Content: ${preview}`);
  }
  if (item.metadata && Object.keys(item.metadata).length > 0) {
    console.log(`${indent}   Metadata: ${JSON.stringify(item.metadata)}`);
  }
  if (item.embedding) {
    console.log(`${indent}   Embedding: [${item.embedding.slice(0, 3).join(", ")}...]`);
  }
}

async function listCollections(serverUrl: string): Promise<void> {
  const response = await fetch(`${serverUrl}/collections`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`List failed: ${response.status} - ${error}`);
  }

  const result = (await response.json()) as {
    collections: Array<{ name: string; metadata?: Record<string, unknown> }>;
  };

  console.log(`\nCollections (${result.collections.length}):\n`);
  for (const col of result.collections) {
    console.log(`  - ${col.name}`);
    if (col.metadata && Object.keys(col.metadata).length > 0) {
      console.log(`    Metadata: ${JSON.stringify(col.metadata)}`);
    }
  }
}

async function createCollection(serverUrl: string, name: string): Promise<void> {
  const response = await fetch(`${serverUrl}/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Create failed: ${response.status} - ${error}`);
  }

  const result = (await response.json()) as {
    collection: { name: string; id: string };
  };
  console.log(`Created collection: ${result.collection.name}`);
}

async function deleteCollection(serverUrl: string, name: string): Promise<void> {
  const response = await fetch(`${serverUrl}/collections/${name}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete failed: ${response.status} - ${error}`);
  }

  console.log(`Deleted collection: ${name}`);
}

async function countDocuments(serverUrl: string, collection: string): Promise<void> {
  const response = await fetch(`${serverUrl}/collections/${collection}/count`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Count failed: ${response.status} - ${error}`);
  }

  const result = (await response.json()) as { count: number };
  console.log(`Collection '${collection}' has ${result.count} documents`);
}

function printUsage(): void {
  console.log(`
Entity Manager - Upload and search entities via Search Server API

Usage:
  pnpm entity <command> [options]

Commands:
  upload <collection> <file.jsonl>   Upload entities from JSONL file
  search <collection> <request>      Search with full request (inline JSON or .json file)
  list                               List all collections
  create <collection>                Create a new collection
  delete <collection>                Delete a collection
  count <collection>                 Count documents in collection

Options:
  --server-url=<url>   Server URL (default: http://localhost:3000)

Search Request:
  <request> can be:
    - Inline JSON: '{"rank":{"query":[0.1,0.2,0.8,0.3,0.4],"limit":10}}'
    - JSON file:   search-request.json

  Full schema supports:
    rank:         KNN query or RRF fusion
    where:        Metadata filters
    whereDocument: Content filters
    limit:        Pagination
    select:       Field selection
    groupBy:      Result grouping

Examples:
  # Simple KNN search with embedding
  pnpm entity search my-collection '{"rank":{"query":[0.1,0.2,0.8,0.3,0.4],"limit":10}}'

  # Search with where filter
  pnpm entity search my-collection '{"rank":{"query":[0.1,0.2,0.8],"limit":20},"where":{"category":"AI"}}'

  # Search with groupBy
  pnpm entity search my-collection '{"rank":{"query":[0.1,0.2],"limit":50},"groupBy":{"keys":{"field":"category"},"aggregate":{"$min_k":{"keys":{"field":"#distance"},"k":2}}}}'

  # Search from file
  pnpm entity search my-collection scripts/sample-search.json

JSONL Format (for upload):
  {"id":"doc1","content":"text...","embedding":[0.1,0.2,...],"metadata":{"key":"value"}}
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const { serverUrl } = parseCliArgs();

  if (!command || command === "help" || command === "--help") {
    printUsage();
    process.exit(0);
  }

  try {
    switch (command) {
      case "upload": {
        const collection = args[1];
        const filePath = args[2];
        if (!collection || !filePath) {
          console.error("Usage: pnpm entity upload <collection> <file.jsonl>");
          process.exit(1);
        }
        console.log(`Reading entities from ${filePath}...`);
        const entities = await readJsonlFile(filePath);
        console.log(`Found ${entities.length} valid entities`);

        if (entities.length === 0) {
          console.error("No valid entities to upload");
          process.exit(1);
        }

        console.log(`Uploading to collection '${collection}'...`);
        await uploadEntities(serverUrl, collection, entities);
        console.log("\nUpload complete!");
        break;
      }

      case "search": {
        const collection = args[1];
        const requestArg = args[2];
        if (!collection || !requestArg) {
          console.error("Usage: pnpm entity search <collection> <request>");
          console.error("  request: inline JSON or path to .json file");
          console.error("");
          console.error("Examples:");
          console.error(
            '  pnpm entity search my-col \'{"rank":{"query":[0.1,0.2,0.3],"limit":10}}\'',
          );
          console.error("  pnpm entity search my-col scripts/search-request.json");
          process.exit(1);
        }

        try {
          const request = await loadSearchRequest(requestArg);
          console.log(`Searching in '${collection}'...`);
          await searchEntities(serverUrl, collection, request);
        } catch (err) {
          if (err instanceof SyntaxError) {
            console.error(`Invalid JSON: ${err.message}`);
            console.error("Provide valid inline JSON or a path to a .json file");
          } else {
            throw err;
          }
          process.exit(1);
        }
        break;
      }

      case "list": {
        await listCollections(serverUrl);
        break;
      }

      case "create": {
        const collection = args[1];
        if (!collection) {
          console.error("Usage: pnpm entity create <collection>");
          process.exit(1);
        }
        await createCollection(serverUrl, collection);
        break;
      }

      case "delete": {
        const collection = args[1];
        if (!collection) {
          console.error("Usage: pnpm entity delete <collection>");
          process.exit(1);
        }
        await deleteCollection(serverUrl, collection);
        break;
      }

      case "count": {
        const collection = args[1];
        if (!collection) {
          console.error("Usage: pnpm entity count <collection>");
          process.exit(1);
        }
        await countDocuments(serverUrl, collection);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

main();
