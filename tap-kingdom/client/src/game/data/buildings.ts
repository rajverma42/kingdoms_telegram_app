export type BuildingType =
  | "CASTLE"
  | "BARRACKS"
  | "ARCHER_TOWER"
  | "MAGE_TOWER"
  | "GOLD_MINE"
  | "FARM"
  | "BLACKSMITH"
  | "HERO_HALL";

export interface BuildingConfig {
  type: BuildingType;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
  baseSeconds: number;
  timeGrowth: number;
  unlockLevel: number; // player level required before this building can be built at all
}

export const BUILDINGS: BuildingConfig[] = [
  { type: "CASTLE", name: "Castle", description: "The heart of your kingdom. Raises your player level cap.", maxLevel: 20, baseCost: 100, costGrowth: 1.45, baseSeconds: 20, timeGrowth: 1.3, unlockLevel: 1 },
  { type: "GOLD_MINE", name: "Gold Mine", description: "Produces coins over time.", maxLevel: 15, baseCost: 60, costGrowth: 1.3, baseSeconds: 15, timeGrowth: 1.25, unlockLevel: 1 },
  { type: "FARM", name: "Farm", description: "Feeds your troops — unlocks more troop capacity.", maxLevel: 15, baseCost: 60, costGrowth: 1.3, baseSeconds: 15, timeGrowth: 1.25, unlockLevel: 1 },
  { type: "BARRACKS", name: "Barracks", description: "Trains melee troops.", maxLevel: 15, baseCost: 120, costGrowth: 1.35, baseSeconds: 25, timeGrowth: 1.3, unlockLevel: 2 },
  { type: "ARCHER_TOWER", name: "Archer Tower", description: "Trains ranged troops.", maxLevel: 15, baseCost: 140, costGrowth: 1.35, baseSeconds: 25, timeGrowth: 1.3, unlockLevel: 3 },
  { type: "BLACKSMITH", name: "Blacksmith", description: "Upgrades troop equipment.", maxLevel: 12, baseCost: 180, costGrowth: 1.4, baseSeconds: 30, timeGrowth: 1.3, unlockLevel: 4 },
  { type: "MAGE_TOWER", name: "Mage Tower", description: "Trains magic units and unlocks hero abilities.", maxLevel: 12, baseCost: 220, costGrowth: 1.4, baseSeconds: 35, timeGrowth: 1.3, unlockLevel: 5 },
  { type: "HERO_HALL", name: "Hero Hall", description: "Increases your active hero team size.", maxLevel: 10, baseCost: 300, costGrowth: 1.45, baseSeconds: 40, timeGrowth: 1.35, unlockLevel: 6 },
];

export function getBuildingConfig(type: BuildingType): BuildingConfig {
  const config = BUILDINGS.find((b) => b.type === type);
  if (!config) throw new Error(`Unknown building type: ${type}`);
  return config;
}

export function getUpgradeCost(type: BuildingType, currentLevel: number): number {
  const cfg = getBuildingConfig(type);
  return Math.round(cfg.baseCost * Math.pow(cfg.costGrowth, currentLevel));
}

export function getUpgradeSeconds(type: BuildingType, currentLevel: number): number {
  const cfg = getBuildingConfig(type);
  return Math.round(cfg.baseSeconds * Math.pow(cfg.timeGrowth, currentLevel));
}
