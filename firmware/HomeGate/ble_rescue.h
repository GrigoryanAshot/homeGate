#pragma once

/**
 * Emergency BLE Wi‑Fi rescue when home Wi‑Fi has been down ≥ BLE_RESCUE_AFTER_MS
 * and the device already has a product claim.
 *
 * Advertise: HG-<chipSuffix>
 * Write characteristic (UTF-8): ssid\\npassword
 * Notify: OK / FAIL:<reason>
 *
 * Requires: ESP32 BLE Arduino (included with ESP32 board package).
 */

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <WiFi.h>
#include "config.h"
#include "device_identity.h"
#include "wifi_provision.h"
#include "wifi_remote.h"

#ifndef BLE_RESCUE_AFTER_MS
#define BLE_RESCUE_AFTER_MS 60000
#endif

#define BLE_WIFI_SERVICE_UUID "7a1e0001-5c4d-4b9a-9c2e-homegate0001"
#define BLE_WIFI_CHAR_UUID    "7a1e0002-5c4d-4b9a-9c2e-homegate0001"

// BLE UUID must be valid hex — fix UUIDs to proper format
#undef BLE_WIFI_SERVICE_UUID
#undef BLE_WIFI_CHAR_UUID
#define BLE_WIFI_SERVICE_UUID "7a1e0001-5c4d-4b9a-9c2e-1a2b3c4d5e6f"
#define BLE_WIFI_CHAR_UUID    "7a1e0002-5c4d-4b9a-9c2e-1a2b3c4d5e6f"

inline bool &bleRescueActive() {
  static bool v = false;
  return v;
}

inline uint32_t &bleWifiDownSince() {
  static uint32_t v = 0;
  return v;
}

inline BLECharacteristic *&bleWifiChar() {
  static BLECharacteristic *c = nullptr;
  return c;
}

inline String &blePendingPayload() {
  static String s;
  return s;
}

inline bool &bleHasPending() {
  static bool v = false;
  return v;
}

class BleWifiCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *ch) override {
    // ESP32 Arduino 2.x: std::string · 3.x NimBLE: String — both have c_str()
    String body = String(ch->getValue().c_str());
    body.trim();
    if (body.length() == 0) return;
    blePendingPayload() = body;
    bleHasPending() = true;
    Serial.print("BLE Wi‑Fi write len=");
    Serial.println(body.length());
  }
};

class BleServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *s) override {
    Serial.println("BLE client connected");
  }
  void onDisconnect(BLEServer *s) override {
    Serial.println("BLE client disconnected — re-advertise");
    if (bleRescueActive()) {
      s->startAdvertising();
    }
  }
};

inline void bleRescueStop() {
  if (!bleRescueActive()) return;
  Serial.println("BLE rescue OFF");
  BLEDevice::deinit(true);
  bleWifiChar() = nullptr;
  bleRescueActive() = false;
}

inline void bleRescueStart() {
  if (bleRescueActive()) return;
  if (!deviceHasProduct()) return;

  String name = "HG-";
  const char *chip = DEVICE_CHIP_ID;
  const size_t n = strlen(chip);
  if (n >= 4) name += (chip + (n - 4));
  else name += chip;

  Serial.print("BLE rescue ON as ");
  Serial.println(name);

  BLEDevice::init(name.c_str());
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new BleServerCallbacks());

  BLEService *svc = server->createService(BLE_WIFI_SERVICE_UUID);
  BLECharacteristic *ch = svc->createCharacteristic(
    BLE_WIFI_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE |
      BLECharacteristic::PROPERTY_WRITE_NR |
      BLECharacteristic::PROPERTY_NOTIFY
  );
  ch->setCallbacks(new BleWifiCallbacks());
  ch->addDescriptor(new BLE2902());
  bleWifiChar() = ch;
  svc->start();

  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(BLE_WIFI_SERVICE_UUID);
  adv->setScanResponse(true);
  adv->start();

  bleRescueActive() = true;
}

inline void bleRescueNotify(const char *msg) {
  if (!bleWifiChar()) return;
  bleWifiChar()->setValue(msg);
  bleWifiChar()->notify();
}

/** Apply pending BLE Wi‑Fi write (call from loop, not from BLE callback). */
inline void bleRescuePollApply() {
  if (!bleHasPending()) return;
  bleHasPending() = false;
  String body = blePendingPayload();
  blePendingPayload() = "";

  String ssid;
  String pass;
  const int nl = body.indexOf('\n');
  if (nl < 0) {
    ssid = body;
    pass = "";
  } else {
    ssid = body.substring(0, nl);
    pass = body.substring(nl + 1);
    if (pass.endsWith("\r")) pass.remove(pass.length() - 1);
    if (ssid.endsWith("\r")) ssid.remove(ssid.length() - 1);
  }
  ssid.trim();

  if (ssid.length() == 0) {
    bleRescueNotify("FAIL:empty");
    return;
  }

  Serial.print("BLE apply SSID=");
  Serial.println(ssid);
  bleRescueNotify("TRYING");

  // Prefer wifiRemoteApplySet so we still try/revert if old creds exist
  const bool ok = wifiRemoteApplySet(ssid, pass);
  if (ok) {
    bleRescueNotify("OK");
    delay(300);
    bleRescueStop();
  } else {
    bleRescueNotify("FAIL:join");
  }
}

/**
 * Call every loop when STA is down and product is claimed.
 * Starts BLE after BLE_RESCUE_AFTER_MS continuous failure.
 */
inline void bleRescuePoll(bool wifiUp) {
  if (!deviceHasProduct()) {
    bleWifiDownSince() = 0;
    if (bleRescueActive()) bleRescueStop();
    return;
  }

  if (wifiUp) {
    bleWifiDownSince() = 0;
    if (bleRescueActive()) bleRescueStop();
    bleRescuePollApply(); // still flush pending if any
    return;
  }

  if (bleWifiDownSince() == 0) bleWifiDownSince() = millis();
  const uint32_t downFor = millis() - bleWifiDownSince();
  if (!bleRescueActive() && downFor >= BLE_RESCUE_AFTER_MS) {
    bleRescueStart();
  }
  bleRescuePollApply();
}
