import { NextResponse } from "next/server";
import mqtt from "mqtt";
import { getSessionUser } from "@/lib/auth/server";
import { assertDeviceOwnedBy } from "@/lib/db/shares";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ deviceId: string }> };

function brokerUrl() {
  const host =
    process.env.NEXT_PUBLIC_MQTT_HOST ||
    "3c391676ced3426b8300afc7d6b4961e.s1.eu.hivemq.cloud";
  const port = Number(process.env.NEXT_PUBLIC_MQTT_PORT || 8884);
  const path = process.env.NEXT_PUBLIC_MQTT_PATH || "/mqtt";
  return `wss://${host}:${port}${path}`;
}

/**
 * Owner → cloud → HiveMQ → ESP.
 * More reliable than depending on the phone browser to publish MQTT.
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "auth_required" },
        { status: 401 },
      );
    }

    const { deviceId: rawId } = await ctx.params;
    const deviceId = decodeURIComponent(rawId ?? "").trim();
    if (!deviceId) {
      return NextResponse.json(
        { ok: false, error: "missing_device" },
        { status: 400 },
      );
    }

    const owned = await assertDeviceOwnedBy(deviceId, session.id);
    if (!owned) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as { action?: string };
    const action = (body.action || "").toUpperCase().trim();
    if (action !== "OPEN" && action !== "CLOSE" && action !== "STOP") {
      return NextResponse.json(
        { ok: false, error: "invalid_action" },
        { status: 400 },
      );
    }

    // Match app SWAP_OPEN_CLOSE_MQTT (opto wiring reversed on this hardware)
    const wire =
      action === "OPEN" ? "CLOSE" : action === "CLOSE" ? "OPEN" : "STOP";

    const prefix =
      process.env.NEXT_PUBLIC_MQTT_TOPIC_PREFIX?.replace(/\/$/, "") ||
      "home/gate";
    const topic = `${prefix}/${deviceId}/command`;

    const username = process.env.NEXT_PUBLIC_MQTT_USER || "Gate1";
    const password = process.env.NEXT_PUBLIC_MQTT_PASS || "Ash7289...";

    await new Promise<void>((resolve, reject) => {
      const client = mqtt.connect(brokerUrl(), {
        username,
        password,
        protocolVersion: 4,
        connectTimeout: 10000,
        clientId: `sg-cmd-${Math.random().toString(16).slice(2, 10)}`,
      });

      const timer = setTimeout(() => {
        try {
          client.end(true);
        } catch {
          /* ignore */
        }
        reject(new Error("mqtt_timeout"));
      }, 12000);

      client.on("error", (err) => {
        clearTimeout(timer);
        try {
          client.end(true);
        } catch {
          /* ignore */
        }
        reject(err);
      });

      client.on("connect", () => {
        client.publish(topic, wire, { qos: 1 }, (err) => {
          clearTimeout(timer);
          try {
            client.end(true);
          } catch {
            /* ignore */
          }
          if (err) reject(err);
          else resolve();
        });
      });
    });

    return NextResponse.json({ ok: true, topic, action, wire });
  } catch (e) {
    console.error("[devices/command]", e);
    return NextResponse.json(
      { ok: false, error: "publish_failed" },
      { status: 502 },
    );
  }
}
