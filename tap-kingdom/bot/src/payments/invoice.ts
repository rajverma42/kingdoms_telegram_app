import type { Telegram } from "telegraf";
import { getProduct } from "./products.js";

export interface InvoicePayload {
  itemId: string;
  telegramUserId: number;
  nonce: string;
}

export function encodePayload(payload: InvoicePayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function decodePayload(raw: string): InvoicePayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    if (
      parsed &&
      typeof parsed.itemId === "string" &&
      typeof parsed.telegramUserId === "number" &&
      typeof parsed.nonce === "string"
    ) {
      return parsed as InvoicePayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Creates a Telegram Stars invoice link for a catalog product. The price
 * always comes from products.ts (the server-side catalog) — this function
 * has no parameter for a client-supplied price, by design.
 */
export async function createStarsInvoiceLink(telegram: Telegram, itemId: string, telegramUserId: number): Promise<string | null> {
  const product = getProduct(itemId);
  if (!product) return null;

  const payload = encodePayload({ itemId, telegramUserId, nonce: cryptoRandomId() });

  return telegram.createInvoiceLink({
    title: product.title,
    description: product.description,
    payload,
    provider_token: "", // Telegram Stars payments use no external payment provider
    currency: "XTR",
    prices: [{ label: product.title, amount: product.priceStars }],
  });
}

function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
