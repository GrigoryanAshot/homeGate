/**
 * Listen 40s for ESP status heartbeat (firmware publishes ~every 30s when MQTT up).
 *
 *   npx tsx scripts/mqtt-watch-status.ts
 */
import mqtt from "mqtt";

const host = "3c391676ced3426b8300afc7d6b4961e.s1.eu.hivemq.cloud";
const status = "home/gate/demo-gate-001/status";
const command = "home/gate/demo-gate-001/command";

const client = mqtt.connect(`wss://${host}:8884/mqtt`, {
  username: "Gate1",
  password: "Ash7289...",
  protocolVersion: 4,
});

let count = 0;
client.on("connect", () => {
  console.log("watching", status);
  client.subscribe(status, { qos: 1 });
  setTimeout(() => {
    console.log("ping OPEN at t=5s");
    client.publish(command, "OPEN", { qos: 1 });
  }, 5000);
  setTimeout(() => {
    console.log(`\nHeard ${count} status message(s) in 40s`);
    if (count <= 1) {
      console.log("VERDICT: ESP not live on MQTT (only retained ghost, or silent).");
    } else {
      console.log("VERDICT: ESP is publishing — command path should work.");
    }
    client.end();
    process.exit(0);
  }, 40000);
});

client.on("message", (_t, payload) => {
  count++;
  console.log(`[${new Date().toISOString()}] #${count} ${payload.toString()}`);
});
