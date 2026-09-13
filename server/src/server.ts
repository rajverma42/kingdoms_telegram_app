import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { authRouter } from "./routes/auth.js";
import { kingdomRouter } from "./routes/kingdom.js";
import { battleRouter } from "./routes/battle.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "*" }));
app.use(express.json());

// Global rate limit. Tighter, endpoint-specific limits (e.g. on /battle/start,
// /payment/*) get added in later phases per src/config/gameConfig.ts.
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

app.use("/api/auth", authRouter);
app.use("/api/kingdom", kingdomRouter);
app.use("/api/battle", battleRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found." } });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 4000);

if (!process.env.TELEGRAM_BOT_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn("WARNING: TELEGRAM_BOT_TOKEN is not set. Auth requests will fail.");
}

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Kingdom Rush server listening on :${PORT}`);
});
