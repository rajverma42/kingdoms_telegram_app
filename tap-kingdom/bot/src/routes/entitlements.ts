import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireTelegramInitData } from "../middleware/telegramAuth.js";
import { getEntitlements } from "../payments/ledger.js";

export const entitlementsRouter = Router();
entitlementsRouter.use(rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false }));
entitlementsRouter.use(requireTelegramInitData);

entitlementsRouter.get("/", async (req, res, next) => {
  try {
    const items = await getEntitlements(req.telegramUser!.id);
    res.json({ success: true, data: { items } });
  } catch (err) {
    next(err);
  }
});
