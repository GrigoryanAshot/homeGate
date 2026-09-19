/**
 * Publish OPEN to demo-gate-001 (same path as server relay).
 *   npx tsx scripts/mqtt-pub-open.ts
 */
import fs from "fs";
import mqtt from "mqtt";

function readPass(): string {
  for (const file of [".env.local", ".env"]) {
    try {
      const text = fs.readFileSync(file, "utf8");
      for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^NEXT_PUBLIC_MQTT_PASS=(.*)$/);
        if (m) {
          let v = m[1].trim();
          if (
            (v.startsWith('"') && v.endsWith('"')) ||
            (v.startsWith("'") && v.endsWith("'"))
          ) {
            v = v.slice(1, -1);
          }
          return v;
        }
      }
    } catch {
      /* try next */
    }
  }
  return "Ash7289...";
}

const host =
  process.env.NEXT_PUBLIC_MQTT_HOST ||
  "3c391676ced3426b8300afc7d6b4961e.s1.eu.hivemq.cloud";
const user = process.env.NEXT_PUBLIC_MQTT_USER || "Gate1";
const pass = readPass();
const topic = "home/gate/demo-gate-001/command";

console.log("passLen", pass.length, "topic", topic);

const client = mqtt.connect(`wss://${host}:8884/mqtt`, {
  username: user,
  password: pass,
  protocolVersion: 4,
});

client.on("connect", () => {
  console.log("connected — publishing CLOSE then OPEN (swap wiring)");
  // App/API swap: UI OPEN → wire CLOSE for this opto board
  client.publish(topic, "CLOSE", { qos: 1 }, (e1) => {
    console.log("pub CLOSE (UI OPEN)", e1 || "ok");
    setTimeout(() => {
      client.publish(topic, "OPEN", { qos: 1 }, (e2) => {
        console.log("pub OPEN (UI CLOSE)", e2 || "ok");
        setTimeout(() => {
          client.end();
          process.exit(0);
        }, 500);
      });
    }, 2000);
  });
});

client.on("error", (e) => {
  console.error(e);
  process.exit(1);
});
