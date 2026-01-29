import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ApiError } from "@search-server/sdk";
import type { AppEnv } from "../app-context.js";

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  // Validation errors (from zod-validator)
  if (err instanceof HTTPException) {
    const apiError: ApiError = {
      code: `HTTP_${err.status}`,
      message: err.message,
      details: err.cause as Record<string, unknown> | undefined,
    };
    return c.json(apiError, err.status);
  }

  // ChromaDB errors (check error message patterns)
  if (err instanceof Error) {
    const message = err.message.toLowerCase();

    if (message.includes("not found") || message.includes("does not exist")) {
      const apiError: ApiError = {
        code: "NOT_FOUND",
        message: err.message,
      };
      return c.json(apiError, 404);
    }

    if (message.includes("already exists")) {
      const apiError: ApiError = {
        code: "CONFLICT",
        message: err.message,
      };
      return c.json(apiError, 409);
    }

    // Generic server error
    const apiError: ApiError = {
      code: "INTERNAL_ERROR",
      message: err.message,
    };
    return c.json(apiError, 500);
  }

  // Unknown error
  const apiError: ApiError = {
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred",
  };
  return c.json(apiError, 500);
};
