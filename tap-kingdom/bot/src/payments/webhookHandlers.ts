import type { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { decodePayload } from "./invoice.js";
import { getProduct } from "./products.js";
import { recordPurchase } from "./ledger.js";

/**
 * Registers the two Telegram updates that make up the actual payment flow.
 * Everything here runs on the bot, never the client:
 *  - pre_checkout_query: Telegram asks us to approve the charge right
 *    before it happens. We re-validate the product and price from our own
 *    catalog (never from the payload alone) and reject anything that
 *    doesn't match.
 *  - successful_payment: Telegram tells us the Stars have actually been
 *    charged. This is the only place a purchase is ever fulfilled, and it's
 *    guarded by the ledger's charge-id idempotency check so a duplicate or
 *    retried update can never grant the same purchase twice.
 */
export function registerPaymentHandlers(bot: Telegraf): void {
  bot.on("pre_checkout_query", async (ctx) => {
    const query = ctx.preCheckoutQuery;
    const payload = decodePayload(query.invoice_payload);
    const product = payload ? getProduct(payload.itemId) : undefined;

    if (!payload || !product) {
      await ctx.answerPreCheckoutQuery(false, "This item is no longer available.");
      return;
    }
    if (query.currency !== "XTR" || query.total_amount !== product.priceStars) {
      await ctx.answerPreCheckoutQuery(false, "This item's price has changed. Please reopen the shop.");
      return;
    }
    if (payload.telegramUserId !== query.from.id) {
      await ctx.answerPreCheckoutQuery(false, "This invoice was issued to a different account.");
      return;
    }

    await ctx.answerPreCheckoutQuery(true);
  });

  bot.on(message("successful_payment"), async (ctx) => {
    const payment = ctx.message.successful_payment;
    const payload = decodePayload(payment.invoice_payload);
    if (!payload) {
      // Should be unreachable — every invoice we create carries a payload we
      // generated ourselves. Nothing to fulfill if we can't decode it.
      return;
    }

    const { alreadyProcessed } = await recordPurchase(ctx.from.id, payload.itemId, payment.telegram_payment_charge_id);
    if (alreadyProcessed) {
      // Telegram redelivered an update we already handled (retry/reconnect).
      // The purchase was already fulfilled the first time — say nothing new.
      return;
    }

    const product = getProduct(payload.itemId);
    await ctx.reply(
      `🎉 Purchase successful! ${product?.title ?? payload.itemId} has been added to your Tap Kingdom inventory.\n\nOpen the game to see it.`
    );
  });
}
