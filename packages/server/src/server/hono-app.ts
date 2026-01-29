import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { ChromaClientService } from "../services/chroma-client.service.js";
import type { AppEnv } from "./app-context.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";
import { collectionsRouter } from "./routes/collection.route.js";
import { documentsRouter } from "./routes/document.route.js";
import { healthRouter } from "./routes/health.route.js";
import { searchRouter } from "./routes/search.route.js";

export interface CreateAppOptions {
  chromaClient: ChromaClientService;
}

export function createApp(options: CreateAppOptions): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  // Global middleware - must be added BEFORE routes
  app.use("*", logger());
  app.use("*", cors());

  // Inject ChromaDB client into context BEFORE routes
  app.use("*", async (c, next) => {
    c.set("chromaClient", options.chromaClient);
    await next();
  });

  app.onError(errorHandler);

  // Routes
  app.route("/health", healthRouter);
  app.route("/collections", collectionsRouter);
  app.route("/collections/:name", documentsRouter);
  app.route("/collections/:name/search", searchRouter);

  return app;
}
