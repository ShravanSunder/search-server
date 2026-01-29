# search-server



## Project Structure

```
packages/
  sdk-ts/          # @search-server/sdk - Common types (TypeScript)
  server/          # @search-server/server - Search server (imports sdk)
```

## Package Dependencies

```
@search-server/server → @search-server/sdk
```

## Starting ChromaDB

The TypeScript chromadb client is CLIENT-ONLY - it connects to a running ChromaDB server. Use `uvx` to run the server without installing anything:

```bash
# Start ChromaDB server (run in background)
uvx --from chromadb chroma run --host 0.0.0.0 --port 8000 --path /tmp/chroma-data &

# Verify it's running
curl http://localhost:8000/api/v2/heartbeat
```

The server runs on `localhost:8000` by default. Configure via `CHROMA_HOST` and `CHROMA_PORT` env vars.
# Rules

You must load and follow the rules in the following files:

@.cursor/rules/typescript.mdc