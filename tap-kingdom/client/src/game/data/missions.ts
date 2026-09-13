export type MissionMetric =
  | "tapsTotal"
  | "battlesWon"
  | "buildingUpgrades"
  | "heroUpgrades"
  | "coinsCollected"
  | "chestsOpened";

export interface MissionConfig {
  id: string;
  metric: MissionMetric;
  target: number;
  label: string;
  rewardCoins: number;
  rewardGems: number;
  rewardXp: number;
  rewardFragments: number;
}

// Refreshed daily on the client (reset when the stored day rolls over).
// Progress is measured against lifetime counters minus the value they were
// at when the day started, so re-rolling never grants a mission "for free".
export const MISSIONS: MissionConfig[] = [
  { id: "tap_100", metric: "tapsTotal", target: 100, label: "Tap 100 times", rewardCoins: 40, rewardGems: 0, rewardXp: 10, rewardFragments: 0 },
  { id: "win_2_battles", metric: "battlesWon", target: 2, label: "Win 2 battles", rewardCoins: 60, rewardGems: 1, rewardXp: 15, rewardFragments: 1 },
  { id: "upgrade_building_1", metric: "buildingUpgrades", target: 1, label: "Upgrade any building", rewardCoins: 50, rewardGems: 0, rewardXp: 10, rewardFragments: 0 },
  { id: "upgrade_hero_1", metric: "heroUpgrades", target: 1, label: "Upgrade a hero", rewardCoins: 50, rewardGems: 1, rewardXp: 10, rewardFragments: 0 },
  { id: "collect_coins_300", metric: "coinsCollected", target: 300, label: "Collect 300 coins", rewardCoins: 0, rewardGems: 1, rewardXp: 10, rewardFragments: 0 },
  { id: "open_chest_1", metric: "chestsOpened", target: 1, label: "Open 1 chest", rewardCoins: 30, rewardGems: 0, rewardXp: 10, rewardFragments: 1 },
];
