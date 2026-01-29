# Scripts

CLI tools and sample data for interacting with the Search Server API.

## Entity Manager

`entity-manager.ts` is a CLI tool for uploading entities and executing searches against the server.

### Commands

```bash
# Start the server first
pnpm dev

# Collection management
pnpm entity list                          # List all collections
pnpm entity create <collection>           # Create collection
pnpm entity delete <collection>           # Delete collection
pnpm entity count <collection>            # Count documents

# Upload entities from JSONL
pnpm entity upload <collection> <file.jsonl>

# Search (inline JSON or file)
pnpm entity search <collection> <request>
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--server-url` | `http://localhost:3001` | Server URL |

## File Structure

```
scripts/
├── entity-manager.ts           # CLI tool
├── sample-entities.jsonl       # Generic test data (AI, DB, Web topics)
├── sample-entities-banking.jsonl  # Banking domain test data
├── sample-search.json          # Basic KNN search with where filter
├── sample-search-grouped.json  # GroupBy aggregation example
├── search-complex-and.json     # $and operator example
├── search-complex-in-nin.json  # $in/$nin operators
├── search-complex-nested.json  # Nested $and/$or logic
├── search-complex-permission.json  # Multi-tenant permission filter
└── search-complex-range-grouped.json  # Range + groupBy
```

## JSONL Format

Each line is a JSON object:

```jsonl
{"id":"doc1","content":"Text content","embedding":[0.1,0.2,...],"metadata":{"key":"value"}}
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier |
| `content` | One of | Text content (server generates embedding) |
| `embedding` | One of | Pre-computed vector |
| `metadata` | No | Key-value pairs for filtering |

## Search Request Schema

```json
{
  "rank": {
    "query": [0.1, 0.2, 0.8],  // Embedding vector
    "limit": 20                 // KNN candidates
  },
  "where": { "category": "AI" },           // Metadata filter
  "whereDocument": { "$contains": "ML" },  // Content filter
  "select": { "keys": ["#document", "category"] },
  "groupBy": {
    "keys": { "field": "category" },
    "aggregate": { "$min_k": { "keys": { "field": "#distance" }, "k": 2 }}
  },
  "limit": 10
}
```

### Special Fields

- `#document` - Document content
- `#embedding` - Vector embedding
- `#distance` - KNN distance
- `#score` - RRF fusion score

## Quick Start

```bash
# 1. Start server
pnpm dev

# 2. Create collection and upload sample data
pnpm entity create test-collection
pnpm entity upload test-collection scripts/sample-entities.jsonl

# 3. Run searches
pnpm entity search test-collection scripts/sample-search.json
pnpm entity search test-collection scripts/sample-search-grouped.json

# 4. Inline search
pnpm entity search test-collection '{"rank":{"query":[0.1,0.2,0.8,0.3,0.4],"limit":10}}'
```
