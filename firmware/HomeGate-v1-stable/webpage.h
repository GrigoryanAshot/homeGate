#pragma once
#include <pgmspace.h>

const char APP_INDEX[] PROGMEM = R"====(<!DOCTYPE html>
<html lang="hy">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />
    <meta name="theme-color" content="#0b0c0f" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="format-detection" content="telephone=no" />
    <title>Տան դուռ</title>
    <meta name="description" content="Փաթաթվող դռան բացում և փակում ESP32-ով" />
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23111114'/%3E%3Cpath d='M12 48V20l20-10 20 10v28H12z' fill='none' stroke='%23d4a574' stroke-width='3'/%3E%3Cpath d='M32 22v26' stroke='%23d4a574' stroke-width='3'/%3E%3C/svg%3E" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+Armenian:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
:root {
  --bg: #0b0c0f;
  --bg-elevated: #15171c;
  --ink: #f4efe6;
  --muted: #b7b0a4;
  --line: rgba(244, 239, 230, 0.12);
  --gold: #d4a574;
  --gold-strong: #e8c49a;
  --danger: #e07a6a;
  --ok: #7dcaa4;
  --waiting: #c9b06a;
  --shadow: 0 18px 50px rgba(0, 0, 0, 0.38);
  --radius: 28px;
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--bg);
  color: var(--ink);
  font-family: "Noto Sans Armenian", "Segoe UI", sans-serif;
  overscroll-behavior: none;
}

body {
  min-height: 100dvh;
  user-select: none;
}

button,
input {
  font: inherit;
}

button {
  touch-action: manipulation;
  cursor: pointer;
}

.app {
  min-height: 100dvh;
  padding: calc(14px + var(--safe-top)) 20px calc(24px + var(--safe-bottom));
  max-width: 480px;
  margin: 0 auto;
  background:
    radial-gradient(120% 70% at 50% -10%, rgba(212, 165, 116, 0.16), transparent 55%),
    radial-gradient(90% 50% at 100% 100%, rgba(125, 202, 164, 0.06), transparent 50%),
    var(--bg);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.92rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--waiting);
  box-shadow: 0 0 0 4px rgba(201, 176, 106, 0.15);
}

.status-pill[data-state="online"] {
  color: #d7efe4;
}

.status-pill[data-state="online"] .status-dot {
  background: var(--ok);
  box-shadow: 0 0 0 4px rgba(125, 202, 164, 0.16);
}

.status-pill[data-state="offline"] {
  color: #f3d2cc;
}

.status-pill[data-state="offline"] .status-dot {
  background: var(--danger);
  box-shadow: 0 0 0 4px rgba(224, 122, 106, 0.16);
}

.icon-btn {
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--ink);
  display: grid;
  place-items: center;
  padding: 0;
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.icon-btn:active,
.action:active,
.stop-btn:active,
.save-btn:active {
  transform: scale(0.98);
}

.stage {
  margin-top: 28px;
  text-align: center;
}

.kicker {
  margin: 0;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.72rem;
  color: var(--gold);
}

h1 {
  margin: 6px 0 22px;
  font-size: clamp(2.1rem, 8vw, 2.7rem);
  font-weight: 700;
  letter-spacing: -0.03em;
}

.gate-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--bg-elevated);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  padding: 8px 8px 22px;
}

.sky {
  position: absolute;
  inset: 0 0 42%;
  background: linear-gradient(180deg, #1d2430 0%, #15171c 100%);
  pointer-events: none;
}

.gate-art {
  position: relative;
  width: 100%;
  height: auto;
  display: block;
}

.curtain {
  transform-box: fill-box;
  transform-origin: top center;
  transition: transform 2.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.gate-card[data-state="open"] .curtain,
.gate-card[data-state="opening"] .curtain {
  transform: translateY(-6px) scaleY(0.14);
}

.gate-card[data-state="opening"] .curtain,
.gate-card[data-state="closing"] .curtain {
  transition-duration: 2.6s;
}

.gate-card[data-state="open"] .sky,
.gate-card[data-state="opening"] .sky {
  background: linear-gradient(180deg, #2a2418 0%, #15171c 100%);
}

.gate-state {
  margin: 4px 0 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.gate-hint {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.95rem;
}

.actions {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action {
  min-height: 92px;
  border: 0;
  border-radius: 24px;
  color: #1a140e;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 1.12rem;
  font-weight: 700;
  box-shadow: var(--shadow);
}

.action.open {
  background: linear-gradient(180deg, var(--gold-strong), var(--gold));
}

.action.close {
  color: var(--ink);
  background: #1d2027;
  border: 1px solid var(--line);
}

.action:disabled,
.stop-btn:disabled {
  opacity: 0.45;
}

.action-icon svg {
  width: 26px;
  height: 26px;
}

.stop-btn {
  width: 100%;
  margin-top: 12px;
  min-height: 56px;
  border-radius: 18px;
  border: 1px solid rgba(224, 122, 106, 0.35);
  background: rgba(224, 122, 106, 0.1);
  color: #f0c2ba;
  font-weight: 600;
}

.toast {
  position: fixed;
  left: 20px;
  right: 20px;
  bottom: calc(18px + var(--safe-bottom));
  max-width: 440px;
  margin: 0 auto;
  padding: 14px 16px;
  border-radius: 16px;
  background: #23262e;
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  text-align: center;
}

.sheet[hidden],
.toast[hidden] {
  display: none;
}

.sheet {
  position: fixed;
  inset: 0;
  z-index: 20;
}

.sheet-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
}

.sheet-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 20px calc(24px + var(--safe-bottom));
  border-radius: 28px 28px 0 0;
  background: #16181d;
  border-top: 1px solid var(--line);
  max-height: 85dvh;
  overflow: auto;
}

.sheet-handle {
  width: 42px;
  height: 4px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.18);
  margin: 6px auto 16px;
}

.sheet h2 {
  margin: 0 0 16px;
  font-size: 1.3rem;
}

label {
  display: block;
  text-align: left;
  margin: 14px 0 8px;
  color: var(--muted);
}

input {
  width: 100%;
  min-height: 52px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: #101217;
  color: var(--ink);
  padding: 0 14px;
  user-select: text;
}

.help {
  text-align: left;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.45;
}

.save-btn {
  width: 100%;
  min-height: 54px;
  border: 0;
  border-radius: 16px;
  background: var(--gold);
  color: #1a140e;
  font-weight: 700;
}

@media (min-width: 720px) {
  .app {
    padding-top: 36px;
  }
}

@media (orientation: landscape) and (max-height: 520px) {
  .app {
    padding-top: calc(8px + var(--safe-top));
  }

  .stage {
    margin-top: 10px;
  }

  h1 {
    margin-bottom: 10px;
    font-size: 1.6rem;
  }

  .gate-art {
    max-height: 120px;
    margin: 0 auto;
  }

  .action {
    min-height: 68px;
    flex-direction: row;
    font-size: 1.05rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .leaf,
  .curtain,
  .icon-btn,
  .action,
  .stop-btn,
  .save-btn {
    transition: none;
    transform: none;
  }
}

</style>
  </head>
  <body>
    <div class="app">
      <header class="topbar">
        <div class="status-pill" id="connectionPill" data-state="waiting">
          <span class="status-dot" aria-hidden="true"></span>
          <span id="connectionLabel">Սպասում է…</span>
        </div>
        <button class="icon-btn" id="settingsBtn" type="button" aria-label="Կարգավորումներ">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8" />
            <path
              d="M19.4 13.5a7.6 7.6 0 0 0 .05-3l2-1.15-2-3.46-2.2.7a7.7 7.7 0 0 0-2.6-1.5L14.2 3h-4.4l-.45 2.09a7.7 7.7 0 0 0-2.6 1.5l-2.2-.7-2 3.46 2 1.15a7.6 7.6 0 0 0 0 3l-2 1.15 2 3.46 2.2-.7a7.7 7.7 0 0 0 2.6 1.5L9.8 21h4.4l.45-2.09a7.7 7.7 0 0 0 2.6-1.5l2.2.7 2-3.46-2-1.15Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </header>

      <main class="stage">
        <p class="kicker">Փաթաթվող դուռ</p>
        <h1>Տան դուռ</h1>

        <section class="gate-card" aria-live="polite">
          <div class="sky" aria-hidden="true"></div>
          <svg class="gate-art" viewBox="0 0 320 240" role="img" aria-labelledby="gateStateLabel">
            <defs>
              <linearGradient id="slat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#e7d7c0" />
                <stop offset="55%" stop-color="#c4ae8f" />
                <stop offset="100%" stop-color="#8f7b63" />
              </linearGradient>
              <linearGradient id="warm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3a3226" />
                <stop offset="100%" stop-color="#1a1713" />
              </linearGradient>
            </defs>
            <circle cx="46" cy="28" r="1.4" fill="#d8c8a8" />
            <circle cx="92" cy="18" r="1.1" fill="#d8c8a8" />
            <circle cx="248" cy="16" r="1.2" fill="#d8c8a8" />
            <circle cx="286" cy="32" r="1.3" fill="#d8c8a8" />
            <rect x="52" y="40" width="216" height="164" rx="8" fill="url(#warm)" />
            <rect x="70" y="86" width="36" height="52" rx="3" fill="#d4a574" opacity="0.35" />
            <rect x="214" y="86" width="36" height="52" rx="3" fill="#d4a574" opacity="0.35" />
            <g id="curtain" class="curtain">
              <rect x="62" y="48" width="196" height="18" rx="2" fill="url(#slat)" />
              <rect x="62" y="68" width="196" height="18" rx="2" fill="url(#slat)" />
              <rect x="62" y="88" width="196" height="18" rx="2" fill="url(#slat)" />
              <rect x="62" y="108" width="196" height="18" rx="2" fill="url(#slat)" />
              <rect x="62" y="128" width="196" height="18" rx="2" fill="url(#slat)" />
              <rect x="62" y="148" width="196" height="18" rx="2" fill="url(#slat)" />
              <rect x="62" y="168" width="196" height="18" rx="2" fill="url(#slat)" />
              <rect x="146" y="152" width="28" height="10" rx="3" fill="#5c5044" />
            </g>
            <rect x="48" y="28" width="224" height="22" rx="6" fill="#8a7a66" />
            <rect x="48" y="28" width="224" height="164" rx="8" fill="none" stroke="#c4ae8f" stroke-width="7" />
            <rect x="0" y="204" width="320" height="36" fill="#16181d" />
          </svg>
          <p class="gate-state" id="gateStateLabel">Կարգավիճակը ստուգվում է</p>
          <p class="gate-hint" id="gateHint">Սեղմեք կոճակը՝ դուռը բարձրացնելու կամ իջեցնելու համար</p>
        </section>

        <div class="actions">
          <button class="action open" id="openBtn" type="button">
            <span class="action-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 19V7M6 11l6-6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            Բարձրացնել
          </button>
          <button class="action close" id="closeBtn" type="button">
            <span class="action-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 5v12M6 13l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            Իջեցնել
          </button>
        </div>

        <button class="stop-btn" id="stopBtn" type="button">Կանգնեցնել</button>
      </main>

      <p class="toast" id="toast" hidden></p>
    </div>

    <div class="sheet" id="settingsSheet" hidden>
      <div class="sheet-backdrop" data-close-sheet></div>
      <div class="sheet-panel" role="dialog" aria-labelledby="settingsTitle">
        <div class="sheet-handle" aria-hidden="true"></div>
        <h2 id="settingsTitle">Կարգավորումներ</h2>
        <label for="espUrl">ESP32 հասցե</label>
        <input id="espUrl" type="url" inputmode="url" autocomplete="off" placeholder="http://10.0.1.8" />
        <p class="help">
          Եթե բացում եք հենց ESP32-ի կայքը, թողեք դատարկ։ Հակառակ դեպքում գրեք IP հասցեն։
        </p>
        <label for="wifiSsid">Wi‑Fi անուն</label>
        <input id="wifiSsid" type="text" autocomplete="off" placeholder="HomeWiFi" />
        <label for="wifiPass">Wi‑Fi գաղտնաբառ</label>
        <input id="wifiPass" type="password" autocomplete="off" />
        <p class="help">Wi‑Fi-ը փոխելուց հետո ESP32-ը կվերագործարկվի։</p>
        <button class="save-btn" id="saveSettingsBtn" type="button">Պահպանել</button>
      </div>
    </div>

    <script>
const STORAGE_KEY = "homegate.espUrl";

const labels = {
  waiting: "Սպասում է…",
  online: "Միացված է",
  offline: "Անջատված է",
  unknown: "Կարգավիճակը ստուգվում է",
  open: "Բաց է",
  closed: "Փակ է",
  opening: "Բարձրանում է…",
  closing: "Իջնում է…",
  stopped: "Կանգնեցված է",
  hintIdle: "Սեղմեք կոճակը՝ դուռը բարձրացնելու կամ իջեցնելու համար",
  hintOpening: "Դուռը բարձրանում է",
  hintClosing: "Դուռը իջնում է",
  hintStopped: "Շարժումը կանգնեցվեց",
  commandSent: "Հրամանն ուղարկվեց",
  saved: "Պահպանվեց",
  wifiSaved: "Wi‑Fi-ը պահպանվեց, սարքը վերագործարկվում է",
  error: "Չհաջողվեց կապվել ESP32-ի հետ",
};

const connectionPill = document.getElementById("connectionPill");
const connectionLabel = document.getElementById("connectionLabel");
const gateCard = document.querySelector(".gate-card");
const gateStateLabel = document.getElementById("gateStateLabel");
const gateHint = document.getElementById("gateHint");
const openBtn = document.getElementById("openBtn");
const closeBtn = document.getElementById("closeBtn");
const stopBtn = document.getElementById("stopBtn");
const toast = document.getElementById("toast");
const settingsSheet = document.getElementById("settingsSheet");
const settingsBtn = document.getElementById("settingsBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const espUrlInput = document.getElementById("espUrl");
const wifiSsidInput = document.getElementById("wifiSsid");
const wifiPassInput = document.getElementById("wifiPass");

let busy = false;
let toastTimer;

function getBaseUrl() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return saved.replace(/\/$/, "");
  return "";
}

function apiUrl(path) {
  return `${getBaseUrl()}${path}`;
}

function showToast(message) {
  toast.hidden = false;
  toast.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function setConnection(state, extra = "") {
  connectionPill.dataset.state = state;
  connectionLabel.textContent = extra ? `${labels[state]} · ${extra}` : labels[state];
}

function setGateState(state) {
  const normalized = labels[state] ? state : "unknown";
  gateCard.dataset.state = normalized === "unknown" ? "closed" : normalized;
  gateStateLabel.textContent = labels[normalized];

  if (normalized === "opening") gateHint.textContent = labels.hintOpening;
  else if (normalized === "closing") gateHint.textContent = labels.hintClosing;
  else if (normalized === "stopped") gateHint.textContent = labels.hintStopped;
  else gateHint.textContent = labels.hintIdle;

  openBtn.disabled = busy;
  closeBtn.disabled = busy;
  stopBtn.disabled = busy;
}

function buzz() {
  if (navigator.vibrate) navigator.vibrate(18);
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(apiUrl(path), {
      cache: "no-store",
      signal: controller.signal,
      ...options,
    });
    if (!response.ok) throw new Error("bad status");
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return response.json();
    return { ok: true };
  } finally {
    clearTimeout(timer);
  }
}

async function refreshStatus() {
  try {
    const data = await request("/api/status");
    setConnection("online", data.ip || "");
    setGateState(data.state || "unknown");
    if (data.ssid && !wifiSsidInput.value) wifiSsidInput.value = data.ssid;
  } catch {
    setConnection("offline");
    setGateState("unknown");
  }
}

async function sendCommand(path, optimisticState) {
  if (busy) return;
  busy = true;
  buzz();
  setGateState(optimisticState);
  try {
    await request(path, { method: "POST" });
    showToast(labels.commandSent);
  } catch {
    showToast(labels.error);
  } finally {
    busy = false;
    await refreshStatus();
  }
}

openBtn.addEventListener("click", () => sendCommand("/api/open", "opening"));
closeBtn.addEventListener("click", () => sendCommand("/api/close", "closing"));
stopBtn.addEventListener("click", () => sendCommand("/api/stop", "stopped"));

settingsBtn.addEventListener("click", () => {
  espUrlInput.value = localStorage.getItem(STORAGE_KEY) || "";
  settingsSheet.hidden = false;
});

settingsSheet.addEventListener("click", (event) => {
  if (event.target.dataset.closeSheet !== undefined) {
    settingsSheet.hidden = true;
  }
});

saveSettingsBtn.addEventListener("click", async () => {
  const value = espUrlInput.value.trim().replace(/\/$/, "");
  if (value) localStorage.setItem(STORAGE_KEY, value);
  else localStorage.removeItem(STORAGE_KEY);

  const ssid = wifiSsidInput.value.trim();
  const pass = wifiPassInput.value;
  if (ssid) {
    try {
      await request("/api/wifi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid, password: pass }),
      });
      showToast(labels.wifiSaved);
    } catch {
      showToast(labels.saved);
    }
  } else {
    showToast(labels.saved);
  }

  settingsSheet.hidden = true;
  refreshStatus();
});

setGateState("unknown");
setConnection("waiting");
refreshStatus();
setInterval(refreshStatus, 2500);

</script>
  </body>
</html>
)====";

const char APP_CSS[] PROGMEM = R"====(:root {
  --bg: #0b0c0f;
  --bg-elevated: #15171c;
  --ink: #f4efe6;
  --muted: #b7b0a4;
  --line: rgba(244, 239, 230, 0.12);
  --gold: #d4a574;
  --gold-strong: #e8c49a;
  --danger: #e07a6a;
  --ok: #7dcaa4;
  --waiting: #c9b06a;
  --shadow: 0 18px 50px rgba(0, 0, 0, 0.38);
  --radius: 28px;
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--bg);
  color: var(--ink);
  font-family: "Noto Sans Armenian", "Segoe UI", sans-serif;
  overscroll-behavior: none;
}

body {
  min-height: 100dvh;
  user-select: none;
}

button,
input {
  font: inherit;
}

button {
  touch-action: manipulation;
  cursor: pointer;
}

.app {
  min-height: 100dvh;
  padding: calc(14px + var(--safe-top)) 20px calc(24px + var(--safe-bottom));
  max-width: 480px;
  margin: 0 auto;
  background:
    radial-gradient(120% 70% at 50% -10%, rgba(212, 165, 116, 0.16), transparent 55%),
    radial-gradient(90% 50% at 100% 100%, rgba(125, 202, 164, 0.06), transparent 50%),
    var(--bg);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.92rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--waiting);
  box-shadow: 0 0 0 4px rgba(201, 176, 106, 0.15);
}

.status-pill[data-state="online"] {
  color: #d7efe4;
}

.status-pill[data-state="online"] .status-dot {
  background: var(--ok);
  box-shadow: 0 0 0 4px rgba(125, 202, 164, 0.16);
}

.status-pill[data-state="offline"] {
  color: #f3d2cc;
}

.status-pill[data-state="offline"] .status-dot {
  background: var(--danger);
  box-shadow: 0 0 0 4px rgba(224, 122, 106, 0.16);
}

.icon-btn {
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--ink);
  display: grid;
  place-items: center;
  padding: 0;
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.icon-btn:active,
.action:active,
.stop-btn:active,
.save-btn:active {
  transform: scale(0.98);
}

.stage {
  margin-top: 28px;
  text-align: center;
}

.kicker {
  margin: 0;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.72rem;
  color: var(--gold);
}

h1 {
  margin: 6px 0 22px;
  font-size: clamp(2.1rem, 8vw, 2.7rem);
  font-weight: 700;
  letter-spacing: -0.03em;
}

.gate-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--bg-elevated);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  padding: 8px 8px 22px;
}

.sky {
  position: absolute;
  inset: 0 0 42%;
  background: linear-gradient(180deg, #1d2430 0%, #15171c 100%);
  pointer-events: none;
}

.gate-art {
  position: relative;
  width: 100%;
  height: auto;
  display: block;
}

.curtain {
  transform-box: fill-box;
  transform-origin: top center;
  transition: transform 2.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.gate-card[data-state="open"] .curtain,
.gate-card[data-state="opening"] .curtain {
  transform: translateY(-6px) scaleY(0.14);
}

.gate-card[data-state="opening"] .curtain,
.gate-card[data-state="closing"] .curtain {
  transition-duration: 2.6s;
}

.gate-card[data-state="open"] .sky,
.gate-card[data-state="opening"] .sky {
  background: linear-gradient(180deg, #2a2418 0%, #15171c 100%);
}

.gate-state {
  margin: 4px 0 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.gate-hint {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.95rem;
}

.actions {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action {
  min-height: 92px;
  border: 0;
  border-radius: 24px;
  color: #1a140e;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 1.12rem;
  font-weight: 700;
  box-shadow: var(--shadow);
}

.action.open {
  background: linear-gradient(180deg, var(--gold-strong), var(--gold));
}

.action.close {
  color: var(--ink);
  background: #1d2027;
  border: 1px solid var(--line);
}

.action:disabled,
.stop-btn:disabled {
  opacity: 0.45;
}

.action-icon svg {
  width: 26px;
  height: 26px;
}

.stop-btn {
  width: 100%;
  margin-top: 12px;
  min-height: 56px;
  border-radius: 18px;
  border: 1px solid rgba(224, 122, 106, 0.35);
  background: rgba(224, 122, 106, 0.1);
  color: #f0c2ba;
  font-weight: 600;
}

.toast {
  position: fixed;
  left: 20px;
  right: 20px;
  bottom: calc(18px + var(--safe-bottom));
  max-width: 440px;
  margin: 0 auto;
  padding: 14px 16px;
  border-radius: 16px;
  background: #23262e;
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  text-align: center;
}

.sheet[hidden],
.toast[hidden] {
  display: none;
}

.sheet {
  position: fixed;
  inset: 0;
  z-index: 20;
}

.sheet-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
}

.sheet-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 20px calc(24px + var(--safe-bottom));
  border-radius: 28px 28px 0 0;
  background: #16181d;
  border-top: 1px solid var(--line);
  max-height: 85dvh;
  overflow: auto;
}

.sheet-handle {
  width: 42px;
  height: 4px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.18);
  margin: 6px auto 16px;
}

.sheet h2 {
  margin: 0 0 16px;
  font-size: 1.3rem;
}

label {
  display: block;
  text-align: left;
  margin: 14px 0 8px;
  color: var(--muted);
}

input {
  width: 100%;
  min-height: 52px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: #101217;
  color: var(--ink);
  padding: 0 14px;
  user-select: text;
}

.help {
  text-align: left;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.45;
}

.save-btn {
  width: 100%;
  min-height: 54px;
  border: 0;
  border-radius: 16px;
  background: var(--gold);
  color: #1a140e;
  font-weight: 700;
}

@media (min-width: 720px) {
  .app {
    padding-top: 36px;
  }
}

@media (orientation: landscape) and (max-height: 520px) {
  .app {
    padding-top: calc(8px + var(--safe-top));
  }

  .stage {
    margin-top: 10px;
  }

  h1 {
    margin-bottom: 10px;
    font-size: 1.6rem;
  }

  .gate-art {
    max-height: 120px;
    margin: 0 auto;
  }

  .action {
    min-height: 68px;
    flex-direction: row;
    font-size: 1.05rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .leaf,
  .curtain,
  .icon-btn,
  .action,
  .stop-btn,
  .save-btn {
    transition: none;
    transform: none;
  }
}
)====";

const char APP_JS[] PROGMEM = R"====(const STORAGE_KEY = "homegate.espUrl";

const labels = {
  waiting: "Սպասում է…",
  online: "Միացված է",
  offline: "Անջատված է",
  unknown: "Կարգավիճակը ստուգվում է",
  open: "Բաց է",
  closed: "Փակ է",
  opening: "Բարձրանում է…",
  closing: "Իջնում է…",
  stopped: "Կանգնեցված է",
  hintIdle: "Սեղմեք կոճակը՝ դուռը բարձրացնելու կամ իջեցնելու համար",
  hintOpening: "Դուռը բարձրանում է",
  hintClosing: "Դուռը իջնում է",
  hintStopped: "Շարժումը կանգնեցվեց",
  commandSent: "Հրամանն ուղարկվեց",
  saved: "Պահպանվեց",
  wifiSaved: "Wi‑Fi-ը պահպանվեց, սարքը վերագործարկվում է",
  error: "Չհաջողվեց կապվել ESP32-ի հետ",
};

const connectionPill = document.getElementById("connectionPill");
const connectionLabel = document.getElementById("connectionLabel");
const gateCard = document.querySelector(".gate-card");
const gateStateLabel = document.getElementById("gateStateLabel");
const gateHint = document.getElementById("gateHint");
const openBtn = document.getElementById("openBtn");
const closeBtn = document.getElementById("closeBtn");
const stopBtn = document.getElementById("stopBtn");
const toast = document.getElementById("toast");
const settingsSheet = document.getElementById("settingsSheet");
const settingsBtn = document.getElementById("settingsBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const espUrlInput = document.getElementById("espUrl");
const wifiSsidInput = document.getElementById("wifiSsid");
const wifiPassInput = document.getElementById("wifiPass");

let busy = false;
let toastTimer;

function getBaseUrl() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return saved.replace(/\/$/, "");
  return "";
}

function apiUrl(path) {
  return `${getBaseUrl()}${path}`;
}

function showToast(message) {
  toast.hidden = false;
  toast.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function setConnection(state, extra = "") {
  connectionPill.dataset.state = state;
  connectionLabel.textContent = extra ? `${labels[state]} · ${extra}` : labels[state];
}

function setGateState(state) {
  const normalized = labels[state] ? state : "unknown";
  gateCard.dataset.state = normalized === "unknown" ? "closed" : normalized;
  gateStateLabel.textContent = labels[normalized];

  if (normalized === "opening") gateHint.textContent = labels.hintOpening;
  else if (normalized === "closing") gateHint.textContent = labels.hintClosing;
  else if (normalized === "stopped") gateHint.textContent = labels.hintStopped;
  else gateHint.textContent = labels.hintIdle;

  openBtn.disabled = busy;
  closeBtn.disabled = busy;
  stopBtn.disabled = busy;
}

function buzz() {
  if (navigator.vibrate) navigator.vibrate(18);
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(apiUrl(path), {
      cache: "no-store",
      signal: controller.signal,
      ...options,
    });
    if (!response.ok) throw new Error("bad status");
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return response.json();
    return { ok: true };
  } finally {
    clearTimeout(timer);
  }
}

async function refreshStatus() {
  try {
    const data = await request("/api/status");
    setConnection("online", data.ip || "");
    setGateState(data.state || "unknown");
    if (data.ssid && !wifiSsidInput.value) wifiSsidInput.value = data.ssid;
  } catch {
    setConnection("offline");
    setGateState("unknown");
  }
}

async function sendCommand(path, optimisticState) {
  if (busy) return;
  busy = true;
  buzz();
  setGateState(optimisticState);
  try {
    await request(path, { method: "POST" });
    showToast(labels.commandSent);
  } catch {
    showToast(labels.error);
  } finally {
    busy = false;
    await refreshStatus();
  }
}

openBtn.addEventListener("click", () => sendCommand("/api/open", "opening"));
closeBtn.addEventListener("click", () => sendCommand("/api/close", "closing"));
stopBtn.addEventListener("click", () => sendCommand("/api/stop", "stopped"));

settingsBtn.addEventListener("click", () => {
  espUrlInput.value = localStorage.getItem(STORAGE_KEY) || "";
  settingsSheet.hidden = false;
});

settingsSheet.addEventListener("click", (event) => {
  if (event.target.dataset.closeSheet !== undefined) {
    settingsSheet.hidden = true;
  }
});

saveSettingsBtn.addEventListener("click", async () => {
  const value = espUrlInput.value.trim().replace(/\/$/, "");
  if (value) localStorage.setItem(STORAGE_KEY, value);
  else localStorage.removeItem(STORAGE_KEY);

  const ssid = wifiSsidInput.value.trim();
  const pass = wifiPassInput.value;
  if (ssid) {
    try {
      await request("/api/wifi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid, password: pass }),
      });
      showToast(labels.wifiSaved);
    } catch {
      showToast(labels.saved);
    }
  } else {
    showToast(labels.saved);
  }

  settingsSheet.hidden = true;
  refreshStatus();
});

setGateState("unknown");
setConnection("waiting");
refreshStatus();
setInterval(refreshStatus, 2500);
)====";

const char APP_MANIFEST[] PROGMEM = R"====({
  "name": "Տան դուռ",
  "short_name": "Դուռ",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#0b0c0f",
  "theme_color": "#0b0c0f",
  "lang": "hy",
  "icons": [
    {
      "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23111114'/%3E%3Cpath d='M12 48V20l20-10 20 10v28H12z' fill='none' stroke='%23d4a574' stroke-width='3'/%3E%3Cpath d='M32 22v26' stroke='%23d4a574' stroke-width='3'/%3E%3C/svg%3E",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
)====";

