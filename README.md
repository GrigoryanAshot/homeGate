# HomeGate (Cloud MQTT)

ESP32-S3 keeps an **outbound TLS MQTT** connection to a free cloud broker (HiveMQ Cloud).  
Phone / Vercel page publishes commands over **Secure WebSockets** from anywhere.

**No PC tunnel. No local MQTT broker. No Raspberry Pi.**

```
Phone / Vercel (mqtt.js WSS :8884)
        ↕
  HiveMQ Cloud (free)
        ↕
ESP32 on home Wi‑Fi (MQTT TLS :8883)
        → shorts remote OPEN/CLOSE pads
```

## 1. Create HiveMQ Cloud (free)

1. Sign up: https://console.hivemq.cloud/
2. Create a cluster
3. Create MQTT credentials (username + password)
4. Copy the cluster hostname, e.g. `xxxx.s1.eu.hivemq.cloud`

## 2. ESP32 firmware (ESP32-C3 Super Mini)

Arduino Library Manager → install **PubSubClient** (Nick O'Leary).

Board package: **esp32 by Espressif** → Board **ESP32C3 Dev Module**

| Setting | Value |
|---------|--------|
| USB CDC On Boot | **Enabled** |
| Flash Size | 4MB (typical Super Mini) |
| Upload Speed | 921600 (try 115200 if fail) |

Edit `firmware/HomeGate/config.h`:

```c
#define WIFI_SSID "your-wifi"
#define WIFI_PASS "your-wifi-password"
#define MQTT_HOST "xxxx.s1.eu.hivemq.cloud"
#define MQTT_USER "..."
#define MQTT_PASS "..."
#define DEVICE_ID "demo-gate-001"       // unique per unit
#define DEVICE_SECRET "secret-demo-001" // matches DB / QR
```

### Wiring (C3 Super Mini)

| ESP32-C3 | Connection |
|----------|------------|
| GPIO **3** | PC817 UP (via 330Ω) |
| GPIO **5** | PC817 DOWN (via 330Ω) |
| GPIO **10** | PC817 STOP (via 330Ω) |
| GPIO 7 | Optional local STOP button → GND |
| GPIO 8 | Onboard LED |
| GPIO 9 (BOOT) | Hold ~3.5s = clear Wi‑Fi |

Upload `firmware/HomeGate/HomeGate.ino`.

Serial Monitor **115200** — you want:
1. `Cloud register → … /api/devices/register` then `Register HTTP 200`
2. `MQTT connected, subscribed to home/gate/command`

LED on = Wi‑Fi up; 3 quick blinks = DB register OK.

### Step 3 — ESP self-register (FREE in DB)

After Wi‑Fi + NTP, the C3 POSTs to your Next.js API:

`POST {API_BASE_URL}/api/devices/register`  
body: `{ "deviceId", "secret" }` → SQLite row **FREE** (or refresh if already known).

In `config.h` set your PC LAN IP (ESP cannot use `localhost`):

```c
#define API_BASE_URL "http://192.168.1.42:3000"
```

On the PC:

```bash
npm run db:push && npm run db:seed   # optional seed
npm run dev                          # listens on 0.0.0.0:3000
npm run db:studio                    # confirm device appears FREE / lastSeenAt updates
```

Allow Node through Windows Firewall if the ESP cannot reach the PC.

Phone claim (scan QR) then sets the same id to **BUSY**. Re-register from ESP does **not** steal a claimed gate.

### Step 4 — Wi‑Fi from the phone (SoftAP)

No SSID in firmware for production. First boot (or after Wi‑Fi reset):

1. LED **fast blink** → join phone Wi‑Fi **`TouchGate-XXXX`**
2. Open **http://192.168.4.1** → enter home Wi‑Fi → Save
3. Box reboots, joins home Wi‑Fi → registers to API → MQTT
4. In the app: Settings → **Set up gate Wi‑Fi** (guide) → Add gate → scan QR

**Reset Wi‑Fi:** hold **BOOT** on the C3 ~3.5s (clears NVS, SoftAP again).

Optional factory/dev fallback in `config.h`: `FACTORY_WIFI_SSID` / `FACTORY_WIFI_PASS` (leave empty in production).

### Topics

| Topic | Direction | Payload |
|-------|-----------|---------|
| `home/gate/command` | web → ESP | `OPEN` / `CLOSE` / `STOP` |
| `home/gate/status` | ESP → web | `{"state":"…","registered":true,"deviceId":"…"}` |

## 3. Web app (anywhere / Vercel)

### Next.js pilot demo (recommended for partners)

```bash
npm install
npm run dev
```

Open **`/smartgate-demo`** — unlisted route (no nav/sitemap), `robots: noindex`.

### Local device database (step 1 — SQLite)

Prisma + SQLite file `prisma/dev.db`. Later swap `DATABASE_URL` to Postgres — same schema.

```bash
cp .env.example .env   # includes DATABASE_URL="file:./dev.db"
npm run db:push
npm run db:seed
npm run db:studio      # optional GUI
```

| API | Purpose |
|-----|---------|
| `POST /api/devices/register` | ESP online → insert/refresh as **FREE** |
| `POST /api/devices/claim` | Phone QR claim → **BUSY** (409 if already in use) |
| `POST /api/devices/reset` | Clear owner → **FREE** again |
| `GET /api/devices/:id` | Status lookup |

Seeded demo QRs:

- FREE: `smartgate://pair?id=demo-gate-001&s=secret-demo-001`
- BUSY (reject): `smartgate://pair?id=demo-gate-busy&s=secret-demo-busy`

In the app: **Add gate** → camera opens automatically (HTTPS or localhost).  
Fallbacks: paste pair link, or “demo FREE device”.

Printable test QRs: **`/pair-qr-samples`** (open on a second phone / screen).

Set Vercel env vars from `.env.example`:

- `NEXT_PUBLIC_MQTT_HOST`
- `NEXT_PUBLIC_MQTT_USER`
- `NEXT_PUBLIC_MQTT_PASS`
- `DATABASE_URL` (local only until cloud Postgres)

Features: live MQTT control, mock mode, guest QR passes, permissions table, activity log.

### Legacy static UI

1. Copy `js/mqtt-config.example.js` → `js/mqtt-config.js` and fill host/user/pass  
   **or** open the page → gear icon → enter broker details (saved in the browser)
2. Open `index.html` locally or serve from ESP firmware
3. Tap **Բարձրացնել** → publishes `OPEN`

Uses [mqtt.js](https://github.com/mqttjs/MQTT.js) over `wss://HOST:8884/mqtt`.

### React snippet

See `examples/GateMqttControl.jsx` (`npm i mqtt`).

## Security notes

- Anyone with your MQTT user/password can open the door — use a strong password.
- Prefer unique credentials only for this gate.
- ESP uses `setInsecure()` for TLS bootstrap; you can pin ISRG Root X1 later.
