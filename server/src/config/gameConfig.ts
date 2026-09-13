import type { BuildingType } from "@prisma/client";

/**
 * Default economy values. In production these are loaded from the
 * `GameSetting` table (admin-editable) with these as fallback/seed values —
 * see src/services/settingsService.ts. Nothing here should be hardcoded
 * into gameplay logic directly; always go through settingsService.
 */

export interface BuildingLevelConfig {
  goldCost: number;
  upgradeSeconds: number;
  productionPerHour?: number; // for resource buildings
}

export const BUILDING_BASE_CONFIG: Record<BuildingType, { maxLevel: number; costGrowth: number; timeGrowth: number; baseCost: number; baseSeconds: number; baseProduction?: number }> = {
  CASTLE:          { maxLevel: 20, costGrowth: 1.45, timeGrowth: 1.35, baseCost: 500,  baseSeconds: 60 },
  BARRACKS:        { maxLevel: 15, costGrowth: 1.35, timeGrowth: 1.30, baseCost: 200,  baseSeconds: 45 },
  ARCHER_TOWER:    { maxLevel: 15, costGrowth: 1.35, timeGrowth: 1.30, baseCost: 200,  baseSeconds: 45 },
  MAGE_TOWER:      { maxLevel: 15, costGrowth: 1.4,  timeGrowth: 1.30, baseCost: 300,  baseSeconds: 60 },
  BLACKSMITH:      { maxLevel: 15, costGrowth: 1.35, timeGrowth: 1.25, baseCost: 250,  baseSeconds: 50 },
  GOLD_MINE:       { maxLevel: 15, costGrowth: 1.3,  timeGrowth: 1.25, baseCost: 150,  baseSeconds: 30, baseProduction: 100 },
  FARM:            { maxLevel: 15, costGrowth: 1.3,  timeGrowth: 1.25, baseCost: 150,  baseSeconds: 30, baseProduction: 80 },
  GEM_MINE:        { maxLevel: 10, costGrowth: 1.5,  timeGrowth: 1.4,  baseCost: 400,  baseSeconds: 120, baseProduction: 5 },
  HERO_HALL:       { maxLevel: 10, costGrowth: 1.45, timeGrowth: 1.35, baseCost: 600,  baseSeconds: 90 },
  TRAINING_GROUND: { maxLevel: 15, costGrowth: 1.3,  timeGrowth: 1.25, baseCost: 200,  baseSeconds: 40 },
  WALL:            { maxLevel: 15, costGrowth: 1.25, timeGrowth: 1.2,  baseCost: 150,  baseSeconds: 30 },
  WATCH_TOWER:     { maxLevel: 10, costGrowth: 1.3,  timeGrowth: 1.25, baseCost: 180,  baseSeconds: 35 },
};

export function getBuildingLevelConfig(type: BuildingType, currentLevel: number): BuildingLevelConfig {
  const base = BUILDING_BASE_CONFIG[type];
  const nextLevel = currentLevel + 1;
  const goldCost = Math.round(base.baseCost * Math.pow(base.costGrowth, currentLevel));
  const upgradeSeconds = Math.round(base.baseSeconds * Math.pow(base.timeGrowth, currentLevel));
  const productionPerHour = base.baseProduction
    ? Math.round(base.baseProduction * Math.pow(1.2, currentLevel))
    : undefined;
  return { goldCost, upgradeSeconds, productionPerHour };
}

export const ENERGY_REGEN_MINUTES_PER_POINT = 6; // 1 energy every 6 minutes

export interface BattleStageConfig {
  id: string;
  type: "NORMAL" | "ELITE" | "BOSS" | "KINGDOM" | "DAILY_CHALLENGE";
  name: string;
  energyCost: number;
  enemyPower: number; // used against player's computed kingdom power to derive win odds
  rewardGold: [number, number];
  rewardGems: [number, number];
  rewardXp: number;
}

// A small starter stage table. The full 50+ stage progression is admin-configurable
// and lives in GameSetting once phase 9 (admin panel) is built.
export const BATTLE_STAGES: BattleStageConfig[] = [
  { id: "stage_1_1", type: "NORMAL", name: "Bandit Camp", energyCost: 5, enemyPower: 100, rewardGold: [40, 60], rewardGems: [0, 1], rewardXp: 20 },
  { id: "stage_1_2", type: "NORMAL", name: "Wolf Den", energyCost: 6, enemyPower: 140, rewardGold: [55, 80], rewardGems: [0, 1], rewardXp: 25 },
  { id: "stage_1_3", type: "ELITE", name: "Rogue Outpost", energyCost: 10, enemyPower: 220, rewardGold: [90, 130], rewardGems: [1, 3], rewardXp: 45 },
  { id: "boss_1", type: "BOSS", name: "Groth the Warlord", energyCost: 20, enemyPower: 400, rewardGold: [200, 300], rewardGems: [5, 10], rewardXp: 120 },
];

export function getStageConfig(stageId: string): BattleStageConfig | undefined {
  return BATTLE_STAGES.find((s) => s.id === stageId);
}
