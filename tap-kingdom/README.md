# Tap Kingdom

A premium, mobile-first Telegram Mini App game: tap to earn coins, build a
kingdom, recruit heroes, fight PvE battles, and — entirely optionally —
spend your own Telegram Stars (1–50 ⭐ per item) on digital extras. No ads,
no gambling, no game database, no admin panel, and users can never earn or
withdraw Telegram Stars.

## Architecture at a glance

```
tap-kingdom/
├── client/     React + TypeScript + Vite Mini App — the entire game.
│               All progress (coins, buildings, heroes, achievements...)
│               lives in the browser's localStorage. No game backend.
│
└── bot/        Node + TypeScript + Telegraf + Express. Its only job is
                the Telegram Stars payment flow: create invoices, verify
                payments, and answer "what has this user actually paid
                for?" It holds no game state.
```

Why two separate small services instead of one bigger backend: the game
itself needs no server (nothing about tapping, battling, or building is
security-sensitive), but **payments cannot be verified from the client
alone** — "never trust a client-submitted price or payment status" is a
hard requirement, and that requires *something* server-side to hold the
truth about what was actually paid for. The bot is exactly that, and
nothing more.

## The one deliberate exception to "no database"

The spec for this game says "no game database" — and there isn't one; all
gameplay state is local to the browser. But it also says "duplicate payment
protection", "never trust local storage for payment verification", and
"never grant an item twice" — and those three requirements are impossible
to satisfy with *zero* server-side persistence, because Telegram can and
does redeliver `successful_payment` updates (retries, reconnects), and a
purely client-held record of "what I own" is exactly the kind of thing a
user could edit in devtools.

So `bot/src/payments/ledger.ts` keeps one small JSON file
(`bot/data/purchases.json`) mapping Telegram user ID → the list of
purchases fulfilled for them, keyed by Telegram's own
`telegram_payment_charge_id`. This is **not** a game database — it stores
nothing about gameplay, only "did this exact charge get fulfilled yet" —
and it's a flat file with an in-process write lock, not Postgres/MySQL/
Mongo/Firebase/Supabase/Redis. If this bot ever needs to run as more than
one process, that file is the one thing to swap for a real key-value store
(the `ledger.ts` interface is small on purpose, to make that swap
mechanical).

## Payment flow

1. Client asks the bot to create an invoice for a product **id** (never a
   price) — `POST /api/invoice { itemId, initData }`.
2. The bot verifies `initData`'s HMAC signature (proves it's really
   Telegram, and that the request is fresh), looks up the *real* price from
   `bot/src/payments/products.ts` (the only price catalog that matters),
   and creates a Telegram Stars invoice link via the Bot API.
3. The client opens that link with `Telegram.WebApp.openInvoice()` —
   Telegram itself runs the native payment sheet.
4. Telegram sends the bot a `pre_checkout_query`; the bot re-validates the
   product, price, and currency (`XTR`) against its own catalog and either
   approves or rejects the charge.
5. On success, Telegram sends the bot a `successful_payment` message. The
   bot records it in the ledger, keyed by `telegram_payment_charge_id` — if
   that charge id was already recorded (a duplicate/retried update), nothing
   happens a second time.
6. The client polls `GET /api/entitlements?initData=...` (which reads the
   ledger) and applies the effect of every purchase record it hasn't
   applied yet, matched by charge id — never by item id, since a consumable
   like a chest or hero pack can be bought more than once and each charge
   must be granted exactly once.

The client's `Telegram Stars` price is never sent to the bot and never
decides anything — see `bot/src/payments/products.ts` vs.
`client/src/game/data/shopItems.ts` (the latter is commented as
display-only for exactly this reason).

## Setup

### Bot
```bash
cd bot
cp .env.example .env    # fill in TELEGRAM_BOT_TOKEN (from @BotFather) and MINI_APP_URL
npm install
npm run dev              # long-polls Telegram + serves the HTTP API on :4001
```

### Client
```bash
cd client
cp .env.example .env    # VITE_BOT_API_URL should point at the bot's HTTP API
npm install
npm run dev              # http://localhost:5173
```

### Testing inside Telegram
Telegram Mini Apps require HTTPS. Tunnel the Vite dev server (e.g.
`ngrok http 5173`), register that URL with @BotFather via `/newapp` or
`/setmenubutton`, and set it as `MINI_APP_URL` in the bot's `.env`. Stars
payments only work for a real bot talking to real Telegram servers — they
cannot be exercised from a plain browser tab.

## What's implemented

- Tap-to-earn with a client-side cooldown + burst limit (not server
  enforced — there's nothing server-authoritative to protect here, since
  taps only ever produce free currency)
- Kingdom system: 8 buildings, level-gated by player level, timed upgrades
- PvE battles: Normal / Elite / Boss tiers, resolved client-side (see
  `game/logic/battle.ts` for why that's a safe simplification here)
- 20 original heroes across 5 rarities, leveling, and fragment-based
  unlocking (fragments are a free in-game currency, never Stars)
- 6 troop types, trainable and upgradable with coins
- Daily missions, a 7-day daily reward cycle, and 30 achievements
- A versioned local save with structural-validation-based corruption
  recovery (a garbled save starts fresh instead of crashing the app) and a
  Reset Progress option
- A personal stats screen (taps, battles won, heroes unlocked, kingdom
  level, achievements) — no global leaderboard, since there's no backend to
  honestly host one
- English + Hindi localization via a centralized dictionary
- The full Stars shop (Featured/Heroes/Skins/Weapons/Chests/Bundles),
  10 products priced 1–50 ⭐, and the real payment flow described above
- `/start`, `/game`, `/help`, `/support` bot commands
- **Cosmetic re-skinning.** Owning "Premium Kingdom Skin: Twilight Spire"
  lets you toggle a full app-wide re-theme in Settings — it works by
  overriding a handful of CSS custom properties on `<body>`
  (`client/src/styles/global.css`'s `[data-kingdom-skin]` rule), which every
  component already themes itself off of, so nothing but that one root
  attribute needs to change. Owning "Exclusive Hero Skin: Emberfall" or
  "Premium Weapon: Dawnfang" lets you equip it to any one owned hero at a
  time from the Heroes screen — the hero's card gets a glowing border and a
  badge, and you're free to reassign either cosmetic to a different hero
  whenever you like.

## What's simplified in this slice

- **Battle combat is a simple deterministic round simulation**, not a full
  turn-based combat UI with per-hero abilities firing individually. This
  was a deliberate scope choice to keep this pass focused and shippable;
  the hero "special ability" text is flavor for now, not yet mechanically
  distinct per hero.
- **Single-instance assumption for the payment ledger.** Documented above —
  fine for one bot process, not multi-instance-safe as written.
