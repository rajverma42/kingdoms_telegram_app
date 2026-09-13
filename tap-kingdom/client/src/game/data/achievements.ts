export type AchievementMetric =
  | "tapsTotal"
  | "battlesWon"
  | "bossesWon"
  | "castleLevel"
  | "heroesUnlocked"
  | "legendaryHeroesUnlocked"
  | "mythicHeroesUnlocked"
  | "chestsOpened"
  | "playerLevel"
  | "missionsCompleted"
  | "dailyRewardStreak";

export interface AchievementConfig {
  id: string;
  metric: AchievementMetric;
  target: number;
  name: string;
  rewardCoins: number;
  rewardGems: number;
  rewardXp: number;
}

// 30 one-time achievements, evaluated against lifetime counters. Rewards
// are always free currency or XP — never Telegram Stars.
export const ACHIEVEMENTS: AchievementConfig[] = [
  { id: "first_tap", metric: "tapsTotal", target: 1, name: "First Tap", rewardCoins: 10, rewardGems: 0, rewardXp: 5 },
  { id: "taps_100", metric: "tapsTotal", target: 100, name: "100 Taps", rewardCoins: 30, rewardGems: 0, rewardXp: 10 },
  { id: "taps_1000", metric: "tapsTotal", target: 1000, name: "1,000 Taps", rewardCoins: 100, rewardGems: 2, rewardXp: 25 },
  { id: "taps_10000", metric: "tapsTotal", target: 10000, name: "10,000 Taps", rewardCoins: 400, rewardGems: 5, rewardXp: 60 },

  { id: "first_battle", metric: "battlesWon", target: 1, name: "First Battle", rewardCoins: 30, rewardGems: 0, rewardXp: 10 },
  { id: "victories_10", metric: "battlesWon", target: 10, name: "10 Victories", rewardCoins: 100, rewardGems: 2, rewardXp: 25 },
  { id: "victories_50", metric: "battlesWon", target: 50, name: "50 Victories", rewardCoins: 300, rewardGems: 5, rewardXp: 60 },
  { id: "victories_100", metric: "battlesWon", target: 100, name: "100 Victories", rewardCoins: 600, rewardGems: 10, rewardXp: 120 },

  { id: "first_boss", metric: "bossesWon", target: 1, name: "First Boss", rewardCoins: 150, rewardGems: 3, rewardXp: 30 },
  { id: "bosses_5", metric: "bossesWon", target: 5, name: "5 Bosses Defeated", rewardCoins: 400, rewardGems: 8, rewardXp: 80 },

  { id: "castle_5", metric: "castleLevel", target: 5, name: "Castle Level 5", rewardCoins: 150, rewardGems: 2, rewardXp: 30 },
  { id: "castle_10", metric: "castleLevel", target: 10, name: "Castle Level 10", rewardCoins: 350, rewardGems: 5, rewardXp: 70 },
  { id: "castle_15", metric: "castleLevel", target: 15, name: "Castle Level 15", rewardCoins: 700, rewardGems: 8, rewardXp: 120 },
  { id: "castle_20", metric: "castleLevel", target: 20, name: "Castle Level 20", rewardCoins: 1200, rewardGems: 15, rewardXp: 200 },

  { id: "heroes_5", metric: "heroesUnlocked", target: 5, name: "Unlock 5 Heroes", rewardCoins: 200, rewardGems: 3, rewardXp: 40 },
  { id: "heroes_10", metric: "heroesUnlocked", target: 10, name: "Unlock 10 Heroes", rewardCoins: 400, rewardGems: 6, rewardXp: 80 },
  { id: "heroes_15", metric: "heroesUnlocked", target: 15, name: "Unlock 15 Heroes", rewardCoins: 700, rewardGems: 10, rewardXp: 120 },
  { id: "heroes_all", metric: "heroesUnlocked", target: 20, name: "Unlock All Heroes", rewardCoins: 1500, rewardGems: 20, rewardXp: 250 },

  { id: "legendary_hero", metric: "legendaryHeroesUnlocked", target: 1, name: "Unlock Legendary Hero", rewardCoins: 300, rewardGems: 8, rewardXp: 60 },
  { id: "mythic_hero", metric: "mythicHeroesUnlocked", target: 1, name: "Unlock Mythic Hero", rewardCoins: 600, rewardGems: 15, rewardXp: 100 },

  { id: "chest_first", metric: "chestsOpened", target: 1, name: "Open First Chest", rewardCoins: 30, rewardGems: 0, rewardXp: 10 },
  { id: "chest_10", metric: "chestsOpened", target: 10, name: "Open 10 Chests", rewardCoins: 150, rewardGems: 2, rewardXp: 30 },
  { id: "chest_50", metric: "chestsOpened", target: 50, name: "Open 50 Chests", rewardCoins: 500, rewardGems: 8, rewardXp: 90 },

  { id: "level_5", metric: "playerLevel", target: 5, name: "Reach Player Level 5", rewardCoins: 100, rewardGems: 2, rewardXp: 0 },
  { id: "level_10", metric: "playerLevel", target: 10, name: "Reach Player Level 10", rewardCoins: 250, rewardGems: 4, rewardXp: 0 },
  { id: "level_20", metric: "playerLevel", target: 20, name: "Reach Player Level 20", rewardCoins: 600, rewardGems: 10, rewardXp: 0 },

  { id: "missions_10", metric: "missionsCompleted", target: 10, name: "Complete 10 Missions", rewardCoins: 150, rewardGems: 2, rewardXp: 30 },
  { id: "missions_50", metric: "missionsCompleted", target: 50, name: "Complete 50 Missions", rewardCoins: 500, rewardGems: 8, rewardXp: 90 },

  { id: "streak_3", metric: "dailyRewardStreak", target: 3, name: "3-Day Login Streak", rewardCoins: 80, rewardGems: 1, rewardXp: 15 },
  { id: "streak_7", metric: "dailyRewardStreak", target: 7, name: "7-Day Login Streak", rewardCoins: 250, rewardGems: 5, rewardXp: 40 },
];
