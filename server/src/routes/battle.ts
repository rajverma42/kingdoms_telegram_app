import { Router } from "express";
import { z } from "zod";
import { requireTelegramAuth } from "../middleware/auth.js";
import { startBattle, resolveBattle } from "../services/battleService.js";
import { badRequest } from "../utils/errors.js";
import { BATTLE_STAGES } from "../config/gameConfig.js";

export const battleRouter = Router();
battleRouter.use(requireTelegramAuth);

battleRouter.get("/stages", (_req, res) => {
  res.json({ success: true, data: BATTLE_STAGES });
});

const startSchema = z.object({ stageId: z.string().min(1) });

battleRouter.post("/start", async (req, res, next) => {
  try {
    const parsed = startSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("stageId is required", "VALIDATION_ERROR");

    const battle = await startBattle(req.user!.id, parsed.data.stageId);
    res.json({
      success: true,
      data: { battleId: battle.id, stageId: battle.stageId, energyCost: battle.energyCost },
    });
  } catch (err) {
    next(err);
  }
});

const completeSchema = z.object({ battleId: z.string().min(1) });

// Note the name: this "completes" the battle server-side by resolving it —
// it does not accept a client-reported win/lose, only which battle to settle.
battleRouter.post("/complete", async (req, res, next) => {
  try {
    const parsed = completeSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("battleId is required", "VALIDATION_ERROR");

    const result = await resolveBattle(req.user!.id, parsed.data.battleId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
