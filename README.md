# Kingdom Rush: Telegram Battle

A Telegram Mini App kingdom-strategy/battle game. This repo is the **Phase 1–5 core slice**: a real, running vertical foundation (auth → kingdom → battle) that the remaining phases build on top of. Nothing here is a fake button — every screen calls a real, server-authoritative endpoint.

## What's implemented in this slice

- **Telegram Mini App auth** — server-side verification of `initData` (HMAC-SHA256 per Telegram's spec), auto-provisioning of `User` + `Kingdom` on first contact, no separate signup.
- **Kingdom system** — 12 building types, server-computed upgrade costs/timers, atomic gold deduction, energy regeneration computed from elapsed time (not client ticks).
- **Battle system** — server picks the outcome from kingdom power vs. stage difficulty using a server-generated random seed; the client never reports win/lose.
- **10 starter heroes** seeded in the database (schema supports the full 30+; add the rest to `server/src/db/seed.ts`).
- **Structured error responses** (`{ success: false, error: { code, message } }`) everywhere, no stack traces leaked.
- **Hindi + English** localization via a centralized dictionary — no hardcoded UI strings in components.
- **Dark fantasy visual identity** — see the design tokens/rationale at the top of `client/src/styles/global.css`.
- **Minimal Telegram bot** (`/start`, `/help`, `/game`, `/profile`, `/leaderboard`, `/support`) that launches the Mini App.

## What's intentionally not in this slice yet

Everything else in the original spec — hero collection UI, army/troops, clans, referrals, Telegram Stars payments, rewarded ads, leaderboards, battle pass, admin dashboard, analytics, anti-cheat scoring, tests. These are large, security-sensitive subsystems (especially payments and ads) that deserve their own focused passes rather than being stubbed out. See **Roadmap** below — say which phase you want next and it gets built the same way: real logic, server-authoritative, no placeholders pretending to be finished features.

## Project structure

```
/client            React + TypeScript + Vite frontend
  /src/pages       Home, Kingdom, Battle screens
  /src/components  BottomNav, ResourceBar
  /src/api         Typed fetch client (attaches Telegram initData)
  /src/telegram    Telegram WebApp SDK wrapper
  /src/locales     en.json, hi.json
  /src/styles      Design tokens

/server            Node + TypeScript + Express backend
  /src/routes      auth, kingdom, battle
  /src/services    kingdomService (economy, upgrades), battleService (combat resolution)
  /src/telegram    initData verification, bot.ts (long-polling bot)
  /src/middleware  auth (Telegram verification), errorHandler
  /src/config      gameConfig.ts — building costs, battle stages (admin-editable later)
  /src/db          Prisma client, seed.ts

/prisma/schema.prisma   Database schema (Postgres)
```

## Setup

### 1. Create a Telegram bot
Message [@BotFather](https://t.me/BotFather), run `/newbot`, save the token.

### 2. Database
```bash
# Requires a running PostgreSQL instance
cd server
cp .env.example .env    # fill in TELEGRAM_BOT_TOKEN and DATABASE_URL
npm install
npm run prisma:migrate  # creates tables
npm run seed             # loads starter heroes
```

### 3. Run the backend
```bash
cd server
npm run dev              # API on http://localhost:4000
```

### 4. Run the bot (separate process)
```bash
cd server
npm run bot
```

### 5. Run the frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

### 6. Test inside Telegram
Telegram Mini Apps require HTTPS. For local development, tunnel the Vite dev server (e.g. `ngrok http 5173`) and register that HTTPS URL with @BotFather via `/newapp`. Outside of Telegram, the app loads in a browser but auth will correctly fail — that's expected, since `initData` can only be signed by real Telegram.

## Key security properties (already implemented, don't remove)

- `verifyTelegramInitData` re-checks the HMAC signature **and** `auth_date` freshness on every request — there is no long-lived client session token.
- Gold/energy/upgrade costs are computed and deducted **inside** a Prisma transaction, so concurrent/duplicate requests can't double-spend.
- Battle outcomes are derived from a server-generated seed (`crypto.randomBytes`) stored on the `Battle` row before resolution, not from anything the client sends.

## Roadmap (matches the original 20-phase plan)

| Phase | Scope |
|---|---|
| 6 | Full hero roster + hero screen (level/rank/equip) |
| 7 | Army/troop training, rock-paper-scissors combat resolution |
| 8 | Daily missions, daily reward calendar, achievements |
| 9 | Shop UI + admin-configurable `GameSetting` values |
| 10 | Telegram Stars payment flow (official invoice API, idempotent fulfillment) |
| 11 | Rewarded ads (provider abstraction, server-side reward validation) |
| 12 | Referral system (deep links, abuse prevention) |
| 13 | Clans + leaderboards |
| 14 | Battle Pass + special events |
| 15 | Admin dashboard |
| 16 | Analytics event pipeline |
| 17 | Anti-cheat risk scoring |
| 18 | Automated test suite |
| 19 | Performance pass (code splitting, image formats, caching) |
| 20 | Production deployment guide |

Tell me which phase to build next.
