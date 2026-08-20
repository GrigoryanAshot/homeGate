# HomeGate

Mobile-friendly Armenian web UI + ESP32-S3 firmware to open/close a rollup door by shorting the original RF remote button pads.

## Hardware

- ESP32-S3
- Existing rollup-door RF remote (keep CR2032)
- 5V USB-C power for the ESP32 only (door 220V stays unchanged)

### Wiring

| ESP32 | Remote |
|-------|--------|
| GPIO 4 | Open pad 1 |
| GPIO 5 | Open pad 2 |
| GPIO 6 | Close pad 1 |
| GPIO 7 | Close pad 2 |

On press, each pair is briefly shorted (both pins LOW).

## Firmware

1. Open `firmware/HomeGate/HomeGate.ino` in Arduino IDE
2. Install **esp32** by Espressif
3. Set Wi‑Fi in `firmware/HomeGate/config.h`
4. Board: **ESP32S3 Dev Module**, USB CDC On Boot: **Enabled**
5. Upload (use BOOT + RESET if needed)
6. Open the printed IP on your phone, e.g. `http://10.0.1.8`

If Wi‑Fi fails, the board opens AP `HomeGate` / `homegate` at `http://192.168.4.1`.

## App password

Set `APP_PASSWORD` in `firmware/HomeGate/config.h` (default `homegate`), flash the board, then enter the same password on the phone lock screen.

## Deploy UI to Vercel

1. Import the GitHub repo in Vercel (static site, root directory `.`)
2. Open the live URL on your phone (home Wi‑Fi)
3. Enter the app password
4. Settings → ESP32 address → `http://YOUR_ESP_IP`

The door API stays on the ESP32; Vercel only hosts the UI.
