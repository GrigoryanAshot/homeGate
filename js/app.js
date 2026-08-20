const STORE = {
  host: "homegate.mqtt.host",
  user: "homegate.mqtt.user",
  pass: "homegate.mqtt.pass",
};

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
  error: "MQTT սխալ",
  needConfig: "Լրացրեք MQTT կարգավորումները",
};

const defaults = window.HOMEGATE_MQTT || {};
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
const mqttHostInput = document.getElementById("mqttHost");
const mqttUserInput = document.getElementById("mqttUser");
const mqttPassInput = document.getElementById("mqttPass");

let client = null;
let busy = false;
let toastTimer;

function cfg() {
  return {
    host: localStorage.getItem(STORE.host) || defaults.host || "",
    username: localStorage.getItem(STORE.user) || defaults.username || "",
    password: localStorage.getItem(STORE.pass) || defaults.password || "",
    port: defaults.port || 8884,
    path: defaults.path || "/mqtt",
    topicCommand: defaults.topicCommand || "home/gate/command",
    topicStatus: defaults.topicStatus || "home/gate/status",
  };
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

function publishCommand(command, optimisticState) {
  if (!client || !client.connected) {
    showToast(labels.offline);
    return;
  }
  busy = true;
  buzz();
  setGateState(optimisticState);
  const { topicCommand } = cfg();
  client.publish(topicCommand, command, { qos: 1 }, (err) => {
    busy = false;
    if (err) showToast(labels.error);
    else showToast(labels.commandSent);
    setGateState(optimisticState);
  });
}

function disconnectMqtt() {
  if (client) {
    try {
      client.end(true);
    } catch (_) {}
    client = null;
  }
}

function connectMqtt() {
  const c = cfg();
  if (!c.host || !c.username) {
    setConnection("offline");
    showToast(labels.needConfig);
    settingsSheet.hidden = false;
    return;
  }

  disconnectMqtt();
  setConnection("waiting");

  // HiveMQ Cloud Secure WebSockets
  const url = `wss://${c.host}:${c.port}${c.path}`;
  client = mqtt.connect(url, {
    username: c.username,
    password: c.password,
    clientId: "homegate-web-" + Math.random().toString(16).slice(2, 10),
    clean: true,
    reconnectPeriod: 3000,
    connectTimeout: 15000,
  });

  client.on("connect", () => {
    setConnection("online", "MQTT");
    client.subscribe(c.topicStatus, { qos: 1 });
  });

  client.on("reconnect", () => setConnection("waiting"));
  client.on("close", () => setConnection("offline"));
  client.on("error", () => {
    setConnection("offline");
    showToast(labels.error);
  });

  client.on("message", (topic, payload) => {
    if (topic !== c.topicStatus) return;
    try {
      const data = JSON.parse(payload.toString());
      if (data.state) setGateState(data.state);
      if (data.online === false) setConnection("offline");
      else setConnection("online", "MQTT");
    } catch (_) {}
  });
}

openBtn.addEventListener("click", () => publishCommand("OPEN", "opening"));
closeBtn.addEventListener("click", () => publishCommand("CLOSE", "closing"));
stopBtn.addEventListener("click", () => publishCommand("STOP", "stopped"));

settingsBtn.addEventListener("click", () => {
  const c = cfg();
  mqttHostInput.value = c.host;
  mqttUserInput.value = c.username;
  mqttPassInput.value = c.password;
  settingsSheet.hidden = false;
});

settingsSheet.addEventListener("click", (event) => {
  if (event.target.dataset.closeSheet !== undefined) settingsSheet.hidden = true;
});

saveSettingsBtn.addEventListener("click", () => {
  localStorage.setItem(STORE.host, mqttHostInput.value.trim());
  localStorage.setItem(STORE.user, mqttUserInput.value.trim());
  localStorage.setItem(STORE.pass, mqttPassInput.value);
  settingsSheet.hidden = true;
  showToast(labels.saved);
  connectMqtt();
});

setGateState("unknown");
setConnection("waiting");
connectMqtt();
