import { serve } from "@hono/node-server";
import { loadConfig } from "./server-config.js";
import { createApp } from "./server/hono-app.js";
import { ChromaClientService } from "./services/chroma-client.service.js";

async function main(): Promise<void> {
  const config = loadConfig();

  // Initialize ChromaDB client
  const chromaClient = new ChromaClientService({
    host: config.chromaHost,
    port: config.chromaPort,
  });

  // Verify connection
  try {
    await chromaClient.heartbeat();
    console.log(`Connected to ChromaDB at ${config.chromaHost}:${config.chromaPort}`);
  } catch (error) {
    console.error("Failed to connect to ChromaDB:", error);
    process.exit(1);
  }

  // Create app with chromaClient injected
  const app = createApp({ chromaClient });

  // Start server
  console.log(`Starting server on ${config.host}:${config.port}`);

  serve({
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
