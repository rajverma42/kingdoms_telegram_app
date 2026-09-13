export type RewardCurrency = "coins" | "gems" | "energy" | "fragments" | "chest";

export interface DailyRewardDay {
  day: number;
  currency: RewardCurrency;
  amount: number;
  label: string;
}

// A 7-day cycle that repeats. Never grants Telegram Stars.
export const DAILY_REWARDS: DailyRewardDay[] = [
  { day: 1, currency: "coins", amount: 100, label: "100 Coins" },
  { day: 2, currency: "energy", amount: 15, label: "15 Energy" },
  { day: 3, currency: "gems", amount: 5, label: "5 Gems" },
  { day: 4, currency: "fragments", amount: 3, label: "3 Hero Fragments" },
  { day: 5, currency: "coins", amount: 250, label: "250 Coins" },
  { day: 6, currency: "chest", amount: 1, label: "1 Free Chest" },
  { day: 7, currency: "gems", amount: 25, label: "25 Gems (Epic Reward)" },
];
