import crypto from "node:crypto";

/**
 * Verifies Telegram Mini App `initData` per Telegram's documented algorithm:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * NEVER trust `initData` (or any user/telegramId parsed out of it) unless this
 * check passes. The frontend sends the raw initData string on every
 * authenticated request; this function is the single source of truth for
 * "is this really Telegram, and is it fresh".
 */

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface VerifiedInitData {
  user: TelegramUser;
  authDate: number;
  raw: string;
}

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60; // reject stale sessions after 24h

export function verifyTelegramInitData(
  initData: string,
  botToken: string
): VerifiedInitData {
  if (!initData) {
    throw new TelegramAuthError("Missing initData");
  }
  if (!botToken) {
    // Fail loudly in server startup validation instead, but double-guard here.
    throw new Error("TELEGRAM_BOT_TOKEN is not configured on the server");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    throw new TelegramAuthError("initData missing hash");
  }
  params.delete("hash");

  // Build the data-check-string: all key=value pairs (excluding hash),
  // sorted alphabetically by key, joined with \n.
  const dataCheckArr: string[] = [];
  const keys = Array.from(params.keys()).sort();
  for (const key of keys) {
    dataCheckArr.push(`${key}=${params.get(key)}`);
  }
  const dataCheckString = dataCheckArr.join("\n");

  // secret_key = HMAC_SHA256(bot_token, key="WebAppData")
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const validSignature = timingSafeEqualHex(computedHash, hash);
  if (!validSignature) {
    throw new TelegramAuthError("initData signature verification failed");
  }

  const authDateRaw = params.get("auth_date");
  const authDate = authDateRaw ? Number(authDateRaw) : 0;
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (!authDate || ageSeconds > MAX_AUTH_AGE_SECONDS || ageSeconds < -60) {
    throw new TelegramAuthError("initData is expired or has an invalid auth_date");
  }

  const userRaw = params.get("user");
  if (!userRaw) {
    throw new TelegramAuthError("initData missing user field");
  }

  let user: TelegramUser;
  try {
    user = JSON.parse(userRaw);
  } catch {
    throw new TelegramAuthError("initData user field is not valid JSON");
  }

  if (!user || typeof user.id !== "number") {
    throw new TelegramAuthError("initData user payload is malformed");
  }

  return { user, authDate, raw: initData };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export class TelegramAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelegramAuthError";
  }
}
