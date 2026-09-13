import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The minimal server-side persistence this game needs. It is deliberately
 * NOT a "game database" — the game's own progress (coins, buildings,
 * heroes, etc.) lives entirely in the client's localStorage, per this
 * project's requirements. But Stars payments cannot be verified from a
 * client-only source of truth ("never trust local storage for payment
 * verification" / "never grant an item twice"), so this flat JSON file is
 * the one piece of state that must live on the server: a purchase ledger,
 * keyed by Telegram's own `telegram_payment_charge_id`, used only to decide
 * what a user has actually paid for and to make fulfillment idempotent.
 *
 * A single JSON file with an in-process write lock is enough for a single
 * bot instance. If this bot is ever scaled to multiple processes, replace
 * this module with a real key-value store — the interface below is small
 * enough to swap out without touching any caller.
 */

export interface PurchaseRecord {
  itemId: string;
  chargeId: string;
}

interface LedgerData {
  version: 1;
  // telegramUserId (stringified) -> purchase records for that user
  entitlements: Record<string, PurchaseRecord[]>;
  // flat index of every charge id ever processed, for O(1) duplicate checks
  processedChargeIds: string[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = join(__dirname, "../../data/purchases.json");

function emptyLedger(): LedgerData {
  return { version: 1, entitlements: {}, processedChargeIds: [] };
}

async function readLedger(): Promise<LedgerData> {
  try {
    const raw = await readFile(LEDGER_PATH, "utf8");
    const parsed = JSON.parse(raw) as LedgerData;
    if (!parsed || typeof parsed !== "object" || !parsed.entitlements || !Array.isArray(parsed.processedChargeIds)) {
      throw new Error("malformed ledger");
    }
    return parsed;
  } catch {
    return emptyLedger();
  }
}

async function writeLedger(data: LedgerData): Promise<void> {
  await mkdir(dirname(LEDGER_PATH), { recursive: true });
  const tmpPath = `${LEDGER_PATH}.tmp`;
  await writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
  await rename(tmpPath, LEDGER_PATH); // atomic on the same filesystem — avoids a torn write if the process dies mid-save
}

// Serializes all read-modify-write cycles through this file so two
// near-simultaneous webhook deliveries (e.g. a Telegram retry) can never
// race each other into a lost update.
let queue: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const result = queue.then(fn, fn);
  queue = result.catch(() => {});
  return result;
}

export function isChargeProcessed(chargeId: string): Promise<boolean> {
  return locked(async () => {
    const ledger = await readLedger();
    return ledger.processedChargeIds.includes(chargeId);
  });
}

/**
 * Records a fulfilled purchase. Idempotent: if this chargeId was already
 * recorded, does nothing and reports it. This is the single choke point
 * that prevents a duplicated Telegram update (or a retried webhook) from
 * ever granting the same purchase twice.
 */
export function recordPurchase(telegramUserId: number, itemId: string, chargeId: string): Promise<{ alreadyProcessed: boolean }> {
  return locked(async () => {
    const ledger = await readLedger();
    if (ledger.processedChargeIds.includes(chargeId)) {
      return { alreadyProcessed: true };
    }

    const key = String(telegramUserId);
    const existing = ledger.entitlements[key] ?? [];
    ledger.entitlements[key] = [...existing, { itemId, chargeId }];
    ledger.processedChargeIds.push(chargeId);

    await writeLedger(ledger);
    return { alreadyProcessed: false };
  });
}

export function getEntitlements(telegramUserId: number): Promise<PurchaseRecord[]> {
  return locked(async () => {
    const ledger = await readLedger();
    return ledger.entitlements[String(telegramUserId)] ?? [];
  });
}
