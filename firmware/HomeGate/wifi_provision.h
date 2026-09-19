#pragma once

/*
  SoftAP setup (universal):
  Phone joins TGATE (open) → enters HOME Wi‑Fi → Save → reboot → STA join.
  Sticker QR is claimed later in the phone app.
*/

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <string.h>
#include "esp_wifi.h"
#include "lwip/dns.h"
#include "lwip/ip_addr.h"
#include "config.h"
#include "device_identity.h"

extern void setStatusLed(bool on);
extern void blinkStatusLed(int times, int onMs, int offMs);

inline Preferences &wifiPrefsStore() {
  static Preferences prefs;
  return prefs;
}

inline String wifiApSsidName() {
  if (strlen(AP_SSID_FIXED) > 0) return String(AP_SSID_FIXED);
  const uint32_t mac = (uint32_t)ESP.getEfuseMac();
  char buf[32];
  snprintf(buf, sizeof(buf), "%s-%04X", AP_SSID_PREFIX, (unsigned)(mac & 0xFFFF));
  return String(buf);
}

inline void wifiLoadCreds(String &ssid, String &pass) {
  Preferences &prefs = wifiPrefsStore();
  prefs.begin("homegate", true);
  ssid = prefs.getString("ssid", "");
  pass = prefs.getString("pass", "");
  prefs.end();
}

inline void wifiSaveCreds(const String &ssid, const String &pass) {
  Preferences &prefs = wifiPrefsStore();
  prefs.begin("homegate", false);
  prefs.putString("ssid", ssid);
  prefs.putString("pass", pass);
  prefs.putBool("provOk", true);
  prefs.end();
}

/** Clear Wi‑Fi only — keep chip + product sticker binding. */
inline void wifiClearCreds() {
  Preferences &prefs = wifiPrefsStore();
  prefs.begin("homegate", false);
  prefs.remove("ssid");
  prefs.remove("pass");
  prefs.remove("provOk");
  prefs.end();
  Serial.println("WiFi credentials cleared (NVS)");
}

inline bool &wifiPortalExitOk() {
  static bool ok = false;
  return ok;
}

inline bool &wifiStaOnlineFlag() {
  static bool online = false;
  return online;
}

inline uint8_t &wifiLastDiscReason() {
  static uint8_t reason = 0;
  return reason;
}

/** Auth / reject — SoftAP again. Outage (AP missing) — keep retrying. */
inline bool wifiDiscIsAuthReject(uint8_t r) {
  return r == 2 || r == 4 || r == 15 || r == 202 || r == 203 || r == 204;
}

inline bool &wifiJoinSawTargetAp() {
  static bool saw = false;
  return saw;
}

inline void wifiDumpPassDebug(const String &pass) {
  Serial.print("passLen=");
  Serial.print(pass.length());
  Serial.print(" hex=");
  for (unsigned i = 0; i < pass.length(); i++) {
    char b[4];
    snprintf(b, sizeof(b), "%02X", (unsigned)(uint8_t)pass[i]);
    Serial.print(b);
    if (i + 1 < pass.length()) Serial.print(' ');
  }
  Serial.println();
  Serial.print("pass text=");
  Serial.println(pass);
}

inline const char *wifiDiscReasonText(uint8_t r) {
  switch (r) {
    case 2: return "AUTH_EXPIRE (wrong pass / AP reject / MAC filter)";
    case 4: return "ASSOC_EXPIRE";
    case 8: return "ASSOC_LEAVE";
    case 15: return "4WAY_HANDSHAKE_TIMEOUT (wrong password)";
    case 36: return "authmode mismatch (often WPA3-only AP)";
    case 201: return "NO_AP_FOUND";
    case 202: return "AUTH_FAIL (wrong password)";
    case 203: return "ASSOC_FAIL";
    case 204: return "HANDSHAKE_TIMEOUT (wrong password or WPA3)";
    default: return "see Espressif wifi_err_reason_t";
  }
}

inline void wifiApplyPublicDns() {
  ip_addr_t d1;
  ip_addr_t d2;
  IP_ADDR4(&d1, 8, 8, 8, 8);
  IP_ADDR4(&d2, 1, 1, 1, 1);
  dns_setserver(0, &d1);
  dns_setserver(1, &d2);
  WiFi.config(
    WiFi.localIP(),
    WiFi.gatewayIP(),
    WiFi.subnetMask(),
    IPAddress(8, 8, 8, 8),
    IPAddress(1, 1, 1, 1)
  );
  Serial.println("DNS → 8.8.8.8 / 1.1.1.1");
}

inline bool wifiWaitConnected(uint32_t timeoutMs) {
  const uint32_t start = millis();
  unsigned long last = 0;
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeoutMs) {
    delay(150);
    if (millis() - last > 2000) {
      last = millis();
      Serial.print("status=");
      Serial.println((int)WiFi.status());
      setStatusLed((millis() / 400) % 2 == 0);
    }
  }
  return WiFi.status() == WL_CONNECTED;
}

/**
 * Join home Wi‑Fi as STA only (after SoftAP save → reboot).
 * Never WIFI_OFF. Lower TX when RSSI is strong (office AP AUTH_EXPIRE fix).
 */
inline bool wifiJoinHomeClean(const String &ssid, const String &pass) {
  Serial.print("Clean join SSID=");
  Serial.println(ssid);
  wifiDumpPassDebug(pass);
  wifiLastDiscReason() = 0;
  wifiJoinSawTargetAp() = false;

  static bool eventHooked = false;
  if (!eventHooked) {
    eventHooked = true;
    WiFi.onEvent([](arduino_event_id_t event, arduino_event_info_t info) {
      if (event == ARDUINO_EVENT_WIFI_STA_CONNECTED) {
        Serial.println("EVENT: associated");
      } else if (event == ARDUINO_EVENT_WIFI_STA_GOT_IP) {
        Serial.print("EVENT: GOT_IP ");
        Serial.println(WiFi.localIP());
      } else if (event == ARDUINO_EVENT_WIFI_STA_DISCONNECTED) {
        const uint8_t r = info.wifi_sta_disconnected.reason;
        wifiLastDiscReason() = r;
        Serial.print("EVENT: DISC reason=");
        Serial.print(r);
        Serial.print(" ");
        Serial.println(wifiDiscReasonText(r));
      }
    });
  }

  WiFi.persistent(false);
  WiFi.setAutoReconnect(false);
  WiFi.softAPdisconnect(true);
  delay(100);
  WiFi.disconnect(true);
  delay(100);
  WiFi.mode(WIFI_STA);
  delay(500);
  WiFi.setSleep(false);
  esp_wifi_set_ps(WIFI_PS_NONE);
  WiFi.setTxPower(WIFI_POWER_8_5dBm);

  Serial.print("STA MAC=");
  Serial.print(WiFi.macAddress());
  Serial.print(" TX=");
  Serial.println(WiFi.getTxPower());

  int32_t channel = 0;
  uint8_t bssid[6] = {0};
  bool haveBssid = false;
  int bestRssi = -999;
  const int n = WiFi.scanNetworks(false, true);
  for (int i = 0; i < n; i++) {
    if (WiFi.SSID(i) != ssid) continue;
    const int rssi = WiFi.RSSI(i);
    if (rssi < bestRssi) continue;
    bestRssi = rssi;
    channel = WiFi.channel(i);
    memcpy(bssid, WiFi.BSSID(i), 6);
    haveBssid = true;
    wifiJoinSawTargetAp() = true;
  }
  WiFi.scanDelete();

  if (haveBssid) {
    Serial.print("scan OK RSSI=");
    Serial.print(bestRssi);
    Serial.print(" ch=");
    Serial.println(channel);
  } else {
    Serial.println("scan: SSID not in range");
  }

  delay(200);
  WiFi.disconnect(true);
  delay(300);

  Serial.println("WiFi.begin ssid+pass…");
  WiFi.setTxPower(WIFI_POWER_8_5dBm);
  WiFi.begin(ssid.c_str(), pass.c_str());
  if (wifiWaitConnected(25000)) {
    Serial.print("WiFi OK IP=");
    Serial.println(WiFi.localIP());
    wifiApplyPublicDns();
    WiFi.setAutoReconnect(true);
    setStatusLed(true);
    return true;
  }

  if (haveBssid && channel > 0) {
    Serial.println("Retry begin ch+bssid…");
    WiFi.disconnect(true);
    delay(400);
    WiFi.setTxPower(WIFI_POWER_8_5dBm);
    WiFi.begin(ssid.c_str(), pass.c_str(), channel, bssid);
    if (wifiWaitConnected(25000)) {
      Serial.print("WiFi OK IP=");
      Serial.println(WiFi.localIP());
      wifiApplyPublicDns();
      WiFi.setAutoReconnect(true);
      setStatusLed(true);
      return true;
    }
  }

  Serial.println("Retry begin TX=11dBm…");
  WiFi.disconnect(true);
  delay(400);
  WiFi.setTxPower(WIFI_POWER_11dBm);
  WiFi.begin(ssid.c_str(), pass.c_str());
  if (wifiWaitConnected(20000)) {
    Serial.print("WiFi OK IP=");
    Serial.println(WiFi.localIP());
    wifiApplyPublicDns();
    WiFi.setAutoReconnect(true);
    setStatusLed(true);
    return true;
  }

  Serial.println("FAILED join");
  Serial.print("Last DISC=");
  Serial.print(wifiLastDiscReason());
  Serial.print(" ");
  Serial.println(wifiDiscReasonText(wifiLastDiscReason()));
  WiFi.setAutoReconnect(false);
  return false;
}

inline String wifiBuildPortalHtml() {
  return String(
    "<!DOCTYPE html><html><head>"
    "<meta charset=\"utf-8\"/>"
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>"
    "<title>Touch SmartGate Wi-Fi</title>"
    "<style>"
    "body{font-family:system-ui,sans-serif;background:#e8f2ff;margin:0;padding:20px;color:#0f172a}"
    ".box{max-width:440px;margin:0 auto;background:#fff;border-radius:28px;padding:28px;"
    "box-shadow:0 12px 40px rgba(15,23,42,.12)}"
    "h1{font-size:1.75rem;margin:0 0 12px}"
    "p{color:#475569;font-size:1.05rem;line-height:1.5}"
    "label{display:block;font-size:1rem;font-weight:800;margin:18px 0 8px}"
    "input{width:100%;box-sizing:border-box;padding:18px 16px;border-radius:18px;"
    "border:2px solid #94a3b8;font-size:1.15rem}"
    "button{width:100%;margin-top:22px;padding:20px;border:0;border-radius:22px;"
    "background:#2563eb;color:#fff;font-weight:800;font-size:1.25rem}"
    "small{display:block;margin-top:16px;color:#94a3b8}"
    "</style></head><body><div class=\"box\">"
    "<h1>Home Wi‑Fi</h1>"
    "<p>Type your home network name and password, then Save.</p>"
    "<form method=\"POST\" action=\"/save\">"
    "<label>Network name (SSID)</label>"
    "<input name=\"ssid_manual\" maxlength=\"32\" placeholder=\"Your Wi‑Fi name\" "
    "required autocomplete=\"off\" autocapitalize=\"off\" spellcheck=\"false\"/>"
    "<label>Password</label>"
    "<input name=\"pass\" type=\"text\" maxlength=\"63\" placeholder=\"Wi‑Fi password\" "
    "autocomplete=\"off\" autocapitalize=\"off\" spellcheck=\"false\"/>"
    "<button type=\"submit\">Save &amp; Connect</button>"
    "</form>"
    "<small>Setup: <b>TGATE</b> / password <b>12345678</b>. Then enter HOME Wi‑Fi.</small>"
    "</div></body></html>"
  );
}

inline WebServer &wifiPortalServer() {
  static WebServer server(80);
  return server;
}

inline DNSServer &wifiPortalDns() {
  static DNSServer dns;
  return dns;
}

inline void wifiHandlePortalRoot() {
  wifiPortalServer().send(200, "text/html", wifiBuildPortalHtml());
}

inline void wifiHandleWifiPage() {
  wifiPortalServer().send(200, "text/html", wifiBuildPortalHtml());
}

inline void wifiHandleClaimGet() {
  wifiPortalServer().sendHeader("Location", "http://192.168.4.1/", true);
  wifiPortalServer().send(302, "text/plain", "");
}

inline void wifiHandleClaimPost() {
  wifiPortalServer().sendHeader("Location", "http://192.168.4.1/", true);
  wifiPortalServer().send(302, "text/plain", "");
}

inline void wifiHandlePortalNotFound() {
  wifiPortalServer().sendHeader("Location", "http://192.168.4.1/", true);
  wifiPortalServer().send(302, "text/plain", "");
}

/** Parse "WIFI:ssid|password" from Serial while SoftAP is up. */
inline bool wifiTryApplySerialLine(const String &lineIn) {
  String line = lineIn;
  line.trim();
  if (!line.startsWith("WIFI:")) return false;

  String rest = line.substring(5);
  const int bar = rest.indexOf('|');
  if (bar < 0) {
    Serial.println("Bad format. Use: WIFI:ssid|password");
    return false;
  }
  String ssid = rest.substring(0, bar);
  String pass = rest.substring(bar + 1);
  ssid.trim();
  pass.trim();
  if (ssid.length() == 0) {
    Serial.println("SSID empty");
    return false;
  }

  Serial.println("Serial WIFI line accepted");
  wifiSaveCreds(ssid, pass);
  Preferences &prefs = wifiPrefsStore();
  prefs.begin("homegate", false);
  prefs.putBool("provOk", true);
  prefs.end();
  Serial.println("Saved — reboot to join as STA only");
  delay(300);
  ESP.restart();
  return true;
}

inline void wifiPollSerialProvision() {
#if ENABLE_SERIAL_WIFI_SETUP
  static String buf;
  while (Serial.available() > 0) {
    const char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      if (buf.length() > 0) {
        wifiTryApplySerialLine(buf);
        buf = "";
      }
    } else if (buf.length() < 120) {
      buf += c;
    }
  }
#endif
}

inline void wifiHandlePortalSave() {
  WebServer &server = wifiPortalServer();
  String ssid = server.hasArg("ssid_manual") ? server.arg("ssid_manual") : "";
  ssid.trim();
  if (ssid.length() == 0 && server.hasArg("ssid")) {
    ssid = server.arg("ssid");
    ssid.trim();
  }
  if (ssid.length() == 0) {
    server.send(400, "text/plain", "Type a network name");
    return;
  }
  const String pass = server.hasArg("pass") ? server.arg("pass") : "";

  Serial.print("SoftAP save SSID=");
  Serial.print(ssid);
  Serial.print(" passLen=");
  Serial.println(pass.length());

  wifiSaveCreds(ssid, pass);
  Preferences &prefs = wifiPrefsStore();
  prefs.begin("homegate", false);
  prefs.putBool("provOk", true);
  prefs.end();

  server.send(
    200,
    "text/html",
    "<!DOCTYPE html><meta name=viewport content=\"width=device-width\">"
    "<body style=\"font-family:system-ui;padding:24px\">"
    "<h1>Saved</h1>"
    "<p>Box is rebooting and joining your home Wi‑Fi…</p>"
    "<p>Switch this phone back to your <b>home</b> Wi‑Fi, then open the app.</p>"
    "</body>"
  );
  delay(1200);

  wifiPortalDns().stop();
  server.stop();
  WiFi.softAPdisconnect(true);
  Serial.println("Reboot → join home Wi‑Fi as STA only");
  delay(200);
  ESP.restart();
}

/**
 * SoftAP for ESP32-C3 SuperMini:
 * Full TX power often makes SoftAP invisible (Arduino #6551).
 * Fix: softAP first, then WiFi.setTxPower(WIFI_POWER_8_5dBm).
 * Do NOT call esp_wifi_set_mac — breaks beacon on C3.
 */
inline bool wifiStartSoftApRadio(const String &apSsid, const char *apPass, uint8_t channel) {
  WiFi.persistent(false);
  WiFi.setAutoReconnect(false);

  // Clean leave STA — leftover STA mode makes TGATE invisible on C3
  WiFi.disconnect(true, true);
  WiFi.softAPdisconnect(true);
  delay(100);
  WiFi.mode(WIFI_OFF);
  delay(300);

  WiFi.mode(WIFI_AP);
  delay(400);

  IPAddress apIP(192, 168, 4, 1);
  IPAddress gw(192, 168, 4, 1);
  IPAddress mask(255, 255, 255, 0);
  WiFi.softAPConfig(apIP, gw, mask);
  delay(50);

  const char *pass = (apPass && strlen(apPass) >= 8) ? apPass : "12345678";
  const bool ok = WiFi.softAP(apSsid.c_str(), pass, channel, /*hidden=*/false, /*max=*/4);
  delay(300);

  // CRITICAL for C3 SuperMini visibility
  WiFi.setTxPower(WIFI_POWER_8_5dBm);
  delay(500);

  uint8_t mac[6] = {0};
  esp_wifi_get_mac(WIFI_IF_AP, mac);

  Serial.print("softAP ok=");
  Serial.print(ok ? "yes" : "NO");
  Serial.print(" SSID=");
  Serial.print(WiFi.softAPSSID());
  Serial.print(" ch=");
  Serial.print(channel);
  Serial.print(" IP=");
  Serial.print(WiFi.softAPIP());
  Serial.print(" TX=");
  Serial.print(WiFi.getTxPower());
  Serial.print(" AP_MAC=");
  for (int i = 0; i < 6; i++) {
    if (i) Serial.print(':');
    if (mac[i] < 16) Serial.print('0');
    Serial.print(mac[i], HEX);
  }
  Serial.println();
  return ok;
}

inline void wifiRunSoftApPortal() {
  deviceLoadIdentity();
  const String apSsid = wifiApSsidName();
  const char *apPass =
    (strlen(AP_PASSWORD) >= 8) ? AP_PASSWORD : "12345678";

  Serial.println();
  Serial.println("=== SETUP MODE ===");
  Serial.println("Phone Wi‑Fi list → TGATE");
  Serial.println("Password: 12345678");
  Serial.println("Then: http://192.168.4.1");
  Serial.println("(C3 SuperMini needs low TX — already set)");
  Serial.println("==================");
  Serial.flush();

  // Channel 1 + low TX — most visible on C3 SuperMini
  bool ok = wifiStartSoftApRadio(apSsid, apPass, 1);
  if (!ok) {
    Serial.println("Retry SoftAP…");
    delay(300);
    ok = wifiStartSoftApRadio(apSsid, apPass, 6);
  }

  if (ok) {
    Serial.println(">>> LOOK FOR: TGATE  password 12345678");
  } else {
    Serial.println(">>> SoftAP FAILED — Serial: WIFI:ssid|password");
  }
  Serial.flush();

  IPAddress apIP = WiFi.softAPIP();
  if (apIP[0] != 192) apIP = IPAddress(192, 168, 4, 1);

  wifiPortalDns().stop();
  delay(50);
  wifiPortalDns().start(53, "*", apIP);

  WebServer &server = wifiPortalServer();
  server.stop();
  delay(50);
  server.on("/", HTTP_GET, wifiHandlePortalRoot);
  server.on("/wifi", HTTP_GET, wifiHandleWifiPage);
  server.on("/save", HTTP_POST, wifiHandlePortalSave);
  server.on("/generate_204", HTTP_GET, wifiHandlePortalRoot);
  server.on("/gen_204", HTTP_GET, wifiHandlePortalRoot);
  server.on("/hotspot-detect.html", HTTP_GET, wifiHandlePortalRoot);
  server.on("/ncsi.txt", HTTP_GET, []() {
    wifiPortalServer().send(200, "text/plain", "Microsoft NCSI");
  });
  server.on("/claim", HTTP_GET, wifiHandleClaimGet);
  server.on("/claim", HTTP_POST, wifiHandleClaimPost);
  server.onNotFound(wifiHandlePortalNotFound);
  server.begin();

  wifiPortalExitOk() = false;
  unsigned long lastPing = 0;
  while (!wifiPortalExitOk()) {
    wifiPollSerialProvision();
    wifiPortalDns().processNextRequest();
    server.handleClient();
    setStatusLed((millis() / 200) % 2 == 0);

    // Re-assert low TX (some cores reset it)
    if (millis() - lastPing > 4000) {
      lastPing = millis();
      WiFi.setTxPower(WIFI_POWER_8_5dBm);
      Serial.print("TGATE live · stations=");
      Serial.print(WiFi.softAPgetStationNum());
      Serial.print(" · TX=");
      Serial.print(WiFi.getTxPower());
      Serial.println(" · pass 12345678");
    }
    delay(2);
  }
}

inline void wifiFactoryResetAndReboot() {
  Serial.println("Wi-Fi + product reset → SoftAP on reboot");
  blinkStatusLed(8, 40, 40);
  wifiClearCreds();
  deviceClearProduct();
  delay(300);
  ESP.restart();
}

inline void wifiResetPinBegin() {
  pinMode(WIFI_RESET_PIN, INPUT_PULLUP);
}

inline void wifiMaybeFactoryNewWipe() {
#if FACTORY_NEW_TOKEN > 0
  Preferences &prefs = wifiPrefsStore();
  prefs.begin("homegate", false);
  const int done = prefs.getInt("newTok", 0);
  if (done != FACTORY_NEW_TOKEN) {
    Serial.print("FACTORY_NEW_TOKEN=");
    Serial.print(FACTORY_NEW_TOKEN);
    Serial.println(" → wipe → SoftAP");
    prefs.putInt("newTok", FACTORY_NEW_TOKEN);
    prefs.remove("ssid");
    prefs.remove("pass");
    prefs.remove("provOk");
    prefs.end();
    Serial.println("WiFi credentials cleared (NVS)");
    blinkStatusLed(10, 40, 40);
    return;
  }
  prefs.end();
#endif
}

inline void wifiPollResetButton(); // defined below

inline bool wifiEnsureConnected() {
  wifiResetPinBegin();
  deviceLoadIdentity();
  delay(50);

#if FACTORY_NEW_TOKEN > 0
  wifiMaybeFactoryNewWipe();
#endif

  // Manual SoftAP: hold BOOT at power-on (Wi‑Fi only — keep product claim)
  if (digitalRead(WIFI_RESET_PIN) == LOW) {
    Serial.println("BOOT held → SoftAP (Wi‑Fi re-setup)");
    wifiClearCreds();
    Preferences &p = wifiPrefsStore();
    p.begin("homegate", false);
    p.remove("provOk");
    p.end();
    wifiRunSoftApPortal();
    return WiFi.status() == WL_CONNECTED;
  }

  Preferences &prefs = wifiPrefsStore();
  prefs.begin("homegate", true);
  const bool provOk = prefs.getBool("provOk", false);
  prefs.end();

  String ssid;
  String pass;
  wifiLoadCreds(ssid, pass);

  // First-time setup only — no saved home Wi‑Fi yet
  if (!provOk || ssid.length() == 0) {
    Serial.println("No home Wi‑Fi yet → SoftAP TGATE / 12345678");
    wifiRunSoftApPortal();
    return WiFi.status() == WL_CONNECTED;
  }

  // Already provisioned: try saved Wi‑Fi.
  // Router off / missing → retry. AUTH reject → SoftAP to enter new Wi‑Fi.
  Serial.print("Saved Wi‑Fi: ");
  Serial.println(ssid);
  if (wifiJoinHomeClean(ssid, pass)) {
    wifiStaOnlineFlag() = true;
    return true;
  }

  // AP was visible but join failed (auth/assoc).
  // Unclaimed → SoftAP first-time style. Claimed → keep creds, retry + BLE rescue.
  if (wifiJoinSawTargetAp() || wifiDiscIsAuthReject(wifiLastDiscReason())) {
    if (deviceHasProduct()) {
      Serial.println(
        "Wi‑Fi auth/assoc fail (claimed) — keep creds, retry; BLE after 60s"
      );
      const uint32_t gap = WIFI_RETRY_GAP_MS;
      const uint32_t start = millis();
      while (millis() - start < gap) {
        wifiPollResetButton();
        setStatusLed((millis() / 400) % 2 == 0);
        delay(50);
      }
      return false;
    }
    Serial.println("Wi‑Fi reject / AP visible but fail → SoftAP TGATE / 12345678");
    wifiClearCreds();
    Preferences &p = wifiPrefsStore();
    p.begin("homegate", false);
    p.remove("provOk");
    p.end();
    wifiRunSoftApPortal();
    return WiFi.status() == WL_CONNECTED;
  }

  Serial.println("Home Wi‑Fi down — retry (hold BOOT 2s for SoftAP TGATE)");
  const uint32_t gap = WIFI_RETRY_GAP_MS;
  const uint32_t start = millis();
  while (millis() - start < gap) {
    wifiPollResetButton();
    setStatusLed((millis() / 500) % 2 == 0);
    delay(50);
  }
  return false;
}

inline void wifiPollResetButton() {
  static unsigned long pressedAt = 0;
  const bool pressed = digitalRead(WIFI_RESET_PIN) == LOW;

  if (pressed) {
    if (pressedAt == 0) pressedAt = millis();
    if (millis() - pressedAt >= WIFI_RESET_HOLD_MS) {
      Serial.println("BOOT held — clear Wi‑Fi only → SoftAP on reboot");
      blinkStatusLed(8, 40, 40);
      wifiClearCreds();
      Preferences &p = wifiPrefsStore();
      p.begin("homegate", false);
      p.remove("provOk");
      p.end();
      // Keep product claim — only re-share Wi‑Fi
      delay(200);
      ESP.restart();
    }
  } else {
    pressedAt = 0;
  }
}

/**
 * Claimed device, home Wi‑Fi down for BLE_RESCUE_AFTER_MS → SoftAP
 * (Wi‑Fi only, keep product). Used when BLE is disabled to save flash.
 */
inline uint32_t &wifiClaimedDownSince() {
  static uint32_t v = 0;
  return v;
}

inline void wifiClaimedSoftApRescuePoll(bool wifiUp) {
  if (!deviceHasProduct()) {
    wifiClaimedDownSince() = 0;
    return;
  }
  if (wifiUp) {
    wifiClaimedDownSince() = 0;
    return;
  }
  if (wifiClaimedDownSince() == 0) wifiClaimedDownSince() = millis();
  if (millis() - wifiClaimedDownSince() < BLE_RESCUE_AFTER_MS) return;

  Serial.println(
    "Wi‑Fi down ≥60s (claimed) → SoftAP TGATE (keep product claim)"
  );
  blinkStatusLed(10, 40, 40);
  wifiClearCreds();
  Preferences &p = wifiPrefsStore();
  p.begin("homegate", false);
  p.remove("provOk");
  p.end();
  wifiClaimedDownSince() = 0;
  wifiRunSoftApPortal();
}
