# HomeGate (Cloud MQTT)

ESP32-S3 keeps an **outbound TLS MQTT** connection to a free cloud broker (HiveMQ Cloud).  
Phone / Vercel page publishes commands over **Secure WebSockets** from anywhere.

**No PC tunnel. No local MQTT broker. No Raspberry Pi.**

```
Phone / Vercel (mqtt.js WSS :8884)
        ↕
  HiveMQ Cloud (free)
        ↕
ESP32 on home Wi‑Fi (MQTT TLS :8883)
        → shorts remote OPEN/CLOSE pads
```

## 1. Create HiveMQ Cloud (free)

1. Sign up: https://console.hivemq.cloud/
2. Create a cluster
3. Create MQTT credentials (username + password)
4. Copy the cluster hostname, e.g. `xxxx.s1.eu.hivemq.cloud`

## 2. ESP32 firmware

Arduino Library Manager → install **PubSubClient** (Nick O'Leary).

Edit `firmware/HomeGate/config.h`:

```c
#define WIFI_SSID "your-wifi"
#define WIFI_PASS "your-wifi-password"
#define MQTT_HOST "xxxx.s1.eu.hivemq.cloud"
#define MQTT_USER "..."
#define MQTT_PASS "..."
```

Board: **ESP32S3 Dev Module** → Upload.

Serial (115200) should show `MQTT connected, subscribed to home/gate/command`.

### Topics

| Topic | Direction | Payload |
|-------|-----------|---------|
| `home/gate/command` | web → ESP | `OPEN` / `CLOSE` / `STOP` |
| `home/gate/status` | ESP → web | `{"state":"opening","online":true}` |

### Wiring (unchanged)

| ESP32 | Remote |
|-------|--------|
| GPIO 4 + 5 | Open pads |
| GPIO 6 + 7 | Close pads |

## 3. Web app (anywhere / Vercel)

1. Copy `js/mqtt-config.example.js` → `js/mqtt-config.js` and fill host/user/pass  
   **or** open the page → gear icon → enter broker details (saved in the browser)
2. Deploy the static folder to Vercel, or open `index.html` locally
3. Tap **Բարձրացնել** → publishes `OPEN`

Uses [mqtt.js](https://github.com/mqttjs/MQTT.js) over `wss://HOST:8884/mqtt`.

### React

See `examples/GateMqttControl.jsx` (`npm i mqtt`).

## Security notes

- Anyone with your MQTT user/password can open the door — use a strong password.
- Prefer unique credentials only for this gate.
- ESP uses `setInsecure()` for TLS bootstrap; you can pin ISRG Root X1 later.
