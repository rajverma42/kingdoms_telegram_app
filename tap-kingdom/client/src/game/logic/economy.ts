export const ENERGY_REGEN_MINUTES_PER_POINT = 3;
export const BASE_ENERGY_MAX = 50;

export const TAP_COIN_REWARD = 1;
export const TAP_COOLDOWN_MS = 120; // minimum time between accepted taps — prevents autoclicker-speed abuse client-side
export const TAP_BURST_LIMIT = 30; // max taps allowed in TAP_BURST_WINDOW_MS
export const TAP_BURST_WINDOW_MS = 10_000;

export function xpForNextLevel(level: number): number {
  return Math.round(50 * Math.pow(1.18, level - 1));
}

/** How much energy has regenerated since `lastUpdatedAt`, capped at `max`. Returns the point count and the timestamp to advance to (so leftover fractional minutes keep accumulating). */
export function computeEnergyRegen(
  current: number,
  max: number,
  lastUpdatedAt: number,
  now: number
): { energy: number; newTimestamp: number } {
  if (current >= max) {
    return { energy: current, newTimestamp: now };
  }
  const minutesElapsed = (now - lastUpdatedAt) / 60000;
  const regenerated = Math.floor(minutesElapsed / ENERGY_REGEN_MINUTES_PER_POINT);
  if (regenerated <= 0) {
    return { energy: current, newTimestamp: lastUpdatedAt };
  }
  const energy = Math.min(max, current + regenerated);
  const consumedMs = regenerated * ENERGY_REGEN_MINUTES_PER_POINT * 60000;
  return { energy, newTimestamp: lastUpdatedAt + consumedMs };
}

export function getFreeChestReward(): { coins: number; gems: number; fragments: number } {
  return {
    coins: 20 + Math.round(Math.random() * 40),
    gems: Math.random() < 0.3 ? 1 : 0,
    fragments: Math.random() < 0.5 ? 1 : 0,
  };
}
