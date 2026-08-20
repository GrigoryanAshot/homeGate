#pragma once

// -----------------------------------------------------------------------------
// Home Wi-Fi (ESP32 outbound only — no local server required)
// -----------------------------------------------------------------------------
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASS "YOUR_WIFI_PASSWORD"

// -----------------------------------------------------------------------------
// HiveMQ Cloud (free) — MQTT over TLS
// Console: https://console.hivemq.cloud/
// Cluster → MQTT Credentials + Cluster URL
// -----------------------------------------------------------------------------
#define MQTT_HOST "xxxxxxxx.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USER "your-mqtt-username"
#define MQTT_PASS "your-mqtt-password"
#define MQTT_CLIENT_ID "homegate-esp32"

// Topics
#define TOPIC_COMMAND "home/gate/command"
#define TOPIC_STATUS "home/gate/status"

// -----------------------------------------------------------------------------
// Remote button GPIOs — short both pins LOW = press
// Open  = 4 + 5   |   Close = 6 + 7
// -----------------------------------------------------------------------------
#define PIN_UP_A 4
#define PIN_UP_B 5
#define PIN_DOWN_A 6
#define PIN_DOWN_B 7

#define BUTTON_HOLD 0
#define PULSE_MS 400
#define MOVE_MS 12000

/*
Commands on home/gate/command (payload text):
  OPEN   / UP
  CLOSE  / DOWN
  STOP

ESP publishes JSON on home/gate/status, e.g.:
  {"state":"opening","online":true}

Wiring unchanged: short remote open/close pads with pin pairs.
*/
