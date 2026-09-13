import express from "express";
import cors from "cors";
import helmet from "helmet";
import type { Telegraf } from "telegraf";
import { env } from "./config/env.js";
import { createInvoiceRouter } from "./routes/invoice.js";
import { entitlementsRouter } from "./routes/entitlements.js";
import { errorHandler } from "./middleware/errorHandler.js";

/**
 * The bot's only HTTP surface: creating a Stars invoice for the Mini App to
 * open, and reporting back what a Telegram user has actually purchased.
 * No game state, no admin routes — everything else the game needs lives in
 * the client's local save.
 */
export function createServer(bot: Telegraf): express.Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
  app.use("/api/invoice", createInvoiceRouter(bot));
  app.use("/api/entitlements", entitlementsRouter);

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found." } });
  });

  app.use(errorHandler);
  return app;
}
