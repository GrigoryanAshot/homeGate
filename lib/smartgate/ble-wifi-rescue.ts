/**
 * Emergency BLE Wi‑Fi write when MQTT is down.
 * Chrome Android / desktop — not iOS Safari (needs Capacitor later).
 */

const BLE_WIFI_SERVICE = "7a1e0001-5c4d-4b9a-9c2e-1a2b3c4d5e6f";
const BLE_WIFI_CHAR = "7a1e0002-5c4d-4b9a-9c2e-1a2b3c4d5e6f";

type BleNav = Navigator & {
  bluetooth?: {
    requestDevice: (options: {
      filters?: { namePrefix?: string }[];
      optionalServices?: string[];
      acceptAllDevices?: boolean;
    }) => Promise<BluetoothDeviceLite>;
  };
};

type BluetoothDeviceLite = {
  gatt?: {
    connect: () => Promise<{
      getPrimaryService: (uuid: string) => Promise<{
        getCharacteristic: (uuid: string) => Promise<{
          writeValue: (data: BufferSource) => Promise<void>;
          startNotifications?: () => Promise<unknown>;
        }>;
      }>;
      disconnect: () => void;
    }>;
  };
};

export function bleRescueSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return Boolean((navigator as BleNav).bluetooth?.requestDevice);
}

export async function connectBleAndSendWifi(
  ssid: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const bt = (navigator as BleNav).bluetooth;
  if (!bt?.requestDevice) {
    return { ok: false, error: "BLE not supported in this browser" };
  }

  try {
    const device = await bt.requestDevice({
      filters: [{ namePrefix: "HG-" }],
      optionalServices: [BLE_WIFI_SERVICE],
    });
    const server = await device.gatt?.connect();
    if (!server) return { ok: false, error: "GATT connect failed" };

    const service = await server.getPrimaryService(BLE_WIFI_SERVICE);
    const characteristic = await service.getCharacteristic(BLE_WIFI_CHAR);
    const payload = new TextEncoder().encode(`${ssid.trim()}\n${password}`);
    await characteristic.writeValue(payload);

    // Give ESP time to join; caller shows success/fail from UX timeout
    await new Promise((r) => setTimeout(r, 2500));
    try {
      server.disconnect();
    } catch {
      /* ignore */
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "BLE failed";
    return { ok: false, error: msg };
  }
}
