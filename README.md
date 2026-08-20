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

## Web UI

Frontend files live in the project root (`index.html`, `css/`, `js/`).  
After editing them, rebuild the packed header:

```bash
node tools/pack_web.js
```

Then re-upload the firmware.
