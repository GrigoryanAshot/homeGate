/**
 * Publish OPEN to demo-gate-001 — proves HiveMQ accepts Gate1 credentials.
 * Does not prove ESP is subscribed (watch Serial / gate for that).
 *
 *   npx tsx scripts/mqtt-ping-open.ts
 */
import mqtt from "mqtt";

const host = "3c391676ced3426b8300afc7d6b4961e.s1.eu.hivemq.cloud";
const topic = "home/gate/demo-gate-001/command";
const statusTopic = "home/gate/demo-gate-001/status";

const client = mqtt.connect(`wss://${host}:8884/mqtt`, {
  username: "Gate1",
  password: "Ash7289...",
  protocolVersion: 4,
  connectTimeout: 15_000,
});

client.on("connect", () => {
  console.log("Broker OK — subscribed status, publishing OPEN");
  client.subscribe(statusTopic);
  client.publish(topic, "OPEN", { qos: 0 }, (err) => {
    if (err) console.error("publish err", err);
    else console.log("Published OPEN →", topic);
  });
  setTimeout(() => {
    console.log("(If ESP is subscribed, Serial shows MQTT command + gate moves)");
    client.end();
    process.exit(0);
  }, 4000);
});

client.on("message", (t, payload) => {
  console.log("STATUS:", t, payload.toString());
});

client.on("error", (e) => {
  console.error("MQTT error", e);
  process.exit(1);
});
