#pragma once

/*
  Step 4 — Wi‑Fi from phone via SoftAP portal
  - Credentials stored in NVS (Preferences)
  - No saved Wi‑Fi / connect fail → AP "TouchGate-XXXX" + http://192.168.4.1
  - Hold BOOT (GPIO9) ~3.5s → clear Wi‑Fi, reboot into setup mode
*/

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include "config.h"

extern void setStatusLed(bool on);
extern void blinkStatusLed(int times, int onMs, int offMs);

inline Preferences &wifiPrefsStore() {
  static Preferences prefs;
  return prefs;
}

inline String wifiApSsidName() {
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
  prefs.end();
}

inline void wifiClearCreds() {
  Preferences &prefs = wifiPrefsStore();
  prefs.begin("homegate", false);
  prefs.clear();
  prefs.end();
  Serial.println("WiFi credentials cleared (NVS)");
}

inline bool wifiTryConnectSta(const String &ssid, const String &pass, uint32_t timeoutMs) {
  if (ssid.length() == 0) return false;

  Serial.print("STA connect: ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.setHostname(DEVICE_ID);
  WiFi.begin(ssid.c_str(), pass.c_str());

  const uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeoutMs) {
    delay(300);
    Serial.print(".");
    setStatusLed((millis() / 300) % 2 == 0);
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi OK IP=");
    Serial.println(WiFi.localIP());
    setStatusLed(true);
    return true;
  }

  Serial.println("WiFi STA failed");
  WiFi.disconnect(true);
  setStatusLed(false);
  return false;
}

inline const char *WIFI_PORTAL_HTML = R"HTML(
<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Touch SmartGate Wi-Fi</title>
<style>
body{font-family:system-ui,sans-serif;background:#e8f2ff;margin:0;padding:24px;color:#0f172a}
.box{display:block;max-width:420px;margin:0 auto;background:#fff;border-radius:24px;padding:24px;box-shadow:0 12px 40px rgba(15,23,42,.12)}
h1{font-size:1.25rem;margin:0 0 8px}
p{color:#64748b;font-size:.9rem;line-height:1.45}
label{display:block;font-size:.75rem;font-weight:700;margin:14px 0 6px;color:#64748b}
input{width:100%;box-sizing:border-box;padding:14px 16px;border-radius:16px;border:1px solid #cbd5e1;font-size:1rem}
button{width:100%;margin-top:18px;padding:16px;border:0;border-radius:18px;background:#2563eb;color:#fff;font-weight:800;font-size:1rem}
small{display:block;margin-top:12px;color:#94a3b8;font-size:.75rem}
</style></head><body><div class="box">
<h1>Touch SmartGate</h1>
<p>Enter your home Wi-Fi. The gate box will reboot and connect.</p>
<form method="POST" action="/save">
<label>Network (SSID)</label>
<input name="ssid" required maxlength="32" placeholder="Home Wi-Fi" autocomplete="username"/>
<label>Password</label>
<input name="pass" type="password" maxlength="64" placeholder="Wi-Fi password" autocomplete="current-password"/>
<button type="submit">Save &amp; Connect</button>
</form>
<small>Device setup · 192.168.4.1</small>
</div></body></html>
)HTML";

inline WebServer &wifiPortalServer() {
  static WebServer server(80);
  return server;
}

inline DNSServer &wifiPortalDns() {
  static DNSServer dns;
  return dns;
}

inline void wifiHandlePortalRoot() {
  wifiPortalServer().send(200, "text/html", WIFI_PORTAL_HTML);
}

inline void wifiHandlePortalSave() {
  WebServer &server = wifiPortalServer();
  if (!server.hasArg("ssid")) {
    server.send(400, "text/plain", "ssid required");
    return;
  }
  const String ssid = server.arg("ssid");
  const String pass = server.hasArg("pass") ? server.arg("pass") : "";
  wifiSaveCreds(ssid, pass);

  server.send(
    200,
    "text/html",
    "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'/>"
    "<title>Saved</title></head><body style='font-family:system-ui;padding:24px'>"
    "<h1>Saved</h1><p>Rebooting… Join your home Wi-Fi, then open the Touch SmartGate app and scan the QR.</p>"
    "</body></html>"
  );
  delay(700);
  ESP.restart();
}

inline void wifiHandlePortalNotFound() {
  wifiPortalServer().sendHeader("Location", String("http://") + WiFi.softAPIP().toString(), true);
  wifiPortalServer().send(302, "text/plain", "");
}

/** Blocking SoftAP captive portal until credentials saved (then reboot). */
inline void wifiRunSoftApPortal() {
  const String apSsid = wifiApSsidName();
  Serial.println();
  Serial.println("=== Wi-Fi SETUP MODE ===");
  Serial.print("Join Wi-Fi: ");
  Serial.println(apSsid);
  Serial.println("Password: (none — open network)");
  Serial.println("Then open http://192.168.4.1");
  Serial.println("========================");
  Serial.flush();

  WiFi.persistent(false);
  WiFi.disconnect(true, true);
  delay(200);
  WiFi.mode(WIFI_AP);
  delay(100);

  // channel 1, visible, max 4 clients — helps phones find the AP
  bool ok = false;
  if (strlen(AP_PASSWORD) >= 8) {
    ok = WiFi.softAP(apSsid.c_str(), AP_PASSWORD, 1, 0, 4);
  } else {
    ok = WiFi.softAP(apSsid.c_str(), nullptr, 1, 0, 4);
  }

  IPAddress apIP(192, 168, 4, 1);
  IPAddress gateway(192, 168, 4, 1);
  IPAddress subnet(255, 255, 255, 0);
  WiFi.softAPConfig(apIP, gateway, subnet);

  delay(300);
  Serial.print("softAP ok=");
  Serial.println(ok ? "yes" : "NO");
  Serial.print("AP IP: ");
  Serial.println(WiFi.softAPIP());
  Serial.print("AP MAC: ");
  Serial.println(WiFi.softAPmacAddress());
  Serial.flush();

  wifiPortalDns().start(53, "*", WiFi.softAPIP());

  WebServer &server = wifiPortalServer();
  server.on("/", HTTP_GET, wifiHandlePortalRoot);
  server.on("/save", HTTP_POST, wifiHandlePortalSave);
  server.onNotFound(wifiHandlePortalNotFound);
  server.begin();

  // Fast blink = waiting for phone
  while (true) {
    wifiPortalDns().processNextRequest();
    server.handleClient();
    setStatusLed((millis() / 200) % 2 == 0);
    delay(2);
  }
}

inline void wifiResetPinBegin() {
  pinMode(WIFI_RESET_PIN, INPUT_PULLUP);
}

/**
 * Connect using NVS (or factory fallback). If that fails, SoftAP portal.
 * Hold BOOT while powering/resetting → force setup AP immediately.
 */
inline bool wifiEnsureConnected() {
  wifiResetPinBegin();
  delay(50);

  // Force setup: BOOT held at boot
  if (digitalRead(WIFI_RESET_PIN) == LOW) {
    Serial.println("BOOT held at boot → force Wi-Fi setup");
    wifiClearCreds();
    blinkStatusLed(6, 50, 50);
    wifiRunSoftApPortal();
    return false;
  }

  String ssid;
  String pass;
  wifiLoadCreds(ssid, pass);

  if (ssid.length() == 0 && strlen(FACTORY_WIFI_SSID) > 0) {
    ssid = FACTORY_WIFI_SSID;
    pass = FACTORY_WIFI_PASS;
    Serial.println("Using FACTORY_WIFI_* (NVS empty)");
  }

  if (ssid.length() > 0) {
    Serial.print("Trying saved Wi-Fi: ");
    Serial.println(ssid);
    if (wifiTryConnectSta(ssid, pass, WIFI_CONNECT_TIMEOUT_MS)) {
      return true;
    }
    Serial.println("Saved Wi-Fi failed — opening setup AP");
    blinkStatusLed(4, 80, 80);
  } else {
    Serial.println("No Wi-Fi saved — opening setup AP");
  }

  wifiRunSoftApPortal();
  return false;
}

/** Call from loop — hold BOOT to wipe Wi-Fi and reboot into SoftAP. */
inline void wifiPollResetButton() {
  static unsigned long pressedAt = 0;
  const bool pressed = digitalRead(WIFI_RESET_PIN) == LOW;

  if (pressed) {
    if (pressedAt == 0) pressedAt = millis();
    if (millis() - pressedAt >= WIFI_RESET_HOLD_MS) {
      Serial.println("BOOT held — clearing Wi-Fi");
      blinkStatusLed(8, 40, 40);
      wifiClearCreds();
      delay(200);
      ESP.restart();
    }
  } else {
    pressedAt = 0;
  }
}
