import { Router } from "express";
import { requireTelegramAuth } from "../middleware/auth.js";

export const authRouter = Router();

/**
 * POST /api/auth/telegram
 * Body: none required — auth happens via the X-Telegram-Init-Data header
 * (see middleware/auth.ts), which also auto-provisions the account.
 * This endpoint just confirms auth succeeded and returns the profile,
 * so the client has a simple "am I logged in" call on app start.
 */
authRouter.post("/telegram", requireTelegramAuth, async (req, res) => {
  const user = req.user!;
  res.json({
    success: true,
    data: {
      id: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      level: user.level,
      xp: user.xp,
      preferredLang: user.preferredLang,
      photoUrl: user.photoUrl,
    },
  });
});
