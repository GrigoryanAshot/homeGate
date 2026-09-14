# Production checklist — Touch SmartGate

Do these in order. Firmware is universal (one `.bin` for every ESP32-C3).

## Step 1 — Cloud app (Vercel)

1. Deploy latest `main` / demo branch.
2. Set env vars:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | **Postgres** connection (Neon / Supabase / Vercel Postgres). Do not use SQLite on Vercel. |
| `AUTH_SECRET` | Long random — session cookies |
| `INVITE_SECRET` | Long random — invite tokens |
| `RESEND_API_KEY` | Real email login codes |
| `AUTH_EMAIL_FROM` | `Touch SmartGate <noreply@yourdomain.com>` |
| `NEXT_PUBLIC_APP_URL` | Public site URL |
| `NEXT_PUBLIC_MQTT_*` | HiveMQ (or your Mosquitto) broker |

3. In Prisma schema change `provider = "postgresql"` when you switch off SQLite, then `prisma db push`.

## Step 2 — Factory stickers (FREE numeric IDs)

```bash
npx tsx scripts/factory-seed.ts 100
# optional: npx tsx scripts/factory-seed.ts 100 --digits 8
```

- Random **numeric** product IDs (not sequential).
- Saves FREE rows in DB.
- Prints CSV: `productId,secret,qr`
- Send QR column to waterproof sticker printer (one QR per box).
- Stick on the box — SoftAP does **not** need the QR; app “Add gate” does.

## Step 3 — Flash ESP (once per board)

1. Arduino: open `firmware/HomeGate/HomeGate.ino`
2. In `config.h` set `API_BASE_URL` to your stable HTTPS URL.
3. Same MQTT user/host for all boards (topics are per product ID).
4. Upload **same** firmware to every SuperMini.

## Step 4 — Customer setup (least steps)

1. Power ESP → SoftAP `TouchGate-XXXX`
2. Phone joins → page is **home Wi‑Fi only** (password) → Save
3. Phone back on home Wi‑Fi → open app → **email + name**
4. **Add gate** → scan sticker QR (or type ID|secret)
5. Cloud links the online ESP chip to that sticker → Open / Close

MQTT topics (automatic after claim):

- `home/gate/{productId}/command`
- `home/gate/{productId}/status`

## Step 5 — MQTT scale

- Free HiveMQ ≈ 100 connections → fine for early sales
- Later: Mosquitto on a VPS, or paid broker

## What you still do by hand

- Order stickers from CSV
- Assemble hardware (ESP + optos on gate board)
- Create Postgres + Resend accounts
- Set Vercel env and redeploy
- Reflash boards once with this universal firmware

## Local / demo DB

SQLite still works locally:

```bash
npx prisma db push
npm run db:seed
npm run factory:seed -- 5
```
