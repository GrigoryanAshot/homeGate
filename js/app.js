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
