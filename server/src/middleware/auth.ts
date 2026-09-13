import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { verifyTelegramInitData, TelegramAuthError } from "../telegram/verifyInitData.js";
import { unauthorized } from "../utils/errors.js";
import type { User } from "@prisma/client";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

/**
 * Every authenticated request must include the raw Telegram initData string,
 * e.g. header `X-Telegram-Init-Data: <initData>`. We re-verify it on every
 * request rather than trusting a long-lived client-side session, since
 * Telegram initData already carries its own signed freshness window.
 *
 * On first sight of a telegramId we auto-provision the User + Kingdom
 * (no traditional signup flow), matching the "automatic account creation"
 * requirement.
 */
export async function requireTelegramAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const initData = req.header("X-Telegram-Init-Data");
    if (!initData) {
      throw unauthorized("Missing X-Telegram-Init-Data header");
    }

    const verified = verifyTelegramInitData(initData, BOT_TOKEN);
    const tgId = BigInt(verified.user.id);

    let user = await prisma.user.findUnique({ where: { telegramId: tgId } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: tgId,
          username: verified.user.username,
          firstName: verified.user.first_name,
          lastName: verified.user.last_name,
          languageCode: verified.user.language_code,
          preferredLang: verified.user.language_code?.startsWith("hi") ? "hi" : "en",
          photoUrl: verified.user.photo_url,
          kingdom: {
            create: {
              buildings: {
                create: [{ type: "CASTLE", level: 1 }],
              },
            },
          },
        },
      });
    } else if (user.isRestricted) {
      throw unauthorized("This account is restricted. Contact support.");
    } else {
      // Keep lightweight profile fields fresh + track activity for DAU/MAU.
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          username: verified.user.username,
          firstName: verified.user.first_name,
          lastName: verified.user.last_name,
          photoUrl: verified.user.photo_url,
          lastSeenAt: new Date(),
        },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof TelegramAuthError) {
      return next(unauthorized(err.message));
    }
    next(err);
  }
}
