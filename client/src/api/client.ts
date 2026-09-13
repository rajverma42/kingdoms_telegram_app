import { getInitData } from "../telegram/telegramSdk";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export class ApiRequestError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": getInitData(),
      ...options.headers,
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    const code = json?.error?.code ?? "UNKNOWN_ERROR";
    const message = json?.error?.message ?? "Something went wrong.";
    throw new ApiRequestError(res.status, code, message);
  }

  return json.data as T;
}

export const api = {
  authTelegram: () => request<{ id: string; username?: string; level: number; xp: number; preferredLang: string }>(
    "/auth/telegram",
    { method: "POST" }
  ),
  getKingdom: () => request<KingdomDto>("/kingdom"),
  upgradeBuilding: (type: string) =>
    request<{ type: string; level: number; upgradeFinishesAt: string | null }>("/kingdom/building/upgrade", {
      method: "POST",
      body: JSON.stringify({ type }),
    }),
  getStages: () => request<StageDto[]>("/battle/stages"),
  startBattle: (stageId: string) =>
    request<{ battleId: string; stageId: string; energyCost: number }>("/battle/start", {
      method: "POST",
      body: JSON.stringify({ stageId }),
    }),
  completeBattle: (battleId: string) =>
    request<BattleResultDto>("/battle/complete", {
      method: "POST",
      body: JSON.stringify({ battleId }),
    }),
  getHeroes: () => request<RosterDto>("/hero"),
  recruitHero: (heroKey: string) =>
    request<{ recruited: boolean }>("/hero/recruit", {
      method: "POST",
      body: JSON.stringify({ heroKey }),
    }),
  levelUpHero: (heroKey: string) =>
    request<{ level: number }>("/hero/level-up", {
      method: "POST",
      body: JSON.stringify({ heroKey }),
    }),
  rankUpHero: (heroKey: string) =>
    request<{ rank: number }>("/hero/rank-up", {
      method: "POST",
      body: JSON.stringify({ heroKey }),
    }),
  equipHero: (heroKey: string, slot: number) =>
    request<{ equipped: boolean }>("/hero/equip", {
      method: "POST",
      body: JSON.stringify({ heroKey, slot }),
    }),
  unequipHero: (heroKey: string) =>
    request<{ equipped: boolean }>("/hero/unequip", {
      method: "POST",
      body: JSON.stringify({ heroKey }),
    }),
};

export interface BuildingDto {
  id: string;
  type: string;
  level: number;
  upgrading: boolean;
  upgradeFinishesAt: string | null;
  nextLevelCost: number;
  nextLevelSeconds: number;
}

export interface KingdomDto {
  id: string;
  name: string;
  level: number;
  power: number;
  gold: string;
  gems: string;
  energy: number;
  energyMax: number;
  buildings: BuildingDto[];
}

export interface StageDto {
  id: string;
  type: string;
  name: string;
  energyCost: number;
  rewardGold: [number, number];
  rewardGems: [number, number];
  rewardXp: number;
}

export interface BattleResultDto {
  outcome: "WIN" | "LOSE";
  rewardGold: number;
  rewardGems: number;
  rewardXp: number;
  userXp: number;
}

export type HeroDto =
  | {
      key: string;
      name: string;
      rarity: string;
      owned: false;
      recruitGoldCost: number;
    }
  | {
      key: string;
      name: string;
      rarity: string;
      owned: true;
      level: number;
      rank: number;
      maxRank: number;
      levelCap: number;
      equipSlot: number | null;
      power: number;
      nextLevelCost: number | null;
      nextRankCost: { gold: number; gems: number } | null;
    };

export interface RosterDto {
  teamSize: number;
  heroes: HeroDto[];
}
