#pragma once

// -----------------------------------------------------------------------------
// Wi-Fi — put your real network here before flashing
// -----------------------------------------------------------------------------
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASS "YOUR_WIFI_PASSWORD"

#define AP_NAME "HomeGate"
#define AP_PASS "homegate"

#define MDNS_NAME "homegate"

// App / API password (sent as X-Gate-Key header)
#define APP_PASSWORD "homegate"

// -----------------------------------------------------------------------------
// Each remote button uses 2 ESP pins. On press, both pins go LOW = shorted.
// Open  = short pin 4 with pin 5
// Close = short pin 6 with pin 7
// -----------------------------------------------------------------------------
#define PIN_UP_A 4
#define PIN_UP_B 5
#define PIN_DOWN_A 6
#define PIN_DOWN_B 7

// 0 = one short press
// 1 = hold until Stop
#define BUTTON_HOLD 0

// How long the short lasts (milliseconds)
#define PULSE_MS 400

#define MOVE_MS 12000

/*
WIRING (no optocoupler)

Open (Up) button on remote:
  one pad  -> ESP pin 4
  other pad -> ESP pin 5

Close (Down) button on remote:
  one pad  -> ESP pin 6
  other pad -> ESP pin 7

Idle: pins are disconnected (INPUT).
Press: both pins of that pair go LOW for PULSE_MS = pads shorted once.
Release: pins disconnect again.

Power ESP from USB charger only. Do not touch door 220V.
No need to solder ESP GND to the remote for this method.

If open/close are swapped, swap the two pairs of wires.
If press is too short, raise PULSE_MS (try 800).
*/
