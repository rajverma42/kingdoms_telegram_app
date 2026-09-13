import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { Telegraf } from "telegraf";
import { requireTelegramInitData } from "../middleware/telegramAuth.js";
import { badRequest } from "../utils/errors.js";
import { getProduct } from "../payments/products.js";
import { createStarsInvoiceLink } from "../payments/invoice.js";

export function createInvoiceRouter(bot: Telegraf): Router {
  const router = Router();
  router.use(rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }));
  router.use(requireTelegramInitData);

  router.post("/", async (req, res, next) => {
    try {
      const itemId = typeof req.body?.itemId === "string" ? req.body.itemId : undefined;
      if (!itemId) throw badRequest("itemId is required", "VALIDATION_ERROR");

      const product = getProduct(itemId);
      if (!product) throw badRequest("Unknown product.", "INVALID_PRODUCT");

      const invoiceUrl = await createStarsInvoiceLink(bot.telegram, itemId, req.telegramUser!.id);
      if (!invoiceUrl) throw badRequest("Could not create invoice.", "INVOICE_FAILED");

      res.json({ success: true, data: { invoiceUrl } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
