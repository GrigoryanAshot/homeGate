"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mqtt, { MqttClient } from "mqtt";
import type {
  ConnectionStatus,
  GateCommand,
  GateState,
  MqttConfig,
} from "@/lib/smartgate/types";
import { getMqttConfig, getMqttConfigForGate } from "@/lib/smartgate/types";

interface UseSmartGateMqttOptions {
  mockMode: boolean;
  gateId?: string;
  onCommandSent?: (command: GateCommand) => void;
  onStateFromBroker?: (state: GateState) => void;
}

export function useSmartGateMqtt({
  mockMode,
  gateId,
  onCommandSent,
  onStateFromBroker,
}: UseSmartGateMqttOptions) {
  const clientRef = useRef<MqttClient | null>(null);
  const configRef = useRef<MqttConfig>(
    gateId ? getMqttConfigForGate(gateId) : getMqttConfig(),
  );
  const [connection, setConnection] = useState<ConnectionStatus>("connecting");
  const [gateState, setGateState] = useState<GateState>("unknown");
  const [busy, setBusy] = useState(false);

  const simulateTransition = useCallback((command: GateCommand) => {
    if (command === "OPEN") {
      setGateState("opening");
      window.setTimeout(() => setGateState("open"), 2400);
    } else if (command === "CLOSE") {
      setGateState("closing");
      window.setTimeout(() => setGateState("closed"), 2400);
    } else {
      setGateState("stopped");
    }
  }, []);

  useEffect(() => {
    if (mockMode) {
      if (clientRef.current) {
        clientRef.current.end(true);
        clientRef.current = null;
      }
      setConnection("online");
      if (gateState === "unknown") setGateState("closed");
      return;
    }

    const config = gateId ? getMqttConfigForGate(gateId) : getMqttConfig();
    configRef.current = config;

    if (!config.host || !config.username) {
      setConnection("offline");
      return;
    }

    setConnection("connecting");
    const url = `wss://${config.host}:${config.port}${config.path}`;
    const client = mqtt.connect(url, {
      username: config.username,
      password: config.password,
      clientId: `smartgate-demo-${Math.random().toString(16).slice(2, 10)}`,
      reconnectPeriod: 3000,
      connectTimeout: 15000,
    });

    clientRef.current = client;

    client.on("connect", () => {
      setConnection("online");
      client.subscribe(config.topicStatus, { qos: 1 });
    });

    client.on("reconnect", () => setConnection("connecting"));
    client.on("close", () => setConnection("offline"));
    client.on("error", () => setConnection("offline"));

    client.on("message", (topic, payload) => {
      if (topic !== config.topicStatus) return;
      try {
        const data = JSON.parse(payload.toString()) as { state?: GateState };
        if (data.state) {
          setGateState(data.state);
          onStateFromBroker?.(data.state);
        }
      } catch {
        /* ignore malformed payloads */
      }
    });

    return () => {
      client.end(true);
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockMode, gateId]);

  useEffect(() => {
    setBusy(false);
  }, [gateId]);

  const sendCommand = useCallback(
    (command: GateCommand) => {
      if (busy) return false;
      setBusy(true);
      onCommandSent?.(command);

      if (mockMode) {
        simulateTransition(command);
        window.setTimeout(() => setBusy(false), 500);
        return true;
      }

      const client = clientRef.current;
      const config = configRef.current;
      if (!client?.connected) {
        setBusy(false);
        return false;
      }

      client.publish(config.topicCommand, command, { qos: 1 }, () => {
        setBusy(false);
      });
      return true;
    },
    [busy, mockMode, onCommandSent, simulateTransition],
  );

  return {
    connection,
    gateState,
    setGateState,
    busy,
    sendCommand,
    mqttConfigured: Boolean(configRef.current.host && configRef.current.username),
  };
}
