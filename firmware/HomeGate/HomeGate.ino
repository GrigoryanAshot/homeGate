#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <Preferences.h>
#include "config.h"
#include "webpage.h"

WebServer server(80);
Preferences prefs;

String doorState = "closed";
int lastPair = 0;  // 0 = up, 1 = down
unsigned long moveAt = 0;
bool rebootSoon = false;
unsigned long rebootAt = 0;

String jsonEscape(const String &value) {
  String out;
  out.reserve(value.length());
  for (size_t i = 0; i < value.length(); i++) {
    const char c = value[i];
    if (c == '"' || c == '\\') out += '\\';
    if (c == '\n') {
      out += "\\n";
      continue;
    }
    out += c;
  }
  return out;
}

String jsonGet(const String &body, const char *key) {
  const String pattern = String("\"") + key + "\"";
  int i = body.indexOf(pattern);
  if (i < 0) return "";
  i = body.indexOf(':', i);
  if (i < 0) return "";
  i++;
  while (i < static_cast<int>(body.length()) && (body[i] == ' ' || body[i] == '\t')) i++;
  if (i < static_cast<int>(body.length()) && body[i] == '"') {
    const int start = ++i;
    int end = start;
    while (end < static_cast<int>(body.length()) && body[end] != '"') {
      if (body[end] == '\\' && end + 1 < static_cast<int>(body.length())) end++;
      end++;
    }
    return body.substring(start, end);
  }
  const int start = i;
  while (i < static_cast<int>(body.length()) && body[i] != ',' && body[i] != '}' && body[i] != ' ') i++;
  return body.substring(start, i);
}

void cors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, X-Gate-Key");
}

void sendJson(int code, const String &body) {
  cors();
  server.send(code, "application/json", body);
}

void handleOptions() {
  cors();
  server.send(204);
}

bool checkAuth() {
  String key = server.header("X-Gate-Key");
  if (!key.length()) key = server.arg("key");
  if (server.hasArg("plain")) {
    const String bodyKey = jsonGet(server.arg("plain"), "key");
    if (bodyKey.length()) key = bodyKey;
  }
  if (key == APP_PASSWORD) return true;
  sendJson(401, "{\"ok\":false,\"error\":\"unauthorized\"}");
  return false;
}

String currentIp() {
  if (WiFi.status() == WL_CONNECTED) return WiFi.localIP().toString();
  return WiFi.softAPIP().toString();
}

void updateMoveState() {
  if ((doorState == "opening" || doorState == "closing") && millis() - moveAt >= MOVE_MS) {
    doorState = (doorState == "opening") ? "open" : "closed";
  }
}

void releasePair(int a, int b) {
  pinMode(a, INPUT);
  pinMode(b, INPUT);
}

void allRelease() {
  releasePair(PIN_UP_A, PIN_UP_B);
  releasePair(PIN_DOWN_A, PIN_DOWN_B);
}

void shortPair(int a, int b) {
  // Both pins LOW = the two remote pads are shorted through ESP GND
  pinMode(a, OUTPUT);
  pinMode(b, OUTPUT);
  digitalWrite(a, LOW);
  digitalWrite(b, LOW);
}

void pulsePair(int a, int b) {
  allRelease();
  shortPair(a, b);
  delay(PULSE_MS);
  allRelease();
}

void pressPair(int pair) {
  lastPair = pair;
  const int a = (pair == 0) ? PIN_UP_A : PIN_DOWN_A;
  const int b = (pair == 0) ? PIN_UP_B : PIN_DOWN_B;
  if (BUTTON_HOLD) {
    allRelease();
    shortPair(a, b);
  } else {
    pulsePair(a, b);
  }
}

void doOpen() {
  pressPair(0);
  doorState = "opening";
  moveAt = millis();
}

void doClose() {
  pressPair(1);
  doorState = "closing";
  moveAt = millis();
}

void doStop() {
  if (BUTTON_HOLD) {
    allRelease();
  } else {
    const int a = (lastPair == 0) ? PIN_UP_A : PIN_DOWN_A;
    const int b = (lastPair == 0) ? PIN_UP_B : PIN_DOWN_B;
    pulsePair(a, b);
  }
  doorState = "stopped";
}

void handleStatus() {
  if (!checkAuth()) return;
  updateMoveState();
  String body = "{\"ok\":true,\"state\":\"";
  body += doorState;
  body += "\",\"ip\":\"";
  body += jsonEscape(currentIp());
  body += "\",\"ssid\":\"";
  body += jsonEscape(WiFi.SSID());
  body += "\"}";
  sendJson(200, body);
}

void handleOpen() {
  if (!checkAuth()) return;
  doOpen();
  sendJson(200, "{\"ok\":true,\"state\":\"opening\"}");
}

void handleClose() {
  if (!checkAuth()) return;
  doClose();
  sendJson(200, "{\"ok\":true,\"state\":\"closing\"}");
}

void handleStop() {
  if (!checkAuth()) return;
  doStop();
  sendJson(200, "{\"ok\":true,\"state\":\"stopped\"}");
}

void handleWifi() {
  if (!checkAuth()) return;
  String ssid = server.arg("ssid");
  String pass = server.arg("password");
  if (server.hasArg("plain")) {
    const String body = server.arg("plain");
    const String jsonSsid = jsonGet(body, "ssid");
    const String jsonPass = jsonGet(body, "password");
    if (jsonSsid.length()) ssid = jsonSsid;
    if (jsonPass.length() || jsonSsid.length()) pass = jsonPass;
  }
  ssid.trim();
  if (!ssid.length()) {
    sendJson(400, "{\"ok\":false,\"error\":\"ssid\"}");
    return;
  }
  prefs.putString("ssid", ssid);
  prefs.putString("pass", pass);
  sendJson(200, "{\"ok\":true}");
  rebootSoon = true;
  rebootAt = millis() + 800;
}

void serveFile(const char *path, const char *type, const char *content) {
  if (server.method() == HTTP_OPTIONS) {
    handleOptions();
    return;
  }
  cors();
  server.sendHeader("Cache-Control", "no-cache");
  server.send_P(200, type, content);
}

void connectWifi() {
  String ssid = prefs.getString("ssid", WIFI_SSID);
  String pass = prefs.getString("pass", WIFI_PASS);
  ssid.trim();

  if (ssid.length() && ssid != "YOUR_WIFI_NAME") {
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), pass.c_str());
    Serial.print("WiFi: ");
    Serial.println(ssid);
    for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) {
      delay(250);
      Serial.print(".");
    }
    Serial.println();
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_NAME, AP_PASS);
    Serial.print("AP IP: ");
    Serial.println(WiFi.softAPIP());
    Serial.println("Connect the phone to Wi-Fi HomeGate / password homegate");
    Serial.println("Then open http://192.168.4.1");
  }

  if (MDNS.begin(MDNS_NAME)) {
    MDNS.addService("http", "tcp", 80);
    Serial.println("mDNS: http://homegate.local");
  }
}

void setup() {
  allRelease();

  Serial.begin(115200);
  delay(200);
  Serial.println("HomeGate ESP32-S3");

  prefs.begin("homegate", false);
  connectWifi();

  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/open", HTTP_OPTIONS, handleOptions);
  server.on("/api/close", HTTP_OPTIONS, handleOptions);
  server.on("/api/stop", HTTP_OPTIONS, handleOptions);
  server.on("/api/wifi", HTTP_OPTIONS, handleOptions);

  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/open", HTTP_GET, handleOpen);
  server.on("/api/open", HTTP_POST, handleOpen);
  server.on("/api/close", HTTP_GET, handleClose);
  server.on("/api/close", HTTP_POST, handleClose);
  server.on("/api/stop", HTTP_GET, handleStop);
  server.on("/api/stop", HTTP_POST, handleStop);
  server.on("/api/wifi", HTTP_POST, handleWifi);

  server.on("/", []() { serveFile("/", "text/html", APP_INDEX); });
  server.on("/index.html", []() { serveFile("/index.html", "text/html", APP_INDEX); });
  server.on("/css/styles.css", []() { serveFile("/css/styles.css", "text/css", APP_CSS); });
  server.on("/js/app.js", []() { serveFile("/js/app.js", "application/javascript", APP_JS); });
  server.on("/manifest.json", []() { serveFile("/manifest.json", "application/manifest+json", APP_MANIFEST); });

  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      handleOptions();
      return;
    }
    cors();
    server.send(404, "text/plain", "Not found");
  });

  server.begin();
}

void loop() {
  server.handleClient();
  updateMoveState();
  if (rebootSoon && millis() >= rebootAt) {
    ESP.restart();
  }
}
