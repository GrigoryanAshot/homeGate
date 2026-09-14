/**
 * Send OPEN/CLOSE and watch status for 15s — proves ESP command path.
 *
 *   npx tsx scripts/mqtt-debug-commands.ts
 */
import mqtt from "mqtt";

const host = "3c391676ced3426b8300afc7d6b4961e.s1.eu.hivemq.cloud";
const command = "home/gate/demo-gate-001/command";
const status = "home/gate/demo-gate-001/status";

const client = mqtt.connect(`wss://${host}:8884/mqtt`, {
  username: "Gate1",
  password: "Ash7289...",
  protocolVersion: 4,
  connectTimeout: 15_000,
});

function pub(cmd: string) {
  console.log(`\n→ publish ${cmd}`);
  client.publish(command, cmd, { qos: 1 });
}

client.on("connect", () => {
  console.log("connected");
  client.subscribe(status, { qos: 1 });
  setTimeout(() => pub("OPEN"), 1000);
  setTimeout(() => pub("CLOSE"), 5000);
  setTimeout(() => pub("STOP"), 9000);
  setTimeout(() => {
    console.log("\ndone");
    client.end();
    process.exit(0);
  }, 14000);
});

client.on("message", (t, payload) => {
  console.log(`[${new Date().toISOString()}] ${t}: ${payload.toString()}`);
});

client.on("error", (e) => {
  console.error(e);
  process.exit(1);
});
