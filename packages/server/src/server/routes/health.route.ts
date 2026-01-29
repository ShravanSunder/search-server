import { Hono } from "hono";
import type { AppEnv } from "../app-context.js";

export const healthRouter = new Hono<AppEnv>();

healthRouter.get("/", async (c) => {
  const chromaClient = c.get("chromaClient");

  try {
    const heartbeat = await chromaClient.heartbeat();
    return c.json({
      status: "ok",
      chromadb: "connected",
      heartbeat,
    });
  } catch {
    return c.json(
      {
        status: "degraded",
        chromadb: "disconnected",
      },
      503,
    );
  }
});
