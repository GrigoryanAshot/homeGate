/*
  HomeGate — ESP32-C3 Super Mini (universal production firmware)
  1) SoftAP: home Wi‑Fi only (big simple page)
  2) Chip hello → wait for owner to claim sticker QR in the app
  3) MQTT per product: home/gate/{productId}/command|status

  Library: PubSubClient (Nick O'Leary)
  Board: ESP32C3 Dev Module · USB CDC On Boot: Enabled
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <ctype.h>
#include <time.h>
#include "config.h"
#include "device_identity.h"
#include "wifi_provision.h"

WiFiClientSecure mqttTls;
PubSubClient mqtt(mqttTls);

String doorState = "closed";
int lastAction = 0;
unsigned long moveAt = 0;
unsigned long lastReconnectAttempt = 0;
unsigned long lastStatusMs = 0;
unsigned long lastRegisterAttempt = 0;
unsigned long lastChipPollAttempt = 0;
bool cloudRegistered = false;

int activePulsePin = -1;
unsigned long pulseEndMs = 0;
bool statusDirty = false;

void setStatusLed(bool on) {
#if STATUS_LED_ACTIVE_LOW
  digitalWrite(STATUS_LED_PIN, on ? LOW : HIGH);
#else
  digitalWrite(STATUS_LED_PIN, on ? HIGH : LOW);
#endif
}

void blinkStatusLed(int times, int onMs = 80, int offMs = 80) {
  for (int i = 0; i < times; i++) {
    setStatusLed(true);
    delay(onMs);
    setStatusLed(false);
    delay(offMs);
  }
}

void allOptoOff() {
  digitalWrite(PIN_UP, LOW);
  digitalWrite(PIN_DOWN, LOW);
  digitalWrite(PIN_STOP, LOW);
  activePulsePin = -1;
}

void startPulse(int pin) {
  allOptoOff();
  digitalWrite(pin, HIGH);
  activePulsePin = pin;
  pulseEndMs = millis() + PULSE_MS;
}

void pollPulse() {
  if (activePulsePin < 0) return;
  if ((long)(millis() - pulseEndMs) < 0) return;
  digitalWrite(activePulsePin, LOW);
  activePulsePin = -1;
}

void doOpen() {
  lastAction = 0;
  startPulse(PIN_UP);
  doorState = "opening";
  moveAt = millis();
  statusDirty = true;
}

void doClose() {
  lastAction = 1;
  startPulse(PIN_DOWN);
  doorState = "closing";
  moveAt = millis();
  statusDirty = true;
}

void doStop() {
  startPulse(PIN_STOP);
  doorState = "stopped";
  statusDirty = true;
}

void pollStopButton() {
#if PIN_STOP_BTN >= 0
  static int lastStable = HIGH;
  static int lastRead = HIGH;
  static unsigned long lastChangeMs = 0;

  const int raw = digitalRead(PIN_STOP_BTN);
  if (raw != lastRead) {
    lastChangeMs = millis();
    lastRead = raw;
  }
  if (millis() - lastChangeMs < STOP_BTN_DEBOUNCE_MS) return;

  if (raw == lastStable) return;
  lastStable = raw;

  const bool pressed = STOP_BTN_ACTIVE_LOW ? (raw == LOW) : (raw == HIGH);
  if (!pressed) return;

  Serial.println("Physical STOP button");
  doStop();
  publishStatus();
#endif
}

bool updateMoveState() {
  if ((doorState == "opening" || doorState == "closing") &&
      millis() - moveAt >= MOVE_MS) {
    doorState = (doorState == "opening") ? "open" : "closed";
    return true;
  }
  return false;
}

void publishStatus() {
  if (!mqtt.connected()) return;
  updateMoveState();
  char payload[280];
  snprintf(
    payload,
    sizeof(payload),
    "{\"state\":\"%s\",\"online\":true,\"registered\":%s,\"deviceId\":\"%s\",\"chipId\":\"%s\",\"ip\":\"%s\"}",
    doorState.c_str(),
    cloudRegistered ? "true" : "false",
    DEVICE_PRODUCT_ID,
    DEVICE_CHIP_ID,
    WiFi.localIP().toString().c_str()
  );
  mqtt.publish(TOPIC_STATUS, payload, true);
}

bool registerWithCloud() {
#if !ENABLE_CLOUD_REGISTER
  return false;
#else
  if (WiFi.status() != WL_CONNECTED) return false;
  if (!deviceHasProduct()) return false;

  String url = String(API_BASE_URL) + "/api/devices/chip";
  Serial.print("Cloud register → ");
  Serial.println(url);

  HTTPClient http;
  http.setConnectTimeout(8000);
  http.setTimeout(12000);

  bool began = false;
  WiFiClientSecure httpsClient;
  WiFiClient httpClient;

  if (url.startsWith("https://")) {
    httpsClient.setInsecure();
    httpsClient.setHandshakeTimeout(15);
    began = http.begin(httpsClient, url);
  } else {
    began = http.begin(httpClient, url);
  }

  if (!began) {
    Serial.println("HTTP begin failed");
    return false;
  }

  http.addHeader("Content-Type", "application/json");

  char body[360];
  snprintf(
    body,
    sizeof(body),
    "{\"chipId\":\"%s\",\"deviceId\":\"%s\",\"secret\":\"%s\"}",
    DEVICE_CHIP_ID,
    DEVICE_PRODUCT_ID,
    DEVICE_PRODUCT_SECRET
  );

  const int code = http.POST(body);
  const String resp = http.getString();
  http.end();

  Serial.print("Register HTTP ");
  Serial.print(code);
  Serial.print(" ");
  Serial.println(resp);

  if (code == 200 && resp.indexOf("\"ok\":true") >= 0) {
    cloudRegistered = true;
    Serial.println("Registered / refreshed in DB");
    return true;
  }

  if (code == 404) {
    Serial.println("Product not in factory DB — seed sticker ID first");
  }

  Serial.println("Register failed — will retry");
  return false;
#endif
}

/** SoftAP is Wi‑Fi only — poll cloud until app claim assigns this chip a product. */
bool pollProductFromCloud() {
#if !ENABLE_CLOUD_REGISTER
  return deviceHasProduct();
#else
  if (deviceHasProduct()) return true;
  if (WiFi.status() != WL_CONNECTED) return false;

  const unsigned long now = millis();
  if (now - lastChipPollAttempt < 8000 && lastChipPollAttempt != 0) {
    return false;
  }
  lastChipPollAttempt = now;

  // Mark chip online (waiting)
  {
    String url = String(API_BASE_URL) + "/api/devices/chip";
    HTTPClient http;
    http.setConnectTimeout(6000);
    http.setTimeout(8000);
    WiFiClientSecure httpsClient;
    WiFiClient httpClient;
    bool began = false;
    if (url.startsWith("https://")) {
      httpsClient.setInsecure();
      httpsClient.setHandshakeTimeout(12);
      began = http.begin(httpsClient, url);
    } else {
      began = http.begin(httpClient, url);
    }
    if (began) {
      http.addHeader("Content-Type", "application/json");
      char body[120];
      snprintf(body, sizeof(body), "{\"chipId\":\"%s\"}", DEVICE_CHIP_ID);
      http.POST(body);
      http.end();
    }
  }

  // Poll for product assignment
  String url = String(API_BASE_URL) + "/api/devices/chip?chipId=" +
               String(DEVICE_CHIP_ID);
  Serial.print("Chip poll → ");
  Serial.println(url);

  HTTPClient http;
  http.setConnectTimeout(6000);
  http.setTimeout(8000);
  WiFiClientSecure httpsClient;
  WiFiClient httpClient;
  bool began = false;
  if (url.startsWith("https://")) {
    httpsClient.setInsecure();
    httpsClient.setHandshakeTimeout(12);
    began = http.begin(httpsClient, url);
  } else {
    began = http.begin(httpClient, url);
  }
  if (!began) return false;

  const int code = http.GET();
  const String resp = http.getString();
  http.end();

  Serial.print("Chip poll HTTP ");
  Serial.print(code);
  Serial.print(" ");
  Serial.println(resp);

  if (code != 200 || resp.indexOf("\"waiting\":true") >= 0) {
    Serial.println("Waiting for owner to Add gate (scan QR) in the app…");
    return false;
  }

  // crude parse: "productId":"..."
  int pKey = resp.indexOf("\"productId\":\"");
  int sKey = resp.indexOf("\"secret\":\"");
  if (pKey < 0) return false;
  pKey += 13;
  int pEnd = resp.indexOf('"', pKey);
  if (pEnd < 0) return false;
  String productId = resp.substring(pKey, pEnd);

  String secret = "";
  if (sKey >= 0) {
    sKey += 10;
    int sEnd = resp.indexOf('"', sKey);
    if (sEnd > sKey) secret = resp.substring(sKey, sEnd);
  }

  if (productId.length() == 0) return false;

  deviceSaveProduct(productId, secret.length() > 0 ? secret : String("bound"));
  Serial.print("Product assigned from cloud: ");
  Serial.println(productId);
  cloudRegistered = false;
  blinkStatusLed(3, 100, 80);
  return true;
#endif
}

void ensureRegistered() {
#if !ENABLE_CLOUD_REGISTER
  return;
#else
  if (!deviceHasProduct()) {
    pollProductFromCloud();
    return;
  }
  if (cloudRegistered) return;
  const unsigned long now = millis();
  if (now - lastRegisterAttempt < REGISTER_RETRY_MS && lastRegisterAttempt != 0) {
    return;
  }
  lastRegisterAttempt = now;
  registerWithCloud();
#endif
}

String normalizeCommand(const char *raw, unsigned int len) {
  String cmd;
  cmd.reserve(len);
  for (unsigned int i = 0; i < len; i++) {
    const char c = raw[i];
    if (c == '"' || c == '\'' || c == '{' || c == '}' || c == ' ') continue;
    cmd += (char)toupper((unsigned char)c);
  }
  const int key = cmd.indexOf("CMD:");
  if (key >= 0) {
    cmd = cmd.substring(key + 4);
    int end = cmd.indexOf(',');
    if (end < 0) end = cmd.indexOf('}');
    if (end >= 0) cmd = cmd.substring(0, end);
  }
  return cmd;
}

void handleCommand(const String &cmd) {
  Serial.print("MQTT command: ");
  Serial.println(cmd);

  if (cmd == "OPEN" || cmd == "UP" || cmd.startsWith("OPEN")) {
    doOpen();
  } else if (cmd == "CLOSE" || cmd == "DOWN" || cmd.startsWith("CLOSE")) {
    doClose();
  } else if (cmd == "STOP" || cmd.startsWith("STOP")) {
    doStop();
  } else if (
    cmd == "WIFI_RESET" || cmd == "WIFI_SETUP" || cmd.startsWith("WIFI_RESET")
  ) {
    wifiFactoryResetAndReboot();
  } else {
    Serial.println("Unknown command");
  }
}

void onMqttMessage(char *topic, byte *payload, unsigned int length) {
  if (strcmp(topic, TOPIC_COMMAND) != 0) return;
  handleCommand(normalizeCommand((const char *)payload, length));
}

void syncTime() {
  Serial.println("NTP time sync...");
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  time_t now = time(nullptr);
  int tries = 0;
  while (now < 1700000000 && tries < 40) {
    delay(250);
    now = time(nullptr);
    tries++;
  }
  Serial.print("Unix time: ");
  Serial.println((unsigned long)now);
}

void connectWifi() {
  cloudRegistered = false;
  lastRegisterAttempt = 0;

  wifiEnsureConnected();

#if ENABLE_NTP_SYNC
  syncTime();
#endif

  // MQTT first (opens the gate). Cloud register is best-effort later in loop —
  // broken router DNS makes HTTPS to Vercel fail with HTTP -1.
}

const char *mqttStateText(int state) {
  switch (state) {
    case -4: return "timeout (TLS/network)";
    case -3: return "connection lost";
    case -2: return "connect failed (TLS/DNS/firewall)";
    case -1: return "disconnected";
    case 1: return "bad protocol";
    case 2: return "bad client id";
    case 3: return "broker unavailable";
    case 4: return "bad username/password";
    case 5: return "not authorized";
    default: return "unknown";
  }
}

bool resolveMqttHost(IPAddress &ip) {
  // Prefer hostname; if router DNS fails (0.0.0.0), use HiveMQ fallback IP.
  ip = IPAddress(0, 0, 0, 0);
  Serial.print("DNS ");
  Serial.print(MQTT_HOST);
  Serial.print(" → ");
  const bool ok = WiFi.hostByName(MQTT_HOST, ip);
  Serial.println(ip);
  if (ok && !(ip[0] == 0 && ip[1] == 0 && ip[2] == 0 && ip[3] == 0)) {
    return true;
  }

  Serial.print("DNS failed — using fallback IP ");
  Serial.println(MQTT_HOST_FALLBACK_IP);
  if (ip.fromString(MQTT_HOST_FALLBACK_IP)) {
    return true;
  }
  return false;
}

bool connectMqtt() {
  if (!deviceHasProduct()) {
    Serial.println("MQTT skipped — no product bound");
    return false;
  }

  Serial.print("MQTT connect ");
  Serial.println(MQTT_HOST);
  Serial.print("Topics: ");
  Serial.print(TOPIC_COMMAND);
  Serial.print(" / ");
  Serial.println(TOPIC_STATUS);

  IPAddress ip;
  if (!resolveMqttHost(ip)) {
    return false;
  }
  Serial.print("MQTT via IP ");
  Serial.println(ip);

  mqttTls.stop();
  delay(200);

  mqttTls.setInsecure();
  mqttTls.setHandshakeTimeout(30);
  mqttTls.setTimeout(30);

  // Use resolved IP — more reliable than hostname on some captive Wi‑Fi
  mqtt.setServer(ip, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(45);
  mqtt.setSocketTimeout(30);

  Serial.print("Product: ");
  Serial.println(DEVICE_PRODUCT_ID);
  Serial.print("Chip: ");
  Serial.println(DEVICE_CHIP_ID);
  Serial.print("ClientId: ");
  Serial.println(MQTT_CLIENT_ID_RUNTIME);
  Serial.flush();

  const bool ok =
    mqtt.connect(MQTT_CLIENT_ID_RUNTIME, MQTT_USER, MQTT_PASS);
  if (!ok) {
    const int st = mqtt.state();
    Serial.print("MQTT failed, state=");
    Serial.print(st);
    Serial.print(" (");
    Serial.print(mqttStateText(st));
    Serial.println(")");
    mqttTls.stop();
    blinkStatusLed(5, 60, 60);
    return false;
  }

  mqtt.subscribe(TOPIC_COMMAND, 1);
  Serial.print("MQTT connected + subscribed ");
  Serial.println(TOPIC_COMMAND);
  setStatusLed(true);
  publishStatus();
  return true;
}

void ensureMqtt() {
  if (mqtt.connected()) return;
  setStatusLed(false);
  const unsigned long now = millis();
  if (now - lastReconnectAttempt < 5000) return;
  lastReconnectAttempt = now;
  connectMqtt();
}

void setup() {
  pinMode(STATUS_LED_PIN, OUTPUT);
  setStatusLed(false);

  pinMode(PIN_UP, OUTPUT);
  pinMode(PIN_DOWN, OUTPUT);
  pinMode(PIN_STOP, OUTPUT);
  allOptoOff();

#if PIN_STOP_BTN >= 0
  pinMode(PIN_STOP_BTN, INPUT_PULLUP);
#endif
  wifiResetPinBegin();

  Serial.begin(115200);
  delay(800);
  Serial.println();
  Serial.println("HomeGate ESP32-C3 — universal production build");
  Serial.println("Opto: UP=GPIO3 DOWN=GPIO5 STOP=GPIO10");

  deviceLoadIdentity();
  Serial.print("Chip: ");
  Serial.println(DEVICE_CHIP_ID);
  Serial.print("Product: ");
  Serial.println(deviceHasProduct() ? DEVICE_PRODUCT_ID : "(none — wait for app claim)");
#if ENABLE_CLOUD_REGISTER
  Serial.print("API: ");
  Serial.println(API_BASE_URL);
#else
  Serial.println("Cloud register: OFF");
#endif

  connectWifi();
  if (deviceHasProduct()) {
    connectMqtt();
  } else {
    Serial.println("No product yet — chip will poll cloud after Wi‑Fi");
    pollProductFromCloud();
    if (deviceHasProduct()) connectMqtt();
  }
}

void loop() {
  ensureMqtt();
  mqtt.loop();

  pollPulse();
  wifiPollResetButton();
  pollStopButton();

  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    return;
  }

  ensureRegistered();
  if (deviceHasProduct() && !mqtt.connected()) {
    ensureMqtt();
  }
  mqtt.loop();

  if (updateMoveState()) {
    statusDirty = true;
  }

  if (mqtt.connected() && statusDirty) {
    statusDirty = false;
    lastStatusMs = millis();
    publishStatus();
  } else if (mqtt.connected() && millis() - lastStatusMs > 30000) {
    lastStatusMs = millis();
    publishStatus();
  }
}
