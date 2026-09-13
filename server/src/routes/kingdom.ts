import { Router } from "express";
import { z } from "zod";
import { requireTelegramAuth } from "../middleware/auth.js";
import {
  getFullKingdom,
  resolveFinishedUpgrades,
  upgradeBuilding,
  recomputeKingdomPower,
} from "../services/kingdomService.js";
import { badRequest } from "../utils/errors.js";
import { getBuildingLevelConfig } from "../config/gameConfig.js";

export const kingdomRouter = Router();
kingdomRouter.use(requireTelegramAuth);

function serializeKingdom(kingdom: NonNullable<Awaited<ReturnType<typeof getFullKingdom>>>) {
  return {
    id: kingdom.id,
    name: kingdom.name,
    level: kingdom.level,
    power: kingdom.power,
    gold: kingdom.gold.toString(),
    gems: kingdom.gems.toString(),
    energy: kingdom.energy,
    energyMax: kingdom.energyMax,
    buildings: kingdom.buildings.map((b) => ({
      id: b.id,
      type: b.type,
      level: b.level,
      upgrading: !!b.upgradeFinishesAt,
      upgradeFinishesAt: b.upgradeFinishesAt,
      nextLevelCost: getBuildingLevelConfig(b.type, b.level).goldCost,
      nextLevelSeconds: getBuildingLevelConfig(b.type, b.level).upgradeSeconds,
    })),
  };
}

kingdomRouter.get("/", async (req, res, next) => {
  try {
    await resolveFinishedUpgrades(req.user!.id);
    const kingdom = await getFullKingdom(req.user!.id);
    if (!kingdom) throw badRequest("Kingdom not found");
    res.json({ success: true, data: serializeKingdom(kingdom) });
  } catch (err) {
    next(err);
  }
});

const upgradeSchema = z.object({
  type: z.enum([
    "CASTLE", "BARRACKS", "ARCHER_TOWER", "MAGE_TOWER", "BLACKSMITH",
    "GOLD_MINE", "FARM", "GEM_MINE", "HERO_HALL", "TRAINING_GROUND",
    "WALL", "WATCH_TOWER",
  ]),
});

kingdomRouter.post("/building/upgrade", async (req, res, next) => {
  try {
    const parsed = upgradeSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("Invalid building type", "VALIDATION_ERROR");

    await resolveFinishedUpgrades(req.user!.id);
    const building = await upgradeBuilding(req.user!.id, parsed.data.type);
    const kingdomAfterPower = await getFullKingdom(req.user!.id);
    if (kingdomAfterPower) await recomputeKingdomPower(kingdomAfterPower.id);

    res.json({
      success: true,
      data: {
        type: building.type,
        level: building.level,
        upgradeFinishesAt: building.upgradeFinishesAt,
      },
    });
  } catch (err) {
    next(err);
  }
});
