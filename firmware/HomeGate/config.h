#pragma once

// -----------------------------------------------------------------------------
// Board: ESP32-C3 Super Mini
// Arduino IDE → Board: "ESP32C3 Dev Module"
//   USB CDC On Boot: Enabled
// -----------------------------------------------------------------------------

// Optional factory/dev Wi‑Fi (NVS empty only). Leave empty for SoftAP setup.
#define FACTORY_WIFI_SSID ""
#define FACTORY_WIFI_PASS ""

#define AP_SSID_PREFIX "TouchGate"
#define AP_PASSWORD ""

#define MQTT_HOST "3c391676ced3426b8300afc7d6b4961e.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USER "Gate1"
#define MQTT_PASS "Ash7289..."
#define MQTT_CLIENT_ID "homegate-c3"

#define DEVICE_ID "demo-gate-001"
#define DEVICE_SECRET "secret-demo-001"

// Cloud device register (HTTP). Keep OFF for snappy MQTT like the old S3 firmware.
// LAN URLs that are offline block the chip for 10–15s and delay Open/Stop/Close.
#define ENABLE_CLOUD_REGISTER 0
#define API_BASE_URL "http://192.168.1.100:3000"

// NTP is optional (TLS works with setInsecure without it)
#define ENABLE_NTP_SYNC 0

#define TOPIC_COMMAND "home/gate/command"
#define TOPIC_STATUS "home/gate/status"

// PC817 optocouplers — one GPIO each (HIGH = press)
// UP=3  DOWN=5  STOP=10
#define PIN_UP 3
#define PIN_DOWN 5
#define PIN_STOP 10

// Optional local STOP pushbutton → GND (set -1 to disable)
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
