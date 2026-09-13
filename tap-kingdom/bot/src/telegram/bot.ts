import { Telegraf, Markup } from "telegraf";
import { env } from "../config/env.js";
import { registerPaymentHandlers } from "../payments/webhookHandlers.js";

export function createBot(): Telegraf {
  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

  const playButton = Markup.inlineKeyboard([
    Markup.button.webApp("🎮 PLAY TAP KINGDOM", env.MINI_APP_URL),
  ]);

  bot.start((ctx) =>
    ctx.reply(
      "Welcome to Tap Kingdom! 🏰\n\nTap, build, battle, and grow your kingdom — free to play, with optional premium extras.",
      playButton
    )
  );

  bot.command("game", (ctx) => ctx.reply("Ready to play?", playButton));

  bot.help((ctx) =>
    ctx.reply(
      "Tap Kingdom commands:\n" +
        "/game — open the game\n" +
        "/help — this message\n" +
        "/support — contact support\n\n" +
        "Tap your emblem to earn coins, build your kingdom, recruit heroes, and battle for rewards. " +
        "The Shop has optional premium items you can buy with Telegram Stars — never required to play."
    )
  );

  bot.command("support", (ctx) =>
    ctx.reply("Need help? Describe your issue here and we'll get back to you as soon as we can.")
  );

  registerPaymentHandlers(bot);

  bot.catch((err, ctx) => {
    console.error(`Unhandled bot error for update ${ctx.updateType}:`, err);
  });

  return bot;
}
