import { Router } from "express";
import { z } from "zod";
import { requireTelegramAuth } from "../middleware/auth.js";
import { getRoster, recruitHero, levelUpHero, rankUpHero, equipHero, unequipHero } from "../services/heroService.js";
import { recomputeKingdomPower } from "../services/kingdomService.js";
import { prisma } from "../db/prisma.js";
import { badRequest } from "../utils/errors.js";
import {
  HERO_RARITY_CONFIG,
  HERO_TEAM_SIZE,
  computeHeroPower,
  getHeroLevelCap,
  getHeroLevelUpCost,
  getHeroRankUpCost,
} from "../config/gameConfig.js";

export const heroRouter = Router();
heroRouter.use(requireTelegramAuth);

type RosterEntry = Awaited<ReturnType<typeof getRoster>>[number];

function serializeEntry({ hero, inventory }: RosterEntry) {
  const rarityConfig = HERO_RARITY_CONFIG[hero.rarity];

  if (!inventory) {
    return {
      key: hero.key,
      name: hero.name,
      rarity: hero.rarity,
      owned: false as const,
      recruitGoldCost: rarityConfig.recruitGoldCost,
    };
  }

  const levelCap = getHeroLevelCap(inventory.rank);
  const atLevelCap = inventory.level >= levelCap;

  return {
    key: hero.key,
    name: hero.name,
    rarity: hero.rarity,
    owned: true as const,
    level: inventory.level,
    rank: inventory.rank,
    maxRank: rarityConfig.maxRank,
    levelCap,
    equipSlot: inventory.equipSlot,
    power: computeHeroPower(hero, inventory.level, inventory.rank),
    nextLevelCost: atLevelCap ? null : getHeroLevelUpCost(hero.rarity, inventory.level),
    nextRankCost:
      atLevelCap && inventory.rank < rarityConfig.maxRank
        ? getHeroRankUpCost(hero.rarity, inventory.rank)
        : null,
  };
}

async function refreshPowerFor(userId: string) {
  const kingdom = await prisma.kingdom.findUniqueOrThrow({ where: { userId } });
  await recomputeKingdomPower(kingdom.id);
}

heroRouter.get("/", async (req, res, next) => {
  try {
    const roster = await getRoster(req.user!.id);
    res.json({ success: true, data: { teamSize: HERO_TEAM_SIZE, heroes: roster.map(serializeEntry) } });
  } catch (err) {
    next(err);
  }
});

const heroKeySchema = z.object({ heroKey: z.string().min(1) });

heroRouter.post("/recruit", async (req, res, next) => {
  try {
    const parsed = heroKeySchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("heroKey is required", "VALIDATION_ERROR");

    await recruitHero(req.user!.id, parsed.data.heroKey);
    res.json({ success: true, data: { recruited: true } });
  } catch (err) {
    next(err);
  }
});

heroRouter.post("/level-up", async (req, res, next) => {
  try {
    const parsed = heroKeySchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("heroKey is required", "VALIDATION_ERROR");

    const inv = await levelUpHero(req.user!.id, parsed.data.heroKey);
    if (inv.equipSlot !== null) await refreshPowerFor(req.user!.id);
    res.json({ success: true, data: { level: inv.level } });
  } catch (err) {
    next(err);
  }
});

heroRouter.post("/rank-up", async (req, res, next) => {
  try {
    const parsed = heroKeySchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("heroKey is required", "VALIDATION_ERROR");

    const inv = await rankUpHero(req.user!.id, parsed.data.heroKey);
    if (inv.equipSlot !== null) await refreshPowerFor(req.user!.id);
    res.json({ success: true, data: { rank: inv.rank } });
  } catch (err) {
    next(err);
  }
});

const equipSchema = z.object({
  heroKey: z.string().min(1),
  slot: z.number().int().min(0).max(HERO_TEAM_SIZE - 1),
});

heroRouter.post("/equip", async (req, res, next) => {
  try {
    const parsed = equipSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("heroKey and a valid slot are required", "VALIDATION_ERROR");

    await equipHero(req.user!.id, parsed.data.heroKey, parsed.data.slot);
    await refreshPowerFor(req.user!.id);
    res.json({ success: true, data: { equipped: true } });
  } catch (err) {
    next(err);
  }
});

heroRouter.post("/unequip", async (req, res, next) => {
  try {
    const parsed = heroKeySchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("heroKey is required", "VALIDATION_ERROR");

    await unequipHero(req.user!.id, parsed.data.heroKey);
    await refreshPowerFor(req.user!.id);
    res.json({ success: true, data: { equipped: false } });
  } catch (err) {
    next(err);
  }
});
