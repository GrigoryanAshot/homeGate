#pragma once

// -----------------------------------------------------------------------------
// UNIVERSAL firmware — same .bin for every ESP32-C3 unit
// Arduino: Board "ESP32C3 Dev Module" · USB CDC On Boot: Enabled
// FW_BUILD must appear in Serial after Upload — if missing, wrong sketch was flashed
// -----------------------------------------------------------------------------
#define FW_BUILD "2026-03-24-mqtt-to"

#define FACTORY_WIFI_SSID ""
#define FACTORY_WIFI_PASS ""
#define FACTORY_PRODUCT_ID ""
#define FACTORY_PRODUCT_SECRET ""

#define AP_SSID_PREFIX "TouchGate"
#define AP_PASSWORD "12345678"
#define AP_SSID_FIXED "TGATE"

#define FACTORY_NEW_TOKEN 18
#define FORCE_SOFTAP_ON_BOOT 0

// Outage (AP missing) → retry. AUTH reject → SoftAP.
#define WIFI_RETRY_GAP_MS 30000
#define WIFI_RESET_HOLD_MS 2000

#define ENABLE_SERIAL_WIFI_SETUP 1
#define SERIAL_WIFI_WAIT_MS 0

#define MQTT_HOST "3c391676ced3426b8300afc7d6b4961e.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USER "Gate1"
#define MQTT_PASS "Ash7289..."
// Router DNS often returns 0.0.0.0 — use public DNS + these HiveMQ IPs
#define MQTT_HOST_FALLBACK_IP "46.137.47.218"
#define MQTT_HOST_FALLBACK_IP_2 "52.31.149.80"
#define MQTT_HOST_FALLBACK_IP_3 "54.73.92.158"

#define MQTT_TOPIC_PREFIX "home/gate"

#define ENABLE_CLOUD_REGISTER 1
#define API_BASE_URL "https://1234-plum-nine.vercel.app"

#define ENABLE_NTP_SYNC 0

#define PIN_UP 3
#define PIN_DOWN 5
#define PIN_STOP 10

#define PIN_STOP_BTN 7
#define STOP_BTN_ACTIVE_LOW 1
#define STOP_BTN_DEBOUNCE_MS 40

#define STATUS_LED_PIN 8
#define STATUS_LED_ACTIVE_LOW 1
#define WIFI_RESET_PIN 9

#define PULSE_MS 300
#define MOVE_MS 12000
#define REGISTER_RETRY_MS 20000
#define WIFI_CONNECT_TIMEOUT_MS 40000

// LAN GPIO test: http://<esp-ip>/open — useful while debugging; leave on.
#define ENABLE_LAN_DEBUG_HTTP 1
