import { create } from "zustand";
import { loadSave, persistSave, resetSave, type SaveData } from "./persistence";
import { BUILDINGS, getBuildingConfig, getUpgradeCost, getUpgradeSeconds, type BuildingType } from "../game/data/buildings";
import { HEROES, getHero, getHeroLevelUpCost, HERO_RARITY_LEVEL_CAP, computeHeroPower } from "../game/data/heroes";
import { TROOPS, getTroopConfig, getTroopUpgradeCost, computeTroopPower, type TroopType } from "../game/data/troops";
import { MISSIONS, type MissionMetric } from "../game/data/missions";
import { ACHIEVEMENTS, type AchievementMetric } from "../game/data/achievements";
import { DAILY_REWARDS } from "../game/data/dailyRewards";
import { getStage, type BattleStageConfig } from "../game/data/battleStages";
import { resolveBattle, type BattleResult } from "../game/logic/battle";
import {
  computeEnergyRegen,
  TAP_BURST_LIMIT,
  TAP_BURST_WINDOW_MS,
  TAP_COIN_REWARD,
  TAP_COOLDOWN_MS,
  xpForNextLevel,
  getFreeChestReward,
} from "../game/logic/economy";
import { applyShopItemEffect } from "../game/logic/premiumFulfillment";

/** One fulfilled Stars purchase as reported by the bot's /api/entitlements. */
export interface PurchaseRecord {
  itemId: string;
  chargeId: string;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface TapRateState {
  lastTapAt: number;
  windowStart: number;
  windowCount: number;
}

interface GameState {
  save: SaveData;
  recoveredFromCorruption: boolean;
  lastChestReward: { coins: number; gems: number; fragments: number } | null;
  lastBattleResult: BattleResult | null;

  tick: () => void;
  tap: () => { accepted: boolean; coinsGained: number };
  upgradeBuilding: (type: BuildingType) => { ok: boolean; error?: string };
  levelUpHero: (key: string) => { ok: boolean; error?: string };
  unlockHeroWithFragments: (key: string) => { ok: boolean; error?: string };
  trainTroop: (type: TroopType) => { ok: boolean; error?: string };
  upgradeTroop: (type: TroopType) => { ok: boolean; error?: string };
  fightBattle: (stageId: string) => { ok: boolean; error?: string; result?: BattleResult };
  openFreeChest: () => { ok: boolean; error?: string };
  claimDailyReward: () => { ok: boolean; error?: string; day?: number };
  claimMission: (id: string) => { ok: boolean; error?: string };
  claimAchievement: (id: string) => { ok: boolean; error?: string };
  applyFulfilledPurchases: (records: PurchaseRecord[]) => void;
  useHeroUpgradeToken: (heroKey: string) => { ok: boolean; error?: string };
  equipHeroSkin: (heroKey: string | null) => { ok: boolean; error?: string };
  equipHeroWeapon: (heroKey: string | null) => { ok: boolean; error?: string };
  setKingdomSkinActive: (active: boolean) => { ok: boolean; error?: string };
  updateSettings: (patch: Partial<SaveData["settings"]>) => void;
  completeTutorial: () => void;
  resetProgress: () => void;
}

const tapRate: TapRateState = { lastTapAt: 0, windowStart: 0, windowCount: 0 };

function computePlayerPower(save: SaveData): number {
  const castleLevel = save.buildings.CASTLE?.level ?? 1;
  const buildingPower = Object.values(save.buildings).reduce((sum, b) => sum + (b?.level ?? 0) * 8, castleLevel * 4);

  let heroPower = 0;
  for (const [key, state] of Object.entries(save.heroes)) {
    if (!state.unlocked) continue;
    heroPower += computeHeroPower(getHero(key), state.level);
  }

  let troopPower = 0;
  for (const [type, state] of Object.entries(save.troops)) {
    if (!state) continue;
    troopPower += computeTroopPower(type as TroopType, state.level, state.quantity);
  }

  return buildingPower + heroPower + troopPower;
}

function grantXp(save: SaveData, amount: number): void {
  save.xp += amount;
  while (save.xp >= xpForNextLevel(save.playerLevel)) {
    save.xp -= xpForNextLevel(save.playerLevel);
    save.playerLevel += 1;
  }
}

function achievementMetricValue(save: SaveData, metric: AchievementMetric): number {
  switch (metric) {
    case "tapsTotal": return save.stats.tapsTotal;
    case "battlesWon": return save.stats.battlesWon;
    case "bossesWon": return save.stats.bossesWon;
    case "castleLevel": return save.buildings.CASTLE?.level ?? 1;
    case "heroesUnlocked": return Object.values(save.heroes).filter((h) => h.unlocked).length;
    case "legendaryHeroesUnlocked": return HEROES.filter((h) => h.rarity === "LEGENDARY" && save.heroes[h.key]?.unlocked).length;
    case "mythicHeroesUnlocked": return HEROES.filter((h) => h.rarity === "MYTHIC" && save.heroes[h.key]?.unlocked).length;
    case "chestsOpened": return save.stats.chestsOpened;
    case "playerLevel": return save.playerLevel;
    case "missionsCompleted": return save.stats.missionsCompletedTotal;
    case "dailyRewardStreak": return save.dailyReward.streak;
  }
}

function missionMetricValue(save: SaveData, metric: MissionMetric): number {
  switch (metric) {
    case "tapsTotal": return save.stats.tapsTotal;
    case "battlesWon": return save.stats.battlesWon;
    case "buildingUpgrades": return buildingUpgradeCount(save);
    case "heroUpgrades": return heroUpgradeCount(save);
    case "coinsCollected": return save.stats.coinsCollectedTotal;
    case "chestsOpened": return save.stats.chestsOpened;
  }
}

// Lightweight lifetime counters derived from levels rather than tracked
// separately, since "how many upgrades have happened" == "sum of levels above baseline 1".
function buildingUpgradeCount(save: SaveData): number {
  return Object.values(save.buildings).reduce((sum, b) => sum + Math.max(0, (b?.level ?? 1) - 1), 0);
}
function heroUpgradeCount(save: SaveData): number {
  return Object.values(save.heroes).reduce((sum, h) => sum + Math.max(0, h.level - 1), 0);
}

function rollMissionsIfNeeded(save: SaveData): void {
  const today = todayKey();
  if (save.missionState.day === today) return;
  const baseline: Partial<Record<MissionMetric, number>> = {};
  for (const mission of MISSIONS) {
    baseline[mission.metric] = missionMetricValue(save, mission.metric);
  }
  save.missionState = { day: today, baseline, claimed: [] };
}

function resolveFinishedBuildingUpgrades(save: SaveData): void {
  const now = Date.now();
  for (const state of Object.values(save.buildings)) {
    if (state?.upgradeFinishesAt && state.upgradeFinishesAt <= now) {
      state.level += 1;
      state.upgradeFinishesAt = null;
    }
  }
}

const { save: initialSave, recovered } = loadSave();
resolveFinishedBuildingUpgrades(initialSave);
rollMissionsIfNeeded(initialSave);

export const useGameStore = create<GameState>((set, get) => ({
  save: initialSave,
  recoveredFromCorruption: recovered,
  lastChestReward: null,
  lastBattleResult: null,

  tick: () => {
    set((state) => {
      const save = structuredClone(state.save);
      const now = Date.now();
      const { energy, newTimestamp } = computeEnergyRegen(save.energy, save.energyMax, save.energyUpdatedAt, now);
      save.energy = energy;
      save.energyUpdatedAt = newTimestamp;
      resolveFinishedBuildingUpgrades(save);
      rollMissionsIfNeeded(save);
      persistSave(save);
      return { save };
    });
  },

  tap: () => {
    const now = Date.now();
    if (now - tapRate.lastTapAt < TAP_COOLDOWN_MS) {
      return { accepted: false, coinsGained: 0 };
    }
    if (now - tapRate.windowStart > TAP_BURST_WINDOW_MS) {
      tapRate.windowStart = now;
      tapRate.windowCount = 0;
    }
    if (tapRate.windowCount >= TAP_BURST_LIMIT) {
      return { accepted: false, coinsGained: 0 };
    }
    tapRate.lastTapAt = now;
    tapRate.windowCount += 1;

    let coinsGained = 0;
    set((state) => {
      const save = structuredClone(state.save);
      coinsGained = TAP_COIN_REWARD;
      save.coins += coinsGained;
      save.stats.tapsTotal += 1;
      save.stats.coinsCollectedTotal += coinsGained;
      persistSave(save);
      return { save };
    });
    return { accepted: true, coinsGained };
  },

  upgradeBuilding: (type) => {
    const save = structuredClone(get().save);
    const config = getBuildingConfig(type);
    const state = save.buildings[type];

    if (!state && config.unlockLevel > save.playerLevel) {
      return { ok: false, error: "LEVEL_TOO_LOW" };
    }
    const currentLevel = state?.level ?? 0;
    if (currentLevel >= config.maxLevel) {
      return { ok: false, error: "MAX_LEVEL" };
    }
    if (state?.upgradeFinishesAt && state.upgradeFinishesAt > Date.now()) {
      return { ok: false, error: "UPGRADE_IN_PROGRESS" };
    }
    const cost = getUpgradeCost(type, currentLevel);
    if (save.coins < cost) {
      return { ok: false, error: "INSUFFICIENT_COINS" };
    }

    save.coins -= cost;
    const seconds = getUpgradeSeconds(type, currentLevel);
    const finishesAt = Date.now() + seconds * 1000;
    if (currentLevel === 0) {
      save.buildings[type] = { level: 0, upgradeFinishesAt: finishesAt };
    } else {
      save.buildings[type] = { level: currentLevel, upgradeFinishesAt: finishesAt };
    }

    persistSave(save);
    set({ save });
    return { ok: true };
  },

  levelUpHero: (key) => {
    const save = structuredClone(get().save);
    const hero = getHero(key);
    const state = save.heroes[key];
    if (!state?.unlocked) return { ok: false, error: "HERO_NOT_OWNED" };

    const cap = HERO_RARITY_LEVEL_CAP[hero.rarity];
    if (state.level >= cap) return { ok: false, error: "MAX_LEVEL" };

    const cost = getHeroLevelUpCost(hero.rarity, state.level);
    if (save.coins < cost) return { ok: false, error: "INSUFFICIENT_COINS" };

    save.coins -= cost;
    state.level += 1;
    persistSave(save);
    set({ save });
    return { ok: true };
  },

  unlockHeroWithFragments: (key) => {
    const save = structuredClone(get().save);
    const hero = getHero(key);
    if (save.heroes[key]?.unlocked) return { ok: false, error: "HERO_ALREADY_OWNED" };
    if (save.heroFragments < hero.fragmentsToUnlock) return { ok: false, error: "INSUFFICIENT_FRAGMENTS" };

    save.heroFragments -= hero.fragmentsToUnlock;
    save.heroes[key] = { unlocked: true, level: 1 };
    persistSave(save);
    set({ save });
    return { ok: true };
  },

  trainTroop: (type) => {
    const save = structuredClone(get().save);
    const config = getTroopConfig(type);
    const cost = Math.round(config.baseUpgradeCost * 0.6);
    if (save.coins < cost) return { ok: false, error: "INSUFFICIENT_COINS" };

    save.coins -= cost;
    const existing = save.troops[type];
    save.troops[type] = existing ? { ...existing, quantity: existing.quantity + 1 } : { level: 1, quantity: 1 };
    persistSave(save);
    set({ save });
    return { ok: true };
  },

  upgradeTroop: (type) => {
    const save = structuredClone(get().save);
    const state = save.troops[type];
    if (!state || state.quantity === 0) return { ok: false, error: "NO_TROOPS" };

    const cost = getTroopUpgradeCost(type, state.level);
    if (save.coins < cost) return { ok: false, error: "INSUFFICIENT_COINS" };

    save.coins -= cost;
    state.level += 1;
    persistSave(save);
    set({ save });
    return { ok: true };
  },

  fightBattle: (stageId) => {
    const save = structuredClone(get().save);
    const stage: BattleStageConfig = getStage(stageId);

    const { energy, newTimestamp } = computeEnergyRegen(save.energy, save.energyMax, save.energyUpdatedAt, Date.now());
    save.energy = energy;
    save.energyUpdatedAt = newTimestamp;

    if (save.energy < stage.energyCost) {
      persistSave(save);
      set({ save });
      return { ok: false, error: "INSUFFICIENT_ENERGY" };
    }

    save.energy -= stage.energyCost;
    const power = computePlayerPower(save);
    const result = resolveBattle(power, stage);

    save.coins += result.rewardCoins;
    save.gems += result.rewardGems;
    save.heroFragments += result.rewardFragments;
    save.stats.coinsCollectedTotal += result.rewardCoins;
    grantXp(save, result.rewardXp);

    if (result.won) {
      save.stats.battlesWon += 1;
      if (stage.type === "BOSS") save.stats.bossesWon += 1;
    }

    persistSave(save);
    set({ save, lastBattleResult: result });
    return { ok: true, result };
  },

  openFreeChest: () => {
    const save = structuredClone(get().save);
    const cost = 5; // gems
    if (save.gems < cost) return { ok: false, error: "INSUFFICIENT_GEMS" };

    save.gems -= cost;
    const reward = getFreeChestReward();
    save.coins += reward.coins;
    save.gems += reward.gems;
    save.heroFragments += reward.fragments;
    save.stats.chestsOpened += 1;
    save.stats.coinsCollectedTotal += reward.coins;

    persistSave(save);
    set({ save, lastChestReward: reward });
    return { ok: true };
  },

  claimDailyReward: () => {
    const save = structuredClone(get().save);
    const today = todayKey();
    if (save.dailyReward.lastClaimDay === today) {
      return { ok: false, error: "ALREADY_CLAIMED_TODAY" };
    }

    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const streak = save.dailyReward.lastClaimDay === yesterday ? save.dailyReward.streak + 1 : 1;
    const dayIndex = ((streak - 1) % 7) + 1;
    const reward = DAILY_REWARDS.find((d) => d.day === dayIndex)!;

    switch (reward.currency) {
      case "coins": save.coins += reward.amount; save.stats.coinsCollectedTotal += reward.amount; break;
      case "gems": save.gems += reward.amount; break;
      case "energy": save.energy = Math.min(save.energyMax, save.energy + reward.amount); break;
      case "fragments": save.heroFragments += reward.amount; break;
      case "chest": {
        const chest = getFreeChestReward();
        save.coins += chest.coins;
        save.gems += chest.gems;
        save.heroFragments += chest.fragments;
        save.stats.chestsOpened += 1;
        break;
      }
    }

    save.dailyReward = { lastClaimDay: today, streak };
    persistSave(save);
    set({ save });
    return { ok: true, day: dayIndex };
  },

  claimMission: (id) => {
    const save = structuredClone(get().save);
    rollMissionsIfNeeded(save);
    const mission = MISSIONS.find((m) => m.id === id);
    if (!mission) return { ok: false, error: "UNKNOWN_MISSION" };
    if (save.missionState.claimed.includes(id)) return { ok: false, error: "ALREADY_CLAIMED" };

    const progress = missionMetricValue(save, mission.metric) - (save.missionState.baseline[mission.metric] ?? 0);
    if (progress < mission.target) return { ok: false, error: "NOT_COMPLETE" };

    save.coins += mission.rewardCoins;
    save.gems += mission.rewardGems;
    save.heroFragments += mission.rewardFragments;
    grantXp(save, mission.rewardXp);
    save.missionState.claimed.push(id);
    save.stats.missionsCompletedTotal += 1;

    persistSave(save);
    set({ save });
    return { ok: true };
  },

  claimAchievement: (id) => {
    const save = structuredClone(get().save);
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    if (!achievement) return { ok: false, error: "UNKNOWN_ACHIEVEMENT" };
    if (save.achievementsClaimed.includes(id)) return { ok: false, error: "ALREADY_CLAIMED" };

    const value = achievementMetricValue(save, achievement.metric);
    if (value < achievement.target) return { ok: false, error: "NOT_COMPLETE" };

    save.coins += achievement.rewardCoins;
    save.gems += achievement.rewardGems;
    grantXp(save, achievement.rewardXp);
    save.achievementsClaimed.push(id);

    persistSave(save);
    set({ save });
    return { ok: true };
  },

  /**
   * Called after the client asks the bot which purchases are on file for
   * this Telegram user (see payments/purchaseFlow.ts). Idempotent per
   * charge id — a consumable (chest, hero pack) can be bought repeatedly,
   * each purchase carrying its own charge id, and each is applied exactly
   * once no matter how many times this function re-runs with overlapping
   * data (e.g. every app launch re-syncs the full list).
   */
  applyFulfilledPurchases: (records) => {
    const save = structuredClone(get().save);
    let changed = false;
    for (const { itemId, chargeId } of records) {
      if (save.processedChargeIds.includes(chargeId)) continue;
      applyShopItemEffect(save, itemId); // owns all state changes, including marking cosmetics owned
      save.processedChargeIds.push(chargeId);
      changed = true;
    }
    if (changed) {
      persistSave(save);
      set({ save });
    }
  },

  useHeroUpgradeToken: (heroKey) => {
    const save = structuredClone(get().save);
    if (save.heroUpgradeTokens <= 0) return { ok: false, error: "NO_TOKENS" };
    const state = save.heroes[heroKey];
    if (!state?.unlocked) return { ok: false, error: "HERO_NOT_OWNED" };

    const hero = getHero(heroKey);
    const cap = HERO_RARITY_LEVEL_CAP[hero.rarity];
    save.heroUpgradeTokens -= 1;
    state.level = Math.min(cap, state.level + 10);

    persistSave(save);
    set({ save });
    return { ok: true };
  },

  equipHeroSkin: (heroKey) => {
    const save = structuredClone(get().save);
    if (!save.ownedCosmeticItemIds.includes("exclusive_skin")) return { ok: false, error: "NOT_OWNED" };
    if (heroKey && !save.heroes[heroKey]?.unlocked) return { ok: false, error: "HERO_NOT_OWNED" };

    save.equippedSkinHeroKey = heroKey;
    persistSave(save);
    set({ save });
    return { ok: true };
  },

  equipHeroWeapon: (heroKey) => {
    const save = structuredClone(get().save);
    if (!save.ownedCosmeticItemIds.includes("premium_weapon")) return { ok: false, error: "NOT_OWNED" };
    if (heroKey && !save.heroes[heroKey]?.unlocked) return { ok: false, error: "HERO_NOT_OWNED" };

    save.equippedWeaponHeroKey = heroKey;
    persistSave(save);
    set({ save });
    return { ok: true };
  },

  setKingdomSkinActive: (active) => {
    const save = structuredClone(get().save);
    if (!save.ownedCosmeticItemIds.includes("premium_kingdom_skin")) return { ok: false, error: "NOT_OWNED" };

    save.kingdomSkinActive = active;
    persistSave(save);
    set({ save });
    return { ok: true };
  },

  updateSettings: (patch) => {
    const save = structuredClone(get().save);
    save.settings = { ...save.settings, ...patch };
    persistSave(save);
    set({ save });
  },

  completeTutorial: () => {
    const save = structuredClone(get().save);
    save.tutorialCompleted = true;
    persistSave(save);
    set({ save });
  },

  resetProgress: () => {
    const fresh = resetSave();
    set({ save: fresh, recoveredFromCorruption: false, lastChestReward: null, lastBattleResult: null });
  },
}));

export { computePlayerPower, achievementMetricValue, missionMetricValue, TROOPS, BUILDINGS };
