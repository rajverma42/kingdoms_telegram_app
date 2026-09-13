import crypto from "node:crypto";
import { prisma } from "../db/prisma.js";
import { getStageConfig } from "../config/gameConfig.js";
import { badRequest, notEnoughResource, notFound } from "../utils/errors.js";
import { recomputeKingdomPower, syncEnergy } from "./kingdomService.js";

/**
 * IMPORTANT: the client never reports whether a battle was won. The client
 * only tells us *which* battle (by id) to resolve; the outcome, rewards, and
 * XP are all computed here from server-held state (kingdom power vs. stage
 * enemy power) plus a server-generated random seed. This is what "never
 * trust client-side battle results" means in practice.
 */

export async function startBattle(userId: string, stageId: string) {
  const stage = getStageConfig(stageId);
  if (!stage) throw notFound("Battle stage");

  const kingdom = await prisma.kingdom.findUnique({ where: { userId } });
  if (!kingdom) throw notFound("Kingdom");

  await syncEnergy(kingdom.id);
  const fresh = await prisma.kingdom.findUniqueOrThrow({ where: { userId } });

  if (fresh.energy < stage.energyCost) {
    throw notEnoughResource("energy");
  }

  return prisma.$transaction(async (tx) => {
    // Re-check + deduct energy atomically to prevent double-spend from
    // concurrent requests (e.g. a double-tap on PLAY).
    const k = await tx.kingdom.findUniqueOrThrow({ where: { userId } });
    if (k.energy < stage.energyCost) throw notEnoughResource("energy");

    await tx.kingdom.update({
      where: { id: k.id },
      data: { energy: { decrement: stage.energyCost } },
    });

    const battle = await tx.battle.create({
      data: {
        userId,
        type: stage.type,
        stageId: stage.id,
        status: "PENDING",
        seed: crypto.randomBytes(16).toString("hex"),
        energyCost: stage.energyCost,
      },
    });

    return battle;
  });
}

export async function resolveBattle(userId: string, battleId: string) {
  const battle = await prisma.battle.findUnique({ where: { id: battleId } });
  if (!battle || battle.userId !== userId) throw notFound("Battle");
  if (battle.status !== "PENDING") {
    throw badRequest("This battle has already been resolved.", "BATTLE_ALREADY_RESOLVED");
  }

  const stage = getStageConfig(battle.stageId);
  if (!stage) throw notFound("Battle stage");

  await recomputeKingdomPower((await prisma.kingdom.findUniqueOrThrow({ where: { userId } })).id);
  const kingdom = await prisma.kingdom.findUniqueOrThrow({ where: { userId } });

  // Deterministic outcome from the stored seed — reproducible, auditable,
  // and impossible for the client to influence after the fact.
  const roll = seededRandom(battle.seed);
  const winChance = clamp(0.5 + (kingdom.power - stage.enemyPower) / (stage.enemyPower * 2), 0.1, 0.95);
  const won = roll < winChance;

  const rewardGold = won ? randomInRange(stage.rewardGold, battle.seed + "g") : 0;
  const rewardGems = won ? randomInRange(stage.rewardGems, battle.seed + "e") : 0;
  const rewardXp = won ? stage.rewardXp : Math.round(stage.rewardXp * 0.2);

  const [, updatedUser] = await prisma.$transaction([
    prisma.battle.update({
      where: { id: battle.id },
      data: {
        status: "RESOLVED",
        outcome: won ? "WIN" : "LOSE",
        rewardGold: BigInt(rewardGold),
        rewardGems: BigInt(rewardGems),
        rewardXp,
        resolvedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: rewardXp } },
    }),
    prisma.kingdom.update({
      where: { userId },
      data: {
        gold: { increment: BigInt(rewardGold) },
        gems: { increment: BigInt(rewardGems) },
      },
    }),
  ]);

  return {
    outcome: won ? "WIN" : ("LOSE" as const),
    rewardGold,
    rewardGems,
    rewardXp,
    userXp: updatedUser.xp,
  };
}

function seededRandom(seed: string): number {
  const hash = crypto.createHash("sha256").update(seed).digest();
  // Use the first 4 bytes as a uint32 → [0,1)
  return hash.readUInt32BE(0) / 0xffffffff;
}

function randomInRange([min, max]: [number, number], seed: string): number {
  const r = seededRandom(seed);
  return Math.round(min + r * (max - min));
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
