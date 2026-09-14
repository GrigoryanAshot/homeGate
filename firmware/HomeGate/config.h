#pragma once

// -----------------------------------------------------------------------------
// Board: ESP32-C3 Super Mini — UNIVERSAL firmware (same .bin for all units)
// Arduino IDE → Board: "ESP32C3 Dev Module"
//   USB CDC On Boot: Enabled
// Identity: chip from MAC; product ID from SoftAP sticker (NVS) — not compiled in.
// -----------------------------------------------------------------------------

// Optional factory/dev Wi‑Fi (NVS empty only). Leave empty for SoftAP setup.
#define FACTORY_WIFI_SSID ""
#define FACTORY_WIFI_PASS ""

// Optional compile-time product (dev only). Prefer SoftAP sticker entry.
#define FACTORY_PRODUCT_ID ""
#define FACTORY_PRODUCT_SECRET ""

#define AP_SSID_PREFIX "TouchGate"
#define AP_PASSWORD ""

#define MQTT_HOST "3c391676ced3426b8300afc7d6b4961e.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USER "Gate1"
#define MQTT_PASS "Ash7289..."
// Used only when DNS returns 0.0.0.0 (some home routers break DNS for IoT)
#define MQTT_HOST_FALLBACK_IP "46.137.47.218"

// Topics: {MQTT_TOPIC_PREFIX}/{productId}/command|status
#define MQTT_TOPIC_PREFIX "home/gate"

// Cloud register after home Wi‑Fi (HTTPS). Set your Vercel URL.
#define ENABLE_CLOUD_REGISTER 1
#define API_BASE_URL "https://1234-plum-nine.vercel.app"

#define ENABLE_NTP_SYNC 0

// PC817 optocouplers — one GPIO each (HIGH = press)
#define PIN_UP 3
#define PIN_DOWN 5
#define PIN_STOP 10

#define PIN_STOP_BTN 7
#define STOP_BTN_ACTIVE_LOW 1
#define STOP_BTN_DEBOUNCE_MS 40

#define STATUS_LED_PIN 8
#define STATUS_LED_ACTIVE_LOW 1
#define WIFI_RESET_PIN 9

#define PULSE_MS 180
#define MOVE_MS 12000
#define REGISTER_RETRY_MS 20000
#define WIFI_CONNECT_TIMEOUT_MS 25000
#define WIFI_RESET_HOLD_MS 3500
