import { prisma } from "../db/prisma.js";
import { badRequest, notEnoughResource, notFound } from "../utils/errors.js";
import {
  HERO_RARITY_CONFIG,
  HERO_TEAM_SIZE,
  getHeroLevelCap,
  getHeroLevelUpCost,
  getHeroRankUpCost,
} from "../config/gameConfig.js";

/** Full roster with each hero paired to the caller's inventory entry, or null if not yet recruited. */
export async function getRoster(userId: string) {
  const [heroes, owned] = await Promise.all([
    prisma.hero.findMany({ orderBy: { name: "asc" } }),
    prisma.heroInventory.findMany({ where: { userId } }),
  ]);
  const ownedByHeroId = new Map(owned.map((inv) => [inv.heroId, inv]));

  return heroes.map((hero) => ({ hero, inventory: ownedByHeroId.get(hero.id) ?? null }));
}

export async function recruitHero(userId: string, heroKey: string) {
  return prisma.$transaction(async (tx) => {
    const hero = await tx.hero.findUnique({ where: { key: heroKey } });
    if (!hero) throw notFound("Hero");

    const existing = await tx.heroInventory.findUnique({
      where: { userId_heroId: { userId, heroId: hero.id } },
    });
    if (existing) throw badRequest("You already recruited this hero.", "HERO_ALREADY_OWNED");

    const { recruitGoldCost } = HERO_RARITY_CONFIG[hero.rarity];
    const kingdom = await tx.kingdom.findUniqueOrThrow({ where: { userId } });
    if (kingdom.gold < BigInt(recruitGoldCost)) throw notEnoughResource("gold");

    await tx.kingdom.update({
      where: { id: kingdom.id },
      data: { gold: { decrement: BigInt(recruitGoldCost) } },
    });

    return tx.heroInventory.create({ data: { userId, heroId: hero.id } });
  });
}

export async function levelUpHero(userId: string, heroKey: string) {
  return prisma.$transaction(async (tx) => {
    const hero = await tx.hero.findUnique({ where: { key: heroKey } });
    if (!hero) throw notFound("Hero");

    const inv = await tx.heroInventory.findUnique({
      where: { userId_heroId: { userId, heroId: hero.id } },
    });
    if (!inv) throw badRequest("You have not recruited this hero yet.", "HERO_NOT_OWNED");

    const levelCap = getHeroLevelCap(inv.rank);
    if (inv.level >= levelCap) {
      throw badRequest("This hero must be rank-promoted before leveling further.", "HERO_AT_LEVEL_CAP");
    }

    const cost = getHeroLevelUpCost(hero.rarity, inv.level);
    const kingdom = await tx.kingdom.findUniqueOrThrow({ where: { userId } });
    if (kingdom.gold < BigInt(cost)) throw notEnoughResource("gold");

    await tx.kingdom.update({
      where: { id: kingdom.id },
      data: { gold: { decrement: BigInt(cost) } },
    });

    return tx.heroInventory.update({ where: { id: inv.id }, data: { level: inv.level + 1 } });
  });
}

export async function rankUpHero(userId: string, heroKey: string) {
  return prisma.$transaction(async (tx) => {
    const hero = await tx.hero.findUnique({ where: { key: heroKey } });
    if (!hero) throw notFound("Hero");

    const inv = await tx.heroInventory.findUnique({
      where: { userId_heroId: { userId, heroId: hero.id } },
    });
    if (!inv) throw badRequest("You have not recruited this hero yet.", "HERO_NOT_OWNED");

    const { maxRank } = HERO_RARITY_CONFIG[hero.rarity];
    if (inv.rank >= maxRank) throw badRequest("This hero has reached its maximum rank.", "HERO_AT_MAX_RANK");

    const levelCap = getHeroLevelCap(inv.rank);
    if (inv.level < levelCap) {
      throw badRequest(`Level this hero to ${levelCap} before ranking up.`, "HERO_LEVEL_TOO_LOW");
    }

    const { gold, gems } = getHeroRankUpCost(hero.rarity, inv.rank);
    const kingdom = await tx.kingdom.findUniqueOrThrow({ where: { userId } });
    if (kingdom.gold < BigInt(gold)) throw notEnoughResource("gold");
    if (kingdom.gems < BigInt(gems)) throw notEnoughResource("gems");

    await tx.kingdom.update({
      where: { id: kingdom.id },
      data: { gold: { decrement: BigInt(gold) }, gems: { decrement: BigInt(gems) } },
    });

    return tx.heroInventory.update({ where: { id: inv.id }, data: { rank: inv.rank + 1 } });
  });
}

export async function equipHero(userId: string, heroKey: string, slot: number) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= HERO_TEAM_SIZE) {
    throw badRequest("Invalid team slot.", "INVALID_SLOT");
  }

  return prisma.$transaction(async (tx) => {
    const hero = await tx.hero.findUnique({ where: { key: heroKey } });
    if (!hero) throw notFound("Hero");

    const inv = await tx.heroInventory.findUnique({
      where: { userId_heroId: { userId, heroId: hero.id } },
    });
    if (!inv) throw badRequest("You have not recruited this hero yet.", "HERO_NOT_OWNED");

    // A slot holds exactly one hero — bump whoever is currently there to the
    // bench before assigning it, so the @@unique([userId, equipSlot])
    // constraint never trips on a simple slot swap.
    await tx.heroInventory.updateMany({
      where: { userId, equipSlot: slot, NOT: { id: inv.id } },
      data: { equipSlot: null },
    });

    return tx.heroInventory.update({ where: { id: inv.id }, data: { equipSlot: slot } });
  });
}

export async function unequipHero(userId: string, heroKey: string) {
  const hero = await prisma.hero.findUnique({ where: { key: heroKey } });
  if (!hero) throw notFound("Hero");

  const inv = await prisma.heroInventory.findUnique({
    where: { userId_heroId: { userId, heroId: hero.id } },
  });
  if (!inv) throw badRequest("You have not recruited this hero yet.", "HERO_NOT_OWNED");

  return prisma.heroInventory.update({ where: { id: inv.id }, data: { equipSlot: null } });
}
