import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  TELEGRAM_BOT_TOKEN: required("TELEGRAM_BOT_TOKEN"),
  MINI_APP_URL: required("MINI_APP_URL"),
  PORT: Number(process.env.PORT ?? 4001),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "*",
};
