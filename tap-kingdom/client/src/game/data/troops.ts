export type TroopType = "SWORDSMAN" | "ARCHER" | "SPEARMAN" | "KNIGHT" | "MAGE" | "HEALER";

export interface TroopConfig {
  type: TroopType;
  name: string;
  baseAttack: number;
  baseDefense: number;
  baseHealth: number;
  trainedAt: "BARRACKS" | "ARCHER_TOWER" | "MAGE_TOWER";
  baseUpgradeCost: number;
}

export const TROOPS: TroopConfig[] = [
  { type: "SWORDSMAN", name: "Swordsman", baseAttack: 12, baseDefense: 14, baseHealth: 120, trainedAt: "BARRACKS", baseUpgradeCost: 30 },
  { type: "SPEARMAN", name: "Spearman", baseAttack: 14, baseDefense: 10, baseHealth: 100, trainedAt: "BARRACKS", baseUpgradeCost: 30 },
  { type: "KNIGHT", name: "Knight", baseAttack: 16, baseDefense: 20, baseHealth: 160, trainedAt: "BARRACKS", baseUpgradeCost: 45 },
  { type: "ARCHER", name: "Archer", baseAttack: 16, baseDefense: 6, baseHealth: 80, trainedAt: "ARCHER_TOWER", baseUpgradeCost: 35 },
  { type: "MAGE", name: "Mage", baseAttack: 22, baseDefense: 5, baseHealth: 70, trainedAt: "MAGE_TOWER", baseUpgradeCost: 50 },
  { type: "HEALER", name: "Healer", baseAttack: 4, baseDefense: 8, baseHealth: 90, trainedAt: "MAGE_TOWER", baseUpgradeCost: 40 },
];

export function getTroopConfig(type: TroopType): TroopConfig {
  const cfg = TROOPS.find((t) => t.type === type);
  if (!cfg) throw new Error(`Unknown troop type: ${type}`);
  return cfg;
}

export function getTroopUpgradeCost(type: TroopType, currentLevel: number): number {
  const cfg = getTroopConfig(type);
  return Math.round(cfg.baseUpgradeCost * Math.pow(1.25, currentLevel - 1));
}

export function computeTroopPower(type: TroopType, level: number, quantity: number): number {
  const cfg = getTroopConfig(type);
  const raw = cfg.baseAttack + cfg.baseDefense + cfg.baseHealth / 10;
  return Math.round(raw * (1 + (level - 1) * 0.15) * quantity);
}
