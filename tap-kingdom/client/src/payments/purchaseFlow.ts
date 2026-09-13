import { getInitData, openInvoice } from "../telegram/webApp";
import { useGameStore, type PurchaseRecord } from "../store/gameStore";

const BOT_API_URL = import.meta.env.VITE_BOT_API_URL ?? "http://localhost:4001";

export type { PurchaseRecord };
export type PurchaseOutcome = "paid" | "cancelled" | "failed" | "pending" | "network_error";

interface CreateInvoiceResponse {
  success: boolean;
  data?: { invoiceUrl: string };
  error?: { code: string; message: string };
}

interface EntitlementsResponse {
  success: boolean;
  data?: { items: PurchaseRecord[] };
  error?: { code: string; message: string };
}

/**
 * The full purchase flow, client side. The Mini App never decides prices or
 * ownership — it only asks the bot to create an invoice for a product id
 * (the bot looks up the real price), lets Telegram run the native payment
 * sheet, and then asks the bot again ("what do I actually own?") rather
 * than trusting the openInvoice callback status by itself. Ownership is
 * only ever granted from that second, server-confirmed answer, and applied
 * through the store's charge-id-keyed idempotency gate.
 */
export async function purchaseItem(itemId: string): Promise<PurchaseOutcome> {
  const initData = getInitData();
  if (!initData) return "network_error";

  let invoiceUrl: string;
  try {
    const res = await fetch(`${BOT_API_URL}/api/invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, initData }),
    });
    const json = (await res.json()) as CreateInvoiceResponse;
    if (!res.ok || !json.success || !json.data) return "failed";
    invoiceUrl = json.data.invoiceUrl;
  } catch {
    return "network_error";
  }

  const status = await openInvoice(invoiceUrl);
  if (status !== "paid") return status;

  // Telegram confirms "paid" to the client immediately, but the bot's own
  // successful_payment webhook — the only thing that actually fulfills the
  // purchase — can land a moment later. Poll briefly rather than trusting
  // the client-side status alone; applyFulfilledPurchases is idempotent per
  // charge id, so re-applying the same list on every poll is harmless.
  const before = useGameStore.getState().save.processedChargeIds.length;
  for (let i = 0; i < 6; i++) {
    const records = await fetchEntitlements(initData);
    useGameStore.getState().applyFulfilledPurchases(records);
    if (useGameStore.getState().save.processedChargeIds.length > before) return "paid";
    await sleep(700);
  }
  return "pending";
}

export async function fetchEntitlements(initData = getInitData()): Promise<PurchaseRecord[]> {
  if (!initData) return [];
  try {
    const res = await fetch(`${BOT_API_URL}/api/entitlements?initData=${encodeURIComponent(initData)}`);
    const json = (await res.json()) as EntitlementsResponse;
    if (!res.ok || !json.success || !json.data) return [];
    return json.data.items;
  } catch {
    return [];
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
