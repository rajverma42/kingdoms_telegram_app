import type { BuildingType } from "../game/data/buildings";
import type { TroopType } from "../game/data/troops";
import type { MissionMetric } from "../game/data/missions";

export const SAVE_VERSION = 1;
const STORAGE_KEY = "tapkingdom.save.v1";
const CORRUPT_BACKUP_KEY = "tapkingdom.save.corrupt-backup";

export interface HeroSaveState {
  unlocked: boolean;
  level: number;
}

export interface BuildingSaveState {
  level: number;
  upgradeFinishesAt: number | null;
}

export interface TroopSaveState {
  level: number;
  quantity: number;
}

export interface StatsState {
  tapsTotal: number;
  battlesWon: number;
  bossesWon: number;
  chestsOpened: number;
  coinsCollectedTotal: number;
  missionsCompletedTotal: number;
}

export interface SaveData {
  version: number;
  playerLevel: number;
  xp: number;
  coins: number;
  gems: number;
  heroFragments: number;
  heroUpgradeTokens: number;
  energy: number;
  energyMax: number;
  energyUpdatedAt: number;
  buildings: Partial<Record<BuildingType, BuildingSaveState>>;
  heroes: Record<string, HeroSaveState>;
  troops: Partial<Record<TroopType, TroopSaveState>>;
  /**
   * Every Telegram payment charge id whose effect has already been applied.
   * This — not the item id — is the idempotency key: a consumable (a chest,
   * a hero pack) can be bought many times, each with its own charge id, and
   * each must be applied exactly once. Never mutated by any client-only
   * code path; entries only ever come from the bot's /api/entitlements.
   */
  processedChargeIds: string[];
  /** Item ids owned for display purposes only (e.g. "Owned" on a one-time cosmetic in the Shop). Does not gate fulfillment. */
  ownedCosmeticItemIds: string[];
  missionState: {
    day: string; // YYYY-MM-DD the current mission set was rolled for
    baseline: Partial<Record<MissionMetric, number>>;
    claimed: string[];
  };
  achievementsClaimed: string[];
  dailyReward: { lastClaimDay: string | null; streak: number };
  stats: StatsState;
  settings: {
    sound: boolean;
    music: boolean;
    vibration: boolean;
    language: "en" | "hi";
  };
  tutorialCompleted: boolean;
  createdAt: number;
}

export function createDefaultSave(language: "en" | "hi" = "en"): SaveData {
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    playerLevel: 1,
    xp: 0,
    coins: 100,
    gems: 10,
    heroFragments: 0,
    heroUpgradeTokens: 0,
    energy: 50,
    energyMax: 50,
    energyUpdatedAt: now,
    buildings: { CASTLE: { level: 1, upgradeFinishesAt: null } },
    heroes: {},
    troops: {},
    processedChargeIds: [],
    ownedCosmeticItemIds: [],
    missionState: { day: "", baseline: {}, claimed: [] },
    achievementsClaimed: [],
    dailyReward: { lastClaimDay: null, streak: 0 },
    stats: {
      tapsTotal: 0,
      battlesWon: 0,
      bossesWon: 0,
      chestsOpened: 0,
      coinsCollectedTotal: 0,
      missionsCompletedTotal: 0,
    },
    settings: { sound: true, music: true, vibration: true, language },
    tutorialCompleted: false,
    createdAt: now,
  };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Structural sanity check — not a full schema validator, just enough to catch truncated/garbled JSON before it reaches game logic. */
function isValidSave(data: unknown): data is SaveData {
  if (!isPlainObject(data)) return false;
  const requiredNumberFields = ["version", "playerLevel", "xp", "coins", "gems", "heroFragments", "heroUpgradeTokens", "energy", "energyMax", "energyUpdatedAt"];
  for (const field of requiredNumberFields) {
    if (typeof data[field] !== "number" || Number.isNaN(data[field])) return false;
  }
  if (!isPlainObject(data.buildings) || !isPlainObject(data.heroes) || !isPlainObject(data.troops)) return false;
  if (!Array.isArray(data.processedChargeIds) || !Array.isArray(data.ownedCosmeticItemIds)) return false;
  if (!isPlainObject(data.missionState) || !isPlainObject(data.dailyReward) || !isPlainObject(data.stats) || !isPlainObject(data.settings)) return false;
  return true;
}

/** Runs any needed migrations. Only version 1 exists today; this is the seam for future save-format changes. */
function migrate(data: SaveData): SaveData {
  if (data.version === SAVE_VERSION) return data;
  // Future migrations go here, e.g.: if (data.version === 1) { ... return migrated; }
  return { ...createDefaultSave(), ...data, version: SAVE_VERSION };
}

export function loadSave(): { save: SaveData; recovered: boolean } {
  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) {
    return { save: createDefaultSave(detectPreferredLanguage()), recovered: false };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidSave(parsed)) {
      throw new Error("Save data failed structural validation");
    }
    return { save: migrate(parsed), recovered: false };
  } catch {
    // Corrupted or unreadable save. Keep a copy for support/debugging, then
    // start fresh rather than crash the app on launch.
    safeSetItem(CORRUPT_BACKUP_KEY, raw);
    return { save: createDefaultSave(detectPreferredLanguage()), recovered: true };
  }
}

export function persistSave(save: SaveData): void {
  safeSetItem(STORAGE_KEY, JSON.stringify(save));
}

export function resetSave(): SaveData {
  const fresh = createDefaultSave(detectPreferredLanguage());
  persistSave(fresh);
  return fresh;
}

function detectPreferredLanguage(): "en" | "hi" {
  const tgLang = window.Telegram?.WebApp.initDataUnsafe.user?.language_code;
  return tgLang?.startsWith("hi") ? "hi" : "en";
}

// localStorage can throw in private-browsing modes or when a Telegram
// client's WebView blocks storage — never let a save/load call crash the app.
function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Best-effort only — if storage is unavailable, the session still plays,
    // it just won't persist across reloads.
  }
}
