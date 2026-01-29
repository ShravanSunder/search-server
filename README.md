# Search Server

A vector search API built on ChromaDB with support for KNN queries, RRF fusion, metadata filtering, and result grouping.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Hono HTTP Server                       │
├─────────────────────────────────────────────────────────────┤
│  Routes                                                     │
│  ├── /health              Health check                      │
│  ├── /collections         Collection CRUD                   │
│  ├── /collections/:name   Document operations (add/get/del) │
│  └── /collections/:name/search   Search endpoint            │
├─────────────────────────────────────────────────────────────┤
│  Services                                                   │
│  ├── ChromaClientService       ChromaDB connection          │
│  ├── KnnQueryExecutor          Vector similarity search     │
│  ├── RrfFusionService          Multi-query rank fusion      │
│  ├── FieldSelectorService      Response field projection    │
│  ├── GroupByAggregator         Result grouping              │
│  └── SearchExecutorService     Orchestrates search pipeline │
├─────────────────────────────────────────────────────────────┤
│                        ChromaDB                             │
└─────────────────────────────────────────────────────────────┘
```

## Packages

| Package | Description |
|---------|-------------|
| `@search-server/sdk` | Zod schemas and TypeScript types |
| `@search-server/server` | Hono-based HTTP server |

```
packages/
├── sdk-ts/     # Shared types and validation schemas
└── server/     # HTTP server implementation
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Start ChromaDB (choose one method)

# Option 1: Using Python/uv (recommended for local dev)
uv venv && uv pip install chromadb
.venv/bin/chroma run --host 0.0.0.0 --port 8000 --path /tmp/chroma-data &

# Option 2: Using Docker
docker run -p 8000:8000 chromadb/chroma

# Verify ChromaDB is running
curl http://localhost:8000/api/v2/heartbeat

# Start the server
cd packages/server
pnpm dev

# Create collection and upload sample data
pnpm entity create my-collection
pnpm entity upload my-collection scripts/sample-entities.jsonl

# Run a search
pnpm entity search my-collection scripts/sample-search.json
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `CHROMA_HOST` | `localhost` | ChromaDB host |
| `CHROMA_PORT` | `8000` | ChromaDB port |

## API Overview

### Collections

```bash
GET    /collections              # List collections
POST   /collections              # Create collection
GET    /collections/:name        # Get collection info
DELETE /collections/:name        # Delete collection
```

### Documents

```bash
POST   /collections/:name/add    # Add documents
POST   /collections/:name/get    # Get documents by ID
POST   /collections/:name/update # Update documents
POST   /collections/:name/upsert # Upsert documents
POST   /collections/:name/delete # Delete documents
GET    /collections/:name/count  # Count documents
```

### Search

```bash
POST   /collections/:name/search # Search documents
```

#### Search Request Schema

```typescript
{
  // KNN query (required)
  rank: {
    query: number[],     // Embedding vector
    limit?: number,      // Candidates to retrieve
    returnRank?: boolean // Include distance in results
  },

  // Or RRF fusion of multiple queries
  rank: {
    ranks: KnnQuery[],   // Multiple queries
    k?: number,          // RRF constant (default: 60)
    weights?: number[],  // Query weights
    normalize?: boolean  // Normalize scores
  },

  // Filters
  where?: WhereClause,           // Metadata filter
  whereDocument?: WhereDocument, // Content filter

  // Output control
  select?: { keys: string[] },   // Field projection
  groupBy?: GroupByClause,       // Result grouping
  limit?: number | { limit, offset }
}
```

#### Where Filters

```json
// Simple equality
{ "category": "AI" }

// Comparison operators
{ "year": { "$gte": 2023 } }

// Logical operators
{ "$and": [{ "category": "AI" }, { "year": 2024 }] }
{ "$or": [{ "status": "active" }, { "priority": "high" }] }

// List operators
{ "tag": { "$in": ["ml", "nlp", "cv"] } }
```

#### GroupBy Aggregation

```json
{
  "groupBy": {
    "keys": { "field": "category" },
    "aggregate": {
      "$min_k": { "keys": { "field": "#distance" }, "k": 3 }
    }
  }
}
```

## CLI Tools

See [packages/server/scripts/README.md](packages/server/scripts/README.md) for the entity manager CLI documentation.

```bash
cd packages/server

pnpm entity list                              # List collections
pnpm entity create <name>                     # Create collection
pnpm entity upload <name> <file.jsonl>        # Upload entities
pnpm entity search <name> <request.json>      # Search
pnpm entity count <name>                      # Count documents
pnpm entity delete <name>                     # Delete collection
```

## Development

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm check
pnpm check:fix

# Build all packages
pnpm build

# Integration tests (requires running ChromaDB)
cd packages/server
pnpm test:integration
```

## Tech Stack

- **Runtime**: Node.js
- **Framework**: [Hono](https://hono.dev)
- **Vector DB**: [ChromaDB](https://www.trychroma.com)
- **Validation**: [Zod](https://zod.dev)
- **Build**: Vite
- **Package Manager**: pnpm (monorepo)
