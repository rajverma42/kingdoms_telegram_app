import { env } from "./config/env.js";
import { createBot } from "./telegram/bot.js";
import { createServer } from "./server.js";

async function main() {
  const bot = createBot();
  const app = createServer(bot);

  app.listen(env.PORT, () => {
    console.log(`Tap Kingdom bot API listening on :${env.PORT}`);
  });

  await bot.launch();
  console.log("Tap Kingdom bot is polling for Telegram updates.");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((err) => {
  console.error("Fatal error starting Tap Kingdom bot:", err);
  process.exit(1);
});
