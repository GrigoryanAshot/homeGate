/*
  HomeGate — ESP32-C3 Super Mini
  1) Wi‑Fi from phone (SoftAP portal → NVS)  [step 4]
  2) Register DEVICE_ID + DEVICE_SECRET → API (FREE until claimed)  [step 3]
  3) MQTT HiveMQ — OPEN / CLOSE / STOP

  Library: PubSubClient (Nick O'Leary)
  Board: ESP32C3 Dev Module · USB CDC On Boot: Enabled

  Setup: join Wi‑Fi "TouchGate-XXXX" → open http://192.168.4.1
  Reset Wi‑Fi: hold BOOT ~3.5s
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <ctype.h>
#include <time.h>
#include "config.h"
#include "wifi_provision.h"

WiFiClientSecure mqttTls;
PubSubClient mqtt(mqttTls);

String doorState = "closed";
int lastAction = 0;  // 0=up 1=down
unsigned long moveAt = 0;
unsigned long lastReconnectAttempt = 0;
unsigned long lastStatusMs = 0;
unsigned long lastRegisterAttempt = 0;
bool cloudRegistered = false;

// Non-blocking opto pulse (never delay() in MQTT path)
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

/** Start a short button press; returns immediately so STOP can interrupt. */
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
  char payload[220];
  snprintf(
    payload,
    sizeof(payload),
    "{\"state\":\"%s\",\"online\":true,\"registered\":%s,\"deviceId\":\"%s\",\"ip\":\"%s\"}",
    doorState.c_str(),
    cloudRegistered ? "true" : "false",
    DEVICE_ID,
    WiFi.localIP().toString().c_str()
  );
  mqtt.publish(TOPIC_STATUS, payload, true);
}

bool registerWithCloud() {
#if !ENABLE_CLOUD_REGISTER
  return false;
#else
  if (WiFi.status() != WL_CONNECTED) return false;

  String url = String(API_BASE_URL) + "/api/devices/register";
  Serial.print("Cloud register → ");
  Serial.println(url);

  HTTPClient http;
  http.setConnectTimeout(2000);
  http.setTimeout(3000);

  bool began = false;
  WiFiClientSecure httpsClient;
  WiFiClient httpClient;

  if (url.startsWith("https://")) {
    httpsClient.setInsecure();
    httpsClient.setHandshakeTimeout(5);
    began = http.begin(httpsClient, url);
  } else {
    began = http.begin(httpClient, url);
  }

  if (!began) {
    Serial.println("HTTP begin failed");
    return false;
  }

  http.addHeader("Content-Type", "application/json");

  char body[192];
  snprintf(
    body,
    sizeof(body),
    "{\"deviceId\":\"%s\",\"secret\":\"%s\"}",
    DEVICE_ID,
    DEVICE_SECRET
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
    Serial.println("Registered in DB");
    return true;
  }

  Serial.println("Register failed — will retry");
  return false;
#endif
}

void ensureRegistered() {
#if !ENABLE_CLOUD_REGISTER
  return;
#else
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

  // Instant remote: pulse now, publish status later in loop (no blocking)
  if (cmd == "OPEN" || cmd == "UP" || cmd.startsWith("OPEN")) {
    doOpen();
  } else if (cmd == "CLOSE" || cmd == "DOWN" || cmd.startsWith("CLOSE")) {
    doClose();
  } else if (cmd == "STOP" || cmd.startsWith("STOP")) {
    doStop();
  } else if (
    cmd == "WIFI_RESET" || cmd == "WIFI_SETUP" || cmd.startsWith("WIFI_RESET")
  ) {
    // App / MQTT: wipe saved Wi‑Fi → reboot into SoftAP pick-network portal
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

#if ENABLE_CLOUD_REGISTER
  lastRegisterAttempt = millis();
  registerWithCloud();
#endif
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

bool connectMqtt() {
  Serial.print("MQTT connect ");
  Serial.println(MQTT_HOST);

  IPAddress ip;
  if (!WiFi.hostByName(MQTT_HOST, ip)) {
    Serial.println("DNS failed");
    return false;
  }
  Serial.print("DNS OK -> ");
  Serial.println(ip);

  mqttTls.stop();
  delay(200);

  mqttTls.setInsecure();
  mqttTls.setHandshakeTimeout(30);
  mqttTls.setTimeout(30);

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(45);
  mqtt.setSocketTimeout(30);

  String clientId =
    String(MQTT_CLIENT_ID) + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  Serial.print("DeviceId: ");
  Serial.println(DEVICE_ID);
  Serial.print("ClientId: ");
  Serial.println(clientId);
  Serial.flush();

  const bool ok = mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS);
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
  Serial.println("MQTT connected + subscribed " TOPIC_COMMAND);
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
  Serial.println("HomeGate ESP32-C3 — MQTT remote (S3-style, no blocking HTTP)");
  Serial.println("Opto: UP=GPIO3 DOWN=GPIO5 STOP=GPIO10");
  Serial.print("Device: ");
  Serial.println(DEVICE_ID);
#if ENABLE_CLOUD_REGISTER
  Serial.print("API: ");
  Serial.println(API_BASE_URL);
#else
  Serial.println("Cloud register: OFF (fast MQTT)");
#endif
  Serial.println("Wi-Fi: SoftAP · hold BOOT to reset Wi-Fi");

  connectWifi();
  connectMqtt();
}

void loop() {
  // MQTT first — same priority as old S3 firmware
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
