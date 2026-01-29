import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Extracts and validates collection name from route params.
 * Throws 400 if name is missing or empty.
 */
export function getCollectionName(c: Context): string {
  const name = c.req.param("name");
  if (!name || name.trim() === "") {
    throw new HTTPException(400, { message: "Collection name is required" });
  }
  return name;
}
