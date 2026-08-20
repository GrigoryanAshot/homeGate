/**
 * React example — same HiveMQ Cloud broker over Secure WebSockets.
 * npm i mqtt
 *
 * Usage:
 *   <GateMqttControl
 *     host="xxxx.s1.eu.hivemq.cloud"
 *     username="..."
 *     password="..."
 *   />
 */
import { useEffect, useRef, useState } from "react";
import mqtt from "mqtt";

const TOPIC_COMMAND = "home/gate/command";
const TOPIC_STATUS = "home/gate/status";

export function GateMqttControl({
  host,
  username,
  password,
  port = 8884,
  path = "/mqtt",
}) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState("unknown");

  useEffect(() => {
    if (!host || !username) return undefined;

    const url = `wss://${host}:${port}${path}`;
    const client = mqtt.connect(url, {
      username,
      password,
      clientId: "homegate-react-" + Math.random().toString(16).slice(2),
      reconnectPeriod: 3000,
    });
    clientRef.current = client;

    client.on("connect", () => {
      setConnected(true);
      client.subscribe(TOPIC_STATUS, { qos: 1 });
    });
    client.on("close", () => setConnected(false));
    client.on("message", (topic, payload) => {
      if (topic !== TOPIC_STATUS) return;
      try {
        const data = JSON.parse(payload.toString());
        if (data.state) setState(data.state);
      } catch (_) {}
    });

    return () => {
      client.end(true);
      clientRef.current = null;
    };
  }, [host, username, password, port, path]);

  function send(command) {
    clientRef.current?.publish(TOPIC_COMMAND, command, { qos: 1 });
  }

  return (
    <div>
      <p>{connected ? "MQTT online" : "MQTT offline"} — {state}</p>
      <button type="button" onClick={() => send("OPEN")} disabled={!connected}>
        OPEN
      </button>
      <button type="button" onClick={() => send("CLOSE")} disabled={!connected}>
        CLOSE
      </button>
      <button type="button" onClick={() => send("STOP")} disabled={!connected}>
        STOP
      </button>
    </div>
  );
}
