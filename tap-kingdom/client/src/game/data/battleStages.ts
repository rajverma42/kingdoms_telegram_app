export type BattleType = "NORMAL" | "ELITE" | "BOSS";

export interface BattleStageConfig {
  id: string;
  type: BattleType;
  name: string;
  enemyName: string;
  energyCost: number;
  enemyPower: number;
  enemyHealth: number;
  rewardCoins: [number, number];
  rewardGems: [number, number];
  rewardXp: number;
  rewardFragments: number;
}

export const BATTLE_STAGES: BattleStageConfig[] = [
  { id: "normal_1", type: "NORMAL", name: "Bandit Camp", enemyName: "Bandit Raider", energyCost: 5, enemyPower: 80, enemyHealth: 300, rewardCoins: [30, 50], rewardGems: [0, 1], rewardXp: 15, rewardFragments: 1 },
  { id: "normal_2", type: "NORMAL", name: "Wolf Den", enemyName: "Dire Wolf", energyCost: 6, enemyPower: 110, enemyHealth: 380, rewardCoins: [40, 65], rewardGems: [0, 1], rewardXp: 20, rewardFragments: 1 },
  { id: "normal_3", type: "NORMAL", name: "Ruined Outpost", enemyName: "Rogue Scout", energyCost: 7, enemyPower: 140, enemyHealth: 460, rewardCoins: [55, 80], rewardGems: [1, 2], rewardXp: 25, rewardFragments: 2 },

  { id: "elite_1", type: "ELITE", name: "Goblin Warcamp", enemyName: "Goblin Chieftain", energyCost: 10, enemyPower: 220, enemyHealth: 700, rewardCoins: [90, 130], rewardGems: [2, 4], rewardXp: 45, rewardFragments: 3 },
  { id: "elite_2", type: "ELITE", name: "Sunken Crypt", enemyName: "Crypt Wraith", energyCost: 12, enemyPower: 280, enemyHealth: 850, rewardCoins: [110, 160], rewardGems: [3, 5], rewardXp: 55, rewardFragments: 4 },
  { id: "elite_3", type: "ELITE", name: "Frostbound Pass", enemyName: "Ice Marauder", energyCost: 14, enemyPower: 340, enemyHealth: 1000, rewardCoins: [130, 190], rewardGems: [4, 6], rewardXp: 65, rewardFragments: 5 },

  { id: "boss_1", type: "BOSS", name: "The Warlord's Gate", enemyName: "Groth the Warlord", energyCost: 20, enemyPower: 500, enemyHealth: 2200, rewardCoins: [220, 320], rewardGems: [6, 10], rewardXp: 120, rewardFragments: 8 },
  { id: "boss_2", type: "BOSS", name: "The Obsidian Throne", enemyName: "Malacar the Ashen King", energyCost: 25, enemyPower: 650, enemyHealth: 2800, rewardCoins: [280, 400], rewardGems: [8, 14], rewardXp: 150, rewardFragments: 10 },
  { id: "boss_3", type: "BOSS", name: "The Shattered Peak", enemyName: "Vorthak the World-Eater", energyCost: 30, enemyPower: 820, enemyHealth: 3500, rewardCoins: [350, 500], rewardGems: [10, 18], rewardXp: 200, rewardFragments: 15 },
];

export function getStage(id: string): BattleStageConfig {
  const stage = BATTLE_STAGES.find((s) => s.id === id);
  if (!stage) throw new Error(`Unknown battle stage: ${id}`);
  return stage;
}
