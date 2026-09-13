/**
 * Minimal long-polling Telegram bot for the commands the game needs:
 * /start, /help, /game, /profile, /leaderboard, /support.
 *
 * This intentionally avoids a bot framework dependency to keep the slice
 * self-contained — swap in a library (grammY, telegraf) once you're adding
 * richer bot features (notifications, inline keyboards for clans, etc.).
 *
 * Run with: tsx src/telegram/bot.ts (separate process from the API server).
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL;
const API_ROOT = `https://api.telegram.org/bot${BOT_TOKEN}`;

if (!BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required to run the bot.");
}
if (!MINI_APP_URL) {
  console.warn("MINI_APP_URL is not set — /start and /game will not include a working launch button.");
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
  };
}

async function tg(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_ROOT}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`Telegram API error on ${method}:`, await res.text());
  }
}

function launchKeyboard() {
  if (!MINI_APP_URL) return undefined;
  return {
    inline_keyboard: [[{ text: "Open Kingdom Rush", web_app: { url: MINI_APP_URL } }]],
  };
}

async function handleCommand(chatId: number, text: string) {
  const command = text.split(" ")[0].split("@")[0];

  switch (command) {
    case "/start":
    case "/game":
      await tg("sendMessage", {
        chat_id: chatId,
        text: "Welcome to Kingdom Rush: Telegram Battle! Tap below to open your kingdom.",
        reply_markup: launchKeyboard(),
      });
      break;
    case "/help":
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          "Commands:\n/game - open the game\n/profile - view your kingdom summary\n" +
          "/leaderboard - top kingdoms\n/support - get help",
      });
      break;
    case "/profile":
    case "/leaderboard":
      // These read from the same database as the API. Wire them up once the
      // profile/leaderboard endpoints exist (Phase 13/19) — for now, point
      // players to the in-app screens which are the source of truth.
      await tg("sendMessage", {
        chat_id: chatId,
        text: "Open the game to view this — tap below.",
        reply_markup: launchKeyboard(),
      });
      break;
    case "/support":
      await tg("sendMessage", {
        chat_id: chatId,
        text: "Need help? Use the Support page inside the game (Home → Support).",
      });
      break;
    default:
      await tg("sendMessage", { chat_id: chatId, text: "Unknown command. Try /help." });
  }
}

async function poll(offset?: number) {
  const res = await fetch(
    `${API_ROOT}/getUpdates?timeout=30${offset ? `&offset=${offset}` : ""}`
  );
  const data = (await res.json()) as { ok: boolean; result: TelegramUpdate[] };

  let nextOffset = offset;
  for (const update of data.result ?? []) {
    nextOffset = update.update_id + 1;
    const text = update.message?.text;
    const chatId = update.message?.chat.id;
    if (text && chatId) {
      await handleCommand(chatId, text).catch((e) => console.error("Command error:", e));
    }
  }

  setImmediate(() => poll(nextOffset));
}

console.log("Kingdom Rush bot starting (long polling)...");
poll();
