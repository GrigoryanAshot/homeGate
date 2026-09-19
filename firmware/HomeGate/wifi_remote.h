#pragma once

/**
 * Post-claim remote Wi‑Fi change (MQTT), without wiping product claim.
 * - WIFI_SCAN → JSON list on status topic (non-retained)
 * - WIFI_SET with ssid/pass → try new network; on fail restore previous
 */

#include <Arduino.h>
#include <WiFi.h>
#include "wifi_provision.h"

#ifndef WIFI_REMOTE_JOIN_TIMEOUT_MS
#define WIFI_REMOTE_JOIN_TIMEOUT_MS 20000
#endif

typedef void (*WifiRemotePublishFn)(const char *json, bool retained);

inline WifiRemotePublishFn &wifiRemotePublisher() {
  static WifiRemotePublishFn fn = nullptr;
  return fn;
}

inline void wifiRemoteSetPublisher(WifiRemotePublishFn fn) {
  wifiRemotePublisher() = fn;
}

inline void wifiRemotePublish(const char *json, bool retained = false) {
  if (wifiRemotePublisher()) wifiRemotePublisher()(json, retained);
}

inline void wifiRemotePublishScan() {
  Serial.println("WIFI_SCAN…");
  wifiRemotePublish(
    "{\"wifiEvent\":\"scan_start\"}",
    false
  );

  // STA scan while connected is supported on ESP32
  const int n = WiFi.scanNetworks(/*async=*/false, /*hidden=*/true);
  // Cap payload for MQTT buffer
  const int maxN = n > 24 ? 24 : n;
  String json = "{\"wifiEvent\":\"scan\",\"networks\":[";
  bool first = true;
  for (int i = 0; i < maxN; i++) {
    String ssid = WiFi.SSID(i);
    if (ssid.length() == 0) continue;
    ssid.replace("\\", "\\\\");
    ssid.replace("\"", "\\\"");
    if (!first) json += ',';
    first = false;
    json += "{\"ssid\":\"";
    json += ssid;
    json += "\",\"rssi\":";
    json += String(WiFi.RSSI(i));
    json += "}";
  }
  json += "]}";
  WiFi.scanDelete();

  Serial.print("WIFI_SCAN count≈");
  Serial.println(maxN);
  wifiRemotePublish(json.c_str(), false);
}

/** Join helper with dedicated timeout (does not SoftAP). */
inline bool wifiRemoteTryJoin(const String &ssid, const String &pass) {
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.persistent(false);
  WiFi.disconnect(true, true);
  delay(200);
  wifiUsePublicDns();
  if (pass.length() == 0) WiFi.begin(ssid.c_str());
  else WiFi.begin(ssid.c_str(), pass.c_str());

  const uint32_t start = millis();
  wl_status_t st = WiFi.status();
  while (millis() - start < WIFI_REMOTE_JOIN_TIMEOUT_MS) {
    st = WiFi.status();
    if (st == WL_CONNECTED) {
      wifiUsePublicDns();
      return true;
    }
    if (st == WL_CONNECT_FAILED || st == WL_NO_SSID_AVAIL) {
      // keep waiting a bit — some routers report transient fail
    }
    delay(200);
  }
  return WiFi.status() == WL_CONNECTED;
}

/**
 * Try new credentials. Keep previous NVS until success.
 * Returns true if new Wi‑Fi is up and saved.
 */
inline bool wifiRemoteApplySet(const String &ssid, const String &pass) {
  String newSsid = ssid;
  newSsid.trim();
  if (newSsid.length() == 0) {
    wifiRemotePublish(
      "{\"wifiEvent\":\"join\",\"ok\":false,\"error\":\"empty_ssid\"}",
      false
    );
    return false;
  }

  String oldSsid;
  String oldPass;
  wifiLoadCreds(oldSsid, oldPass);

  wifiRemotePublish("{\"wifiEvent\":\"join\",\"phase\":\"trying\"}", false);

  Serial.print("WIFI_SET try SSID=");
  Serial.println(newSsid);

  const bool ok = wifiRemoteTryJoin(newSsid, pass);
  if (ok) {
    wifiSaveCreds(newSsid, pass);
    wifiStaOnlineFlag() = true;
    wifiRemotePublish(
      "{\"wifiEvent\":\"join\",\"ok\":true}",
      false
    );
    Serial.println("WIFI_SET OK — saved");
    return true;
  }

  Serial.println("WIFI_SET FAIL — restore previous");
  wifiRemotePublish(
    "{\"wifiEvent\":\"join\",\"ok\":false,\"error\":\"auth_or_timeout\"}",
    false
  );

  if (oldSsid.length() > 0) {
    if (wifiRemoteTryJoin(oldSsid, oldPass)) {
      wifiStaOnlineFlag() = true;
      Serial.println("Restored previous Wi‑Fi");
      wifiRemotePublish(
        "{\"wifiEvent\":\"join\",\"ok\":false,\"error\":\"reverted\"}",
        false
      );
    } else {
      Serial.println("Restore previous Wi‑Fi also failed");
      wifiRemotePublish(
        "{\"wifiEvent\":\"join\",\"ok\":false,\"error\":\"revert_failed\"}",
        false
      );
    }
  }
  return false;
}

/** Parse WIFI_SET payload. Formats:
 *  WIFI_SET\\nssid\\npassword
 *  WIFI_SET|ssid|password  (password must not contain |)
 */
inline bool wifiRemoteParseSetPayload(
  const char *raw,
  unsigned int len,
  String &ssidOut,
  String &passOut
) {
  String body;
  body.reserve(len + 1);
  for (unsigned int i = 0; i < len; i++) {
    const char c = raw[i];
    if (c == '\0') break;
    body += c;
  }
  body.trim();

  if (body.startsWith("WIFI_SET\n") || body.startsWith("WIFI_SET\r\n")) {
    int start = body.indexOf('\n');
    if (start < 0) return false;
    String rest = body.substring(start + 1);
    if (rest.startsWith("\n")) rest = rest.substring(1);
    const int nl = rest.indexOf('\n');
    if (nl < 0) {
      ssidOut = rest;
      passOut = "";
      return ssidOut.length() > 0;
    }
    ssidOut = rest.substring(0, nl);
    passOut = rest.substring(nl + 1);
    // strip trailing CR
    if (passOut.endsWith("\r")) passOut.remove(passOut.length() - 1);
    if (ssidOut.endsWith("\r")) ssidOut.remove(ssidOut.length() - 1);
    return ssidOut.length() > 0;
  }

  if (body.startsWith("WIFI_SET|")) {
    const int p1 = body.indexOf('|');
    const int p2 = body.indexOf('|', p1 + 1);
    if (p1 < 0 || p2 < 0) return false;
    ssidOut = body.substring(p1 + 1, p2);
    passOut = body.substring(p2 + 1);
    return ssidOut.length() > 0;
  }

  return false;
}
