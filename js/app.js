const STORAGE_KEY = "homegate.espUrl";
const KEY_STORAGE = "homegate.appKey";

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
  badPass: "Սխալ գաղտնաբառ",
  needPass: "Մուտքագրեք գաղտնաբառը",
  needEsp: "Գրեք ESP32 հասցեն կարգավորումներում",
};

const lockScreen = document.getElementById("lockScreen");
const appRoot = document.getElementById("appRoot");
const appPass = document.getElementById("appPass");
const unlockBtn = document.getElementById("unlockBtn");
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
const appKeyInput = document.getElementById("appKeyInput");
const wifiSsidInput = document.getElementById("wifiSsid");
const wifiPassInput = document.getElementById("wifiPass");

let busy = false;
let toastTimer;
let unlocked = false;

function getBaseUrl() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return saved.replace(/\/$/, "");
  // Same host as the page (ESP32-served UI)
  if (location.protocol.startsWith("http") && !location.hostname.includes("vercel")) {
    return "";
  }
  return "";
}

function getAppKey() {
  return sessionStorage.getItem(KEY_STORAGE) || localStorage.getItem(KEY_STORAGE) || "";
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
  const headers = {
    "X-Gate-Key": getAppKey(),
    ...(options.headers || {}),
  };
  try {
    const response = await fetch(apiUrl(path), {
      cache: "no-store",
      signal: controller.signal,
      ...options,
      headers,
    });
    if (response.status === 401) {
      const err = new Error("unauthorized");
      err.code = 401;
      throw err;
    }
    if (!response.ok) throw new Error("bad status");
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return response.json();
    return { ok: true };
  } finally {
    clearTimeout(timer);
  }
}

async function refreshStatus() {
  if (!unlocked) return;
  try {
    const data = await request("/api/status");
    setConnection("online", data.ip || "");
    setGateState(data.state || "unknown");
    if (data.ssid && !wifiSsidInput.value) wifiSsidInput.value = data.ssid;
  } catch (err) {
    if (err && err.code === 401) {
      showToast(labels.badPass);
      lockApp();
      return;
    }
    setConnection("offline");
    setGateState("unknown");
  }
}

async function sendCommand(path, optimisticState) {
  if (busy || !unlocked) return;
  if (!getBaseUrl() && location.hostname.includes("vercel")) {
    showToast(labels.needEsp);
    return;
  }
  busy = true;
  buzz();
  setGateState(optimisticState);
  try {
    await request(path, { method: "POST" });
    showToast(labels.commandSent);
  } catch (err) {
    showToast(err && err.code === 401 ? labels.badPass : labels.error);
  } finally {
    busy = false;
    await refreshStatus();
  }
}

function lockApp() {
  unlocked = false;
  sessionStorage.removeItem(KEY_STORAGE);
  appRoot.hidden = true;
  lockScreen.hidden = false;
  appPass.value = "";
  appPass.focus();
}

function unlockApp(key) {
  sessionStorage.setItem(KEY_STORAGE, key);
  localStorage.setItem(KEY_STORAGE, key);
  unlocked = true;
  lockScreen.hidden = true;
  appRoot.hidden = false;
  refreshStatus();
}

async function tryUnlock() {
  const key = appPass.value.trim();
  if (!key) {
    showToast(labels.needPass);
    return;
  }
  sessionStorage.setItem(KEY_STORAGE, key);
  localStorage.setItem(KEY_STORAGE, key);
  try {
    await request("/api/status");
    unlockApp(key);
  } catch (err) {
    sessionStorage.removeItem(KEY_STORAGE);
    if (err && err.code === 401) showToast(labels.badPass);
    else {
      // ESP offline or Vercel without ESP URL yet — still unlock UI so settings work
      unlockApp(key);
      if (location.hostname.includes("vercel") && !localStorage.getItem(STORAGE_KEY)) {
        showToast(labels.needEsp);
        settingsSheet.hidden = false;
      } else {
        showToast(labels.error);
      }
    }
  }
}

unlockBtn.addEventListener("click", tryUnlock);
appPass.addEventListener("keydown", (e) => {
  if (e.key === "Enter") tryUnlock();
});

openBtn.addEventListener("click", () => sendCommand("/api/open", "opening"));
closeBtn.addEventListener("click", () => sendCommand("/api/close", "closing"));
stopBtn.addEventListener("click", () => sendCommand("/api/stop", "stopped"));

settingsBtn.addEventListener("click", () => {
  espUrlInput.value = localStorage.getItem(STORAGE_KEY) || "";
  appKeyInput.value = getAppKey();
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

  const key = appKeyInput.value.trim();
  if (key) {
    sessionStorage.setItem(KEY_STORAGE, key);
    localStorage.setItem(KEY_STORAGE, key);
  }

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

const existing = getAppKey();
if (existing) {
  appPass.value = existing;
  tryUnlock();
} else {
  appPass.focus();
}

setInterval(refreshStatus, 2500);
