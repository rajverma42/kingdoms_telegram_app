import { prisma } from "../db/prisma.js";
import { ENERGY_REGEN_MINUTES_PER_POINT, getBuildingLevelConfig } from "../config/gameConfig.js";
import { badRequest, notEnoughResource, notFound } from "../utils/errors.js";
import type { BuildingType } from "@prisma/client";

/**
 * Recomputes energy based on elapsed time since energyUpdatedAt and persists
 * the result. Called at the top of every kingdom-touching request so the
 * client always sees a correct, server-computed energy value — the client
 * never ticks its own energy counter as a source of truth.
 */
export async function syncEnergy(kingdomId: string) {
  const kingdom = await prisma.kingdom.findUnique({ where: { id: kingdomId } });
  if (!kingdom) throw notFound("Kingdom");

  const minutesElapsed = (Date.now() - kingdom.energyUpdatedAt.getTime()) / 60000;
  const regenerated = Math.floor(minutesElapsed / ENERGY_REGEN_MINUTES_PER_POINT);

  if (regenerated <= 0 || kingdom.energy >= kingdom.energyMax) {
    return kingdom;
  }

  const newEnergy = Math.min(kingdom.energyMax, kingdom.energy + regenerated);
  // Advance the timestamp only by the whole-point-equivalent time consumed,
  // so leftover fractional minutes keep accumulating toward the next point.
  const consumedMs = regenerated * ENERGY_REGEN_MINUTES_PER_POINT * 60000;

  return prisma.kingdom.update({
    where: { id: kingdomId },
    data: {
      energy: newEnergy,
      energyUpdatedAt: new Date(kingdom.energyUpdatedAt.getTime() + consumedMs),
    },
  });
}

export async function getFullKingdom(userId: string) {
  const kingdom = await prisma.kingdom.findUnique({
    where: { userId },
    include: { buildings: true },
  });
  if (!kingdom) throw notFound("Kingdom");
  return syncEnergy(kingdom.id).then(() =>
    prisma.kingdom.findUnique({ where: { userId }, include: { buildings: true } })
  );
}

/**
 * Starts (or instantly resolves, for level 0 baseline) a building upgrade.
 * Cost is deducted atomically in the same transaction as the upgrade write,
 * so a request can never be double-charged by racing itself.
 */
export async function upgradeBuilding(userId: string, type: BuildingType) {
  return prisma.$transaction(async (tx) => {
    const kingdom = await tx.kingdom.findUnique({
      where: { userId },
      include: { buildings: true },
    });
    if (!kingdom) throw notFound("Kingdom");

    let building = kingdom.buildings.find((b) => b.type === type);
    const currentLevel = building?.level ?? 0;

    if (building?.upgradeFinishesAt && building.upgradeFinishesAt > new Date()) {
      throw badRequest("This building is already upgrading.", "UPGRADE_IN_PROGRESS");
    }

    const { goldCost, upgradeSeconds } = getBuildingLevelConfig(type, currentLevel);

    if (kingdom.gold < BigInt(goldCost)) {
      throw notEnoughResource("gold");
    }

    const finishesAt = new Date(Date.now() + upgradeSeconds * 1000);

    await tx.kingdom.update({
      where: { id: kingdom.id },
      data: { gold: { decrement: BigInt(goldCost) } },
    });

    if (building) {
      building = await tx.building.update({
        where: { id: building.id },
        data: { upgradeStartedAt: new Date(), upgradeFinishesAt: finishesAt },
      });
    } else {
      building = await tx.building.create({
        data: {
          kingdomId: kingdom.id,
          type,
          level: 0,
          upgradeStartedAt: new Date(),
          upgradeFinishesAt: finishesAt,
        },
      });
    }

    return building;
  });
}

/**
 * Applies any building upgrades whose timer has elapsed. Called defensively
 * whenever the kingdom is read, so progress is correct even if the client
 * never polls again after starting an upgrade.
 */
export async function resolveFinishedUpgrades(userId: string) {
  const now = new Date();
  const kingdom = await prisma.kingdom.findUnique({
    where: { userId },
    include: { buildings: true },
  });
  if (!kingdom) throw notFound("Kingdom");

  const finished = kingdom.buildings.filter(
    (b) => b.upgradeFinishesAt && b.upgradeFinishesAt <= now
  );

  for (const b of finished) {
    await prisma.building.update({
      where: { id: b.id },
      data: {
        level: b.level + 1,
        upgradeStartedAt: null,
        upgradeFinishesAt: null,
      },
    });
  }

  return finished.length;
}

/** Recomputes a simple Kingdom Power score from building levels (heroes/troops added in later phases). */
export async function recomputeKingdomPower(kingdomId: string) {
  const kingdom = await prisma.kingdom.findUnique({
    where: { id: kingdomId },
    include: { buildings: true },
  });
  if (!kingdom) throw notFound("Kingdom");

  const power = kingdom.buildings.reduce((sum, b) => sum + b.level * 25, 0);

  return prisma.kingdom.update({ where: { id: kingdomId }, data: { power } });
}
