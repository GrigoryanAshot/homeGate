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
#include <WebServer.h>
#include <PubSubClient.h>
#include <ctype.h>
#include <time.h>
#include "lwip/dns.h"
#include "lwip/ip_addr.h"
#include "config.h"
#include "device_identity.h"
#include "wifi_provision.h"
#include "wifi_remote.h"
#if ENABLE_BLE_RESCUE
#include "ble_rescue.h"
#endif

/**
 * Arduino-ESP32 3.x: no setHostname(). Always connect by IP with SNI=MQTT_HOST.
 * Hostname-only connect can hang forever on some hotspots / office DNS.
 */
class HiveMqttTlsClient : public WiFiClientSecure {
public:
  static constexpr int32_t kConnectTimeoutMs = 12000;

  int connect(IPAddress ip, uint16_t port) override {
    setTimeout(kConnectTimeoutMs);
    setHandshakeTimeout(12); // API multiplies by 1000 → 12s
    return WiFiClientSecure::connect(
      ip,
      port,
      MQTT_HOST,
      (const char *)nullptr,
      (const char *)nullptr,
      (const char *)nullptr
    );
  }

  int connect(const char *host, uint16_t port) override {
    // Resolve here, then IP+SNI — avoids hanging hostname TLS path
    setTimeout(kConnectTimeoutMs);
    setHandshakeTimeout(12);
    IPAddress ip;
    if (!WiFi.hostByName(host, ip) ||
        (ip[0] == 0 && ip[1] == 0 && ip[2] == 0 && ip[3] == 0)) {
      Serial.println("TLS connect: hostByName failed");
      return 0;
    }
    Serial.print("TLS connect IP=");
    Serial.println(ip);
    return WiFiClientSecure::connect(
      ip,
      port,
      MQTT_HOST,
      (const char *)nullptr,
      (const char *)nullptr,
      (const char *)nullptr
    );
  }
};

HiveMqttTlsClient mqttTls;
PubSubClient mqtt(mqttTls);
#if ENABLE_LAN_DEBUG_HTTP
WebServer lanDebug(80);
#endif

String doorState = "closed";
int lastAction = 0;
unsigned long moveAt = 0;
unsigned long lastReconnectAttempt = 0;
unsigned long lastStatusMs = 0;
unsigned long lastRegisterAttempt = 0;
unsigned long lastChipPollAttempt = 0;
bool cloudRegistered = false;
char mqttClientIdBuf[56];

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
  // Visible confirm: LED off while opto pulse is active
  setStatusLed(false);
}

void pollPulse() {
  if (activePulsePin < 0) return;
  if ((long)(millis() - pulseEndMs) < 0) {
    // Fast blink while pulse is live (GPIO3/5/10 HIGH)
    setStatusLed((millis() / 40) % 2 == 0);
    return;
  }
  digitalWrite(activePulsePin, LOW);
  activePulsePin = -1;
  // Back to solid ON if online
  setStatusLed(WiFi.status() == WL_CONNECTED);
}

void doOpen() {
  Serial.println(">>> PULSE UP GPIO3 (OPEN) + LED blink");
  lastAction = 0;
  startPulse(PIN_UP);
  doorState = "opening";
  moveAt = millis();
  statusDirty = true;
}

void doClose() {
  Serial.println(">>> PULSE DOWN GPIO5 (CLOSE) + LED blink");
  lastAction = 1;
  startPulse(PIN_DOWN);
  doorState = "closing";
  moveAt = millis();
  statusDirty = true;
}

void doStop() {
  Serial.println(">>> PULSE STOP GPIO10 + LED blink");
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

String gPendingWifiEvent;

void publishWifiEvent(const char *json, bool retained) {
  if (mqtt.connected()) {
    mqtt.publish(TOPIC_STATUS, json, retained);
    Serial.print("MQTT wifiEvent TX ");
    Serial.println(json);
  } else {
    gPendingWifiEvent = json;
    Serial.println("MQTT down — wifiEvent queued");
  }
}

void flushPendingWifiEvent() {
  if (gPendingWifiEvent.length() == 0) return;
  if (!mqtt.connected()) return;
  mqtt.publish(TOPIC_STATUS, gPendingWifiEvent.c_str(), false);
  Serial.print("MQTT wifiEvent flush ");
  Serial.println(gPendingWifiEvent);
  gPendingWifiEvent = "";
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

  // ESP32: a second TLS client (HTTPS) often breaks the live MQTT socket.
  // PubSubClient can still report connected while commands never arrive.
  mqtt.disconnect();
  mqttTls.stop();
  lastReconnectAttempt = 0;

  Serial.print("Register HTTP ");
  Serial.print(code);
  Serial.print(" ");
  Serial.println(resp);

  if (code == 200 && resp.indexOf("\"ok\":true") >= 0) {
    cloudRegistered = true;
    Serial.println("Registered / refreshed in DB");
    Serial.println("MQTT will reconnect after HTTPS…");
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
      mqtt.disconnect();
      mqttTls.stop();
      lastReconnectAttempt = 0;
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
  mqtt.disconnect();
  mqttTls.stop();
  lastReconnectAttempt = 0;

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
  } else if (cmd == "WIFI_SCAN" || cmd.startsWith("WIFI_SCAN")) {
    wifiRemotePublishScan();
    // WiFi.scanNetworks often breaks the MQTT TLS socket on ESP32 — same as HTTPS
    Serial.println("MQTT will reconnect after WIFI_SCAN…");
    mqtt.disconnect();
    mqttTls.stop();
    lastReconnectAttempt = 0;
  } else if (
    cmd == "WIFI_RESET" || cmd == "WIFI_SETUP" || cmd.startsWith("WIFI_RESET")
  ) {
    wifiFactoryResetAndReboot();
  } else {
    Serial.println("Unknown command");
  }
}

void onMqttMessage(char *topic, byte *payload, unsigned int length) {
  Serial.print("MQTT RX topic=");
  Serial.print(topic);
  Serial.print(" expect=");
  Serial.print(TOPIC_COMMAND);
  Serial.print(" len=");
  Serial.println(length);

  const bool topicOk =
    strcmp(topic, TOPIC_COMMAND) == 0 ||
    (strstr(topic, "/command") != nullptr);
  if (!topicOk) {
    Serial.println("MQTT RX ignored (topic)");
    return;
  }

  // WIFI_SET keeps password case / special chars — handle before normalize
  if (length >= 8) {
    String head;
    for (unsigned int i = 0; i < length && i < 12; i++) {
      head += (char)payload[i];
    }
    if (head.startsWith("WIFI_SET")) {
      String ssid;
      String pass;
      if (wifiRemoteParseSetPayload((const char *)payload, length, ssid, pass)) {
        wifiRemoteApplySet(ssid, pass);
        // MQTT socket likely died during Wi‑Fi switch — reconnect next loop
        statusDirty = true;
      } else {
        publishWifiEvent(
          "{\"wifiEvent\":\"join\",\"ok\":false,\"error\":\"bad_payload\"}",
          false
        );
      }
      return;
    }
  }

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

/** Many home/office routers break DNS for IoT — force Google/Cloudflare. */
void wifiUsePublicDns() {
  ip_addr_t d1;
  ip_addr_t d2;
  IP_ADDR4(&d1, 8, 8, 8, 8);
  IP_ADDR4(&d2, 1, 1, 1, 1);
  dns_setserver(0, &d1);
  dns_setserver(1, &d2);
  Serial.println("DNS servers → 8.8.8.8 , 1.1.1.1");

  // Also set via WiFi.config when DHCP already gave us an address
  if (WiFi.status() == WL_CONNECTED) {
    WiFi.config(
      WiFi.localIP(),
      WiFi.gatewayIP(),
      WiFi.subnetMask(),
      IPAddress(8, 8, 8, 8),
      IPAddress(1, 1, 1, 1)
    );
  }
  delay(150);
}

bool resolveMqttHost(IPAddress &ip) {
  ip = IPAddress(0, 0, 0, 0);
  wifiUsePublicDns();

  Serial.print("DNS ");
  Serial.print(MQTT_HOST);
  Serial.print(" → ");
  const bool ok = WiFi.hostByName(MQTT_HOST, ip);
  Serial.println(ip);
  if (ok && !(ip[0] == 0 && ip[1] == 0 && ip[2] == 0 && ip[3] == 0)) {
    return true;
  }

  const char *fallbacks[] = {
    MQTT_HOST_FALLBACK_IP,
    MQTT_HOST_FALLBACK_IP_2,
    MQTT_HOST_FALLBACK_IP_3,
  };
  for (unsigned i = 0; i < 3; i++) {
    if (ip.fromString(fallbacks[i])) {
      Serial.print("DNS failed — fallback IP ");
      Serial.println(ip);
      return true;
    }
  }
  return false;
}

bool mqttConnectOnce(const char *label) {
  mqttTls.setInsecure();
  mqttTls.setHandshakeTimeout(12);
  mqttTls.setTimeout(12000);

  Serial.print("MQTT try ");
  Serial.println(label);
  Serial.flush();
  const bool ok = mqtt.connect(mqttClientIdBuf, MQTT_USER, MQTT_PASS);
  if (!ok) {
    Serial.print("  state=");
    Serial.println(mqtt.state());
    mqttTls.stop();
  } else {
    Serial.println("  OK");
  }
  Serial.flush();
  return ok;
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

  mqtt.disconnect();
  mqttTls.stop();
  delay(100);

  mqtt.setCallback(onMqttMessage);
  mqtt.setBufferSize(2048);
  mqtt.setKeepAlive(30);
  mqtt.setSocketTimeout(10);

  snprintf(
    mqttClientIdBuf,
    sizeof(mqttClientIdBuf),
    "%s-%04lx",
    DEVICE_CHIP_ID,
    (unsigned long)(millis() & 0xFFFF)
  );

  Serial.print("Product: ");
  Serial.println(DEVICE_PRODUCT_ID);
  Serial.print("Chip: ");
  Serial.println(DEVICE_CHIP_ID);
  Serial.print("ClientId: ");
  Serial.println(mqttClientIdBuf);
  Serial.flush();

  wifiUsePublicDns();
  delay(200);

  IPAddress resolved(0, 0, 0, 0);
  bool dnsOk = false;
  for (int attempt = 0; attempt < 2 && !dnsOk; attempt++) {
    if (attempt > 0) {
      wifiUsePublicDns();
      delay(300);
    }
    IPAddress ip;
    if (WiFi.hostByName(MQTT_HOST, ip) &&
        !(ip[0] == 0 && ip[1] == 0 && ip[2] == 0 && ip[3] == 0)) {
      resolved = ip;
      dnsOk = true;
      Serial.print("HiveMQ resolved → ");
      Serial.println(resolved);
    }
  }

  bool ok = false;

  // Always IP + SNI (never hang on hostname-only TLS)
  if (dnsOk) {
    mqttTls.stop();
    delay(50);
    mqtt.setServer(resolved, MQTT_PORT);
    ok = mqttConnectOnce("resolved-IP+SNI");
  }

  if (!ok) {
    const char *ips[] = {
      MQTT_HOST_FALLBACK_IP,
      MQTT_HOST_FALLBACK_IP_2,
      MQTT_HOST_FALLBACK_IP_3,
    };
    for (unsigned i = 0; i < 3 && !ok; i++) {
      IPAddress ip;
      if (!ip.fromString(ips[i])) continue;
      if (dnsOk && ip == resolved) continue;
      Serial.print("Fallback IP ");
      Serial.println(ip);
      mqttTls.stop();
      delay(80);
      mqtt.setServer(ip, MQTT_PORT);
      ok = mqttConnectOnce(ips[i]);
    }
  }

  if (!ok) {
    const int st = mqtt.state();
    Serial.print("MQTT failed, state=");
    Serial.print(st);
    Serial.print(" (");
    Serial.print(mqttStateText(st));
    Serial.println(")");
    Serial.println("Hotspot may block MQTT 8883 — try LAN http://IP/open");
    mqttTls.stop();
    blinkStatusLed(5, 60, 60);
    return false;
  }

  const bool sub = mqtt.subscribe(TOPIC_COMMAND, 1);
  Serial.print("MQTT connected + subscribed ");
  Serial.print(TOPIC_COMMAND);
  Serial.print(" ok=");
  Serial.println(sub ? "1" : "0");
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

#if ENABLE_LAN_DEBUG_HTTP
void setupLanDebugHttp() {
  lanDebug.on("/", []() {
    String html;
    html.reserve(320);
    html += F("<!DOCTYPE html><meta name=viewport content=\"width=device-width\">");
    html += F("<h1>HomeGate LAN</h1><p>");
    html += DEVICE_PRODUCT_ID;
    html += F("</p><p><a href=\"/open\">OPEN</a> · <a href=\"/close\">CLOSE</a> · <a href=\"/stop\">STOP</a></p>");
    html += F("<p>IP ");
    html += WiFi.localIP().toString();
    html += F("</p>");
    lanDebug.send(200, "text/html", html);
  });
  lanDebug.on("/open", []() {
    doOpen();
    lanDebug.send(200, "text/plain", "OPEN");
  });
  lanDebug.on("/close", []() {
    doClose();
    lanDebug.send(200, "text/plain", "CLOSE");
  });
  lanDebug.on("/stop", []() {
    doStop();
    lanDebug.send(200, "text/plain", "STOP");
  });
  lanDebug.on("/status", []() {
    char buf[200];
    snprintf(
      buf,
      sizeof(buf),
      "{\"state\":\"%s\",\"mqtt\":%s,\"product\":\"%s\",\"ip\":\"%s\"}",
      doorState.c_str(),
      mqtt.connected() ? "true" : "false",
      DEVICE_PRODUCT_ID,
      WiFi.localIP().toString().c_str()
    );
    lanDebug.send(200, "application/json", buf);
  });
  lanDebug.begin();
  Serial.print("LAN debug: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/  (open|close|stop)");
}
#endif

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
  Serial.println("HomeGate ESP32-C3 — UNIVERSAL build");
  Serial.print("FW_BUILD=");
  Serial.println(FW_BUILD);
  Serial.println("Opto: UP=GPIO3 DOWN=GPIO5 STOP=GPIO10");
  Serial.println("Setup: SoftAP TGATE / 12345678 → http://192.168.4.1");
  Serial.println("   Re-setup: hold BOOT ~2s (clears Wi‑Fi, keeps gate claim)");
  Serial.println("   or Serial: WIFI:ssid|password");
  Serial.println("   App: WIFI_SCAN / WIFI_SET (keep claim)");
#if ENABLE_BLE_RESCUE
  Serial.println("   BLE rescue HG-xxxx after 60s Wi‑Fi down");
#else
  Serial.println("   SoftAP rescue TGATE after 60s Wi‑Fi down (BLE off — flash size)");
#endif

  wifiRemoteSetPublisher(publishWifiEvent);

  deviceLoadIdentity();
  Serial.print("Chip: ");
  Serial.println(DEVICE_CHIP_ID);
  Serial.print("Product: ");
  Serial.println(deviceHasProduct() ? DEVICE_PRODUCT_ID : "(none — claim in app after Wi‑Fi)");
#if ENABLE_CLOUD_REGISTER
  Serial.print("API: ");
  Serial.println(API_BASE_URL);
#else
  Serial.println("Cloud register: OFF");
#endif

  connectWifi();
#if ENABLE_LAN_DEBUG_HTTP
  if (WiFi.status() == WL_CONNECTED) {
    setupLanDebugHttp();
  }
#endif
  if (deviceHasProduct()) {
    connectMqtt();
  } else {
    Serial.println("No product yet — chip will poll cloud after Wi‑Fi / app QR claim");
    pollProductFromCloud();
    if (deviceHasProduct()) connectMqtt();
  }
}

void loop() {
#if ENABLE_LAN_DEBUG_HTTP
  lanDebug.handleClient();
#endif
  ensureMqtt();
  // Pump MQTT often — missed loops drop command packets
  for (int i = 0; i < 8; i++) mqtt.loop();
  flushPendingWifiEvent();

  pollPulse();
  wifiPollResetButton();
  pollStopButton();

  const bool wifiUp = WiFi.status() == WL_CONNECTED;
#if ENABLE_BLE_RESCUE
  bleRescuePoll(wifiUp);
#else
  wifiClaimedSoftApRescuePoll(wifiUp);
#endif

  if (!wifiUp) {
    connectWifi();
    return;
  }

  ensureRegistered();
  if (deviceHasProduct() && !mqtt.connected()) {
    ensureMqtt();
  }
  for (int i = 0; i < 8; i++) mqtt.loop();
  flushPendingWifiEvent();

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
