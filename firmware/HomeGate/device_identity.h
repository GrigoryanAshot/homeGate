#pragma once

/*
  Universal production identity:
  - chipId: from MAC, permanent in NVS
  - productId + secret: from sticker via SoftAP
  MQTT: home/gate/{productId}/command|status
*/

#include <Preferences.h>
#include <WiFi.h>
#include <Arduino.h>
#include "config.h"

inline Preferences &devicePrefs() {
  static Preferences p;
  return p;
}

inline String &deviceChipIdRef() {
  static String chip;
  return chip;
}
inline String &deviceProductIdRef() {
  static String id;
  return id;
}
inline String &deviceProductSecretRef() {
  static String secret;
  return secret;
}
inline char *deviceTopicCommandBuf() {
  static char buf[96];
  return buf;
}
inline char *deviceTopicStatusBuf() {
  static char buf[96];
  return buf;
}
inline char *deviceMqttClientIdBuf() {
  static char buf[48];
  return buf;
}

inline String deviceChipIdFromMac() {
  const uint64_t mac = ESP.getEfuseMac();
  char buf[24];
  snprintf(
    buf,
    sizeof(buf),
    "hg-%04X%08lX",
    (unsigned)((mac >> 32) & 0xFFFF),
    (unsigned long)(mac & 0xFFFFFFFFUL)
  );
  return String(buf);
}

inline void deviceRebuildTopics() {
  const String &product = deviceProductIdRef();
  const String &chip = deviceChipIdRef();
  const String &id = product.length() > 0 ? product : chip;
  snprintf(
    deviceTopicCommandBuf(),
    96,
    "%s/%s/command",
    MQTT_TOPIC_PREFIX,
    id.c_str()
  );
  snprintf(
    deviceTopicStatusBuf(),
    96,
    "%s/%s/status",
    MQTT_TOPIC_PREFIX,
    id.c_str()
  );
  snprintf(deviceMqttClientIdBuf(), 48, "hg-%s", chip.c_str());
}

inline void deviceLoadIdentity() {
  Preferences &prefs = devicePrefs();
  prefs.begin("homegate", true);
  deviceChipIdRef() = prefs.getString("chipId", "");
  deviceProductIdRef() = prefs.getString("productId", "");
  deviceProductSecretRef() = prefs.getString("productSecret", "");
  prefs.end();

  if (deviceChipIdRef().length() == 0) {
    deviceChipIdRef() = deviceChipIdFromMac();
    prefs.begin("homegate", false);
    prefs.putString("chipId", deviceChipIdRef());
    prefs.end();
  }

  if (deviceProductIdRef().length() == 0 && strlen(FACTORY_PRODUCT_ID) > 0) {
    deviceProductIdRef() = FACTORY_PRODUCT_ID;
    deviceProductSecretRef() = FACTORY_PRODUCT_SECRET;
  }

  deviceRebuildTopics();
}

inline void deviceSaveProduct(const String &productId, const String &secret) {
  deviceProductIdRef() = productId;
  deviceProductSecretRef() = secret;
  Preferences &prefs = devicePrefs();
  prefs.begin("homegate", false);
  prefs.putString("chipId", deviceChipIdRef());
  prefs.putString("productId", deviceProductIdRef());
  prefs.putString("productSecret", deviceProductSecretRef());
  prefs.end();
  deviceRebuildTopics();
}

inline bool deviceHasProduct() {
  return deviceProductIdRef().length() > 0 &&
         deviceProductSecretRef().length() > 0;
}

inline void deviceClearProduct() {
  deviceProductIdRef() = "";
  deviceProductSecretRef() = "";
  Preferences &prefs = devicePrefs();
  prefs.begin("homegate", false);
  prefs.remove("productId");
  prefs.remove("productSecret");
  prefs.end();
  deviceRebuildTopics();
}

#define DEVICE_CHIP_ID (deviceChipIdRef().c_str())
#define DEVICE_PRODUCT_ID (deviceProductIdRef().c_str())
#define DEVICE_PRODUCT_SECRET (deviceProductSecretRef().c_str())
#define TOPIC_COMMAND (deviceTopicCommandBuf())
#define TOPIC_STATUS (deviceTopicStatusBuf())
#define MQTT_CLIENT_ID_RUNTIME (deviceMqttClientIdBuf())
