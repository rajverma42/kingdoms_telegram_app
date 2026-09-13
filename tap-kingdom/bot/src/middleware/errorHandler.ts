import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ success: false, error: { code: err.code, message: err.message } });
    return;
  }

  // Never leak stack traces or internals to the client.
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } });
}
