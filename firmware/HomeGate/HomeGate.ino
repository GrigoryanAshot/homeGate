/*
  HomeGate — ESP32-S3 MQTT client (HiveMQ Cloud)

  Library: PubSubClient by Nick O'Leary
  Board: ESP32S3 Dev Module
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ctype.h>
#include <time.h>
#include "config.h"

WiFiClientSecure secureClient;
PubSubClient mqtt(secureClient);

// Let's Encrypt ISRG Root X1 (required by HiveMQ Cloud)
static const char ROOT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)EOF";

String doorState = "closed";
int lastPair = 0;
unsigned long moveAt = 0;
unsigned long lastReconnectAttempt = 0;
unsigned long lastStatusMs = 0;

void releasePair(int a, int b) {
  pinMode(a, INPUT);
  pinMode(b, INPUT);
}

void allRelease() {
  releasePair(PIN_UP_A, PIN_UP_B);
  releasePair(PIN_DOWN_A, PIN_DOWN_B);
}

void shortPair(int a, int b) {
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

void updateMoveState() {
  if ((doorState == "opening" || doorState == "closing") && millis() - moveAt >= MOVE_MS) {
    doorState = (doorState == "opening") ? "open" : "closed";
  }
}

void publishStatus() {
  if (!mqtt.connected()) return;
  updateMoveState();
  char payload[128];
  snprintf(
    payload,
    sizeof(payload),
    "{\"state\":\"%s\",\"online\":true,\"ip\":\"%s\"}",
    doorState.c_str(),
    WiFi.localIP().toString().c_str()
  );
  mqtt.publish(TOPIC_STATUS, payload, true);
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
  } else {
    Serial.println("Unknown command");
    return;
  }
  publishStatus();
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
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("WiFi: ");
  Serial.println(WIFI_SSID);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  syncTime();
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

  secureClient.stop();
  delay(200);

  // HiveMQ Cloud + ESP32: insecure TLS is the most reliable first step.
  // (SNI still uses the hostname; certificate pinning can be added later.)
  secureClient.setInsecure();
  secureClient.setHandshakeTimeout(30);
  secureClient.setTimeout(30);

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(45);
  mqtt.setSocketTimeout(30);

  String clientId = String(MQTT_CLIENT_ID) + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  Serial.print("User: ");
  Serial.println(MQTT_USER);
  Serial.print("ClientId: ");
  Serial.println(clientId);
  Serial.println("TCP/TLS+MQTT handshake (wait up to ~30s)...");
  Serial.flush();

  const bool ok = mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS);
  if (!ok) {
    const int st = mqtt.state();
    Serial.print("MQTT failed, state=");
    Serial.print(st);
    Serial.print(" (");
    Serial.print(mqttStateText(st));
    Serial.println(")");
    secureClient.stop();
    return false;
  }

  mqtt.subscribe(TOPIC_COMMAND, 1);
  Serial.println("MQTT connected + subscribed " TOPIC_COMMAND);
  publishStatus();
  return true;
}

void ensureMqtt() {
  if (mqtt.connected()) return;
  const unsigned long now = millis();
  if (now - lastReconnectAttempt < 5000) return;
  lastReconnectAttempt = now;
  connectMqtt();
}

void setup() {
  allRelease();
  Serial.begin(115200);
  delay(300);
  Serial.println("HomeGate ESP32-S3 MQTT");

  connectWifi();
  connectMqtt();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
  }

  ensureMqtt();
  mqtt.loop();
  updateMoveState();

  if (mqtt.connected() && millis() - lastStatusMs > 30000) {
    lastStatusMs = millis();
    publishStatus();
  }
}
