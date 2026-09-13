import type { BattleStageConfig } from "../data/battleStages";

export interface BattleResult {
  won: boolean;
  rounds: number;
  playerHealthRemaining: number;
  enemyHealthRemaining: number;
  rewardCoins: number;
  rewardGems: number;
  rewardXp: number;
  rewardFragments: number;
}

/**
 * Battles are resolved entirely on the client. This is a deliberate,
 * documented choice: no Telegram Stars ever ride on a battle outcome (Stars
 * only buy cosmetics/heroes directly, never combat advantage from wagering),
 * so there is nothing here that requires a trusted server to arbitrate.
 * A simple round-based simulation keeps it readable and fast on low-end
 * phones instead of a hidden single-roll RNG.
 */
export function resolveBattle(playerPower: number, stage: BattleStageConfig): BattleResult {
  let playerHealth = 500 + playerPower * 2;
  let enemyHealth = stage.enemyHealth;
  const playerAttack = Math.max(10, Math.round(playerPower * 0.35));
  const enemyAttack = Math.max(10, Math.round(stage.enemyPower * 0.3));

  let rounds = 0;
  const maxRounds = 40;

  while (playerHealth > 0 && enemyHealth > 0 && rounds < maxRounds) {
    rounds += 1;
    enemyHealth -= playerAttack;
    if (enemyHealth <= 0) break;
    playerHealth -= enemyAttack;
  }

  const won = enemyHealth <= 0 && playerHealth > 0;

  return {
    won,
    rounds,
    playerHealthRemaining: Math.max(0, Math.round(playerHealth)),
    enemyHealthRemaining: Math.max(0, Math.round(enemyHealth)),
    rewardCoins: won ? randomInRange(stage.rewardCoins) : Math.round(randomInRange(stage.rewardCoins) * 0.2),
    rewardGems: won ? randomInRange(stage.rewardGems) : 0,
    rewardXp: won ? stage.rewardXp : Math.round(stage.rewardXp * 0.25),
    rewardFragments: won ? stage.rewardFragments : 0,
  };
}

function randomInRange([min, max]: [number, number]): number {
  return Math.round(min + Math.random() * (max - min));
}
