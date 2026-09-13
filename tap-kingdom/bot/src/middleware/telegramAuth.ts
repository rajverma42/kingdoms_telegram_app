import type { NextFunction, Request, Response } from "express";
import { verifyTelegramInitData, TelegramAuthError, type TelegramUser } from "../telegram/verifyInitData.js";
import { env } from "../config/env.js";
import { unauthorized } from "../utils/errors.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      telegramUser?: TelegramUser;
    }
  }
}

/**
 * Reads Telegram initData from the request (body for POST, query for GET),
 * verifies its HMAC signature and freshness, and attaches the real,
 * cryptographically-confirmed Telegram user to the request. Every payment
 * endpoint runs this first — a client can never claim to be a different
 * Telegram user than the one who actually opened the Mini App.
 */
export function requireTelegramInitData(req: Request, _res: Response, next: NextFunction): void {
  try {
    const initData = typeof req.body?.initData === "string" ? req.body.initData : (req.query.initData as string | undefined);
    if (!initData) throw unauthorized("Missing initData");

    const verified = verifyTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN);
    req.telegramUser = verified.user;
    next();
  } catch (err) {
    if (err instanceof TelegramAuthError) {
      next(unauthorized(err.message));
      return;
    }
    next(err);
  }
}
