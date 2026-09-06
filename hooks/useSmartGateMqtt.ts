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

/** Match firmware MOVE_MS — UI settle only, never blocks buttons */
const MOVE_SETTLE_MS = 12_000;

const MOTION_STATES = new Set<GateState>(["opening", "closing"]);

interface UseSmartGateMqttOptions {
  mockMode: boolean;
  gateId?: string;
  configEpoch?: number;
  onCommandSent?: (command: GateCommand) => void;
}

function settleMotion(state: GateState): GateState {
  if (state === "opening") return "open";
  if (state === "closing") return "closed";
  return state;
}

export function useSmartGateMqtt({
  mockMode,
  gateId,
  configEpoch = 0,
  onCommandSent,
}: UseSmartGateMqttOptions) {
  const clientRef = useRef<MqttClient | null>(null);
  const configRef = useRef<MqttConfig>(getMqttConfig());
  const lastCommandAtRef = useRef(0);
  const settleTimerRef = useRef<number | null>(null);
  const onCommandSentRef = useRef(onCommandSent);
  onCommandSentRef.current = onCommandSent;

  const [connection, setConnection] = useState<ConnectionStatus>("connecting");
  const [gateState, setGateState] = useState<GateState>("closed");
  const [mqttConfigured, setMqttConfigured] = useState(false);

  const clearSettleTimer = useCallback(() => {
    if (settleTimerRef.current != null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (mockMode) {
      if (clientRef.current) {
        clientRef.current.end(true);
        clientRef.current = null;
      }
      setConnection("online");
      setMqttConfigured(true);
      setGateState("closed");
      return;
    }

    const config = gateId ? getMqttConfigForGate(gateId) : getMqttConfig();
    configRef.current = config;
    const configured = Boolean(config.host && config.username);
    setMqttConfigured(configured);

    if (!configured) {
      setConnection("offline");
      return;
    }

    setConnection("connecting");
    const url = `wss://${config.host}:${config.port}${config.path}`;
    const client = mqtt.connect(url, {
      username: config.username,
      password: config.password,
      clientId: `smartgate-${Math.random().toString(16).slice(2, 10)}`,
      reconnectPeriod: 4000,
      connectTimeout: 15000,
      resubscribe: true,
    });

    clientRef.current = client;

    const clearStaleRetained = (settled: GateState) => {
      try {
        client.publish(
          config.topicStatus,
          JSON.stringify({ state: settled, online: true, source: "app-correct" }),
          { qos: 0, retain: true },
        );
      } catch {
        /* ignore */
      }
    };

    const onBrokerState = (raw: GateState) => {
      const recentCommand =
        Date.now() - lastCommandAtRef.current < MOVE_SETTLE_MS;

      if (MOTION_STATES.has(raw) && !recentCommand) {
        const settled = settleMotion(raw);
        clearSettleTimer();
        setGateState(settled);
        clearStaleRetained(settled);
        return;
      }

      setGateState(raw);
      clearSettleTimer();

      if (raw === "opening") {
        settleTimerRef.current = window.setTimeout(() => {
          setGateState("open");
          settleTimerRef.current = null;
        }, MOVE_SETTLE_MS);
      } else if (raw === "closing") {
        settleTimerRef.current = window.setTimeout(() => {
          setGateState("closed");
          settleTimerRef.current = null;
        }, MOVE_SETTLE_MS);
      }
    };

    client.on("connect", () => {
      setConnection("online");
      client.subscribe(config.topicStatus, { qos: 0 });
    });

    client.on("reconnect", () => setConnection("connecting"));
    client.on("close", () => setConnection("offline"));
    client.on("error", () => setConnection("offline"));

    client.on("message", (topic, payload) => {
      if (topic !== config.topicStatus) return;
      try {
        const data = JSON.parse(payload.toString()) as { state?: GateState };
        if (data.state) onBrokerState(data.state);
      } catch {
        /* ignore */
      }
    });

    return () => {
      clearSettleTimer();
      client.end(true);
      clientRef.current = null;
    };
  }, [mockMode, gateId, configEpoch, clearSettleTimer]);

  const sendCommand = useCallback(
    (command: GateCommand) => {
      onCommandSentRef.current?.(command);

      if (mockMode) {
        lastCommandAtRef.current = Date.now();
        clearSettleTimer();
        if (command === "OPEN") {
          setGateState("opening");
          settleTimerRef.current = window.setTimeout(() => {
            setGateState("open");
            settleTimerRef.current = null;
          }, 2400);
        } else if (command === "CLOSE") {
          setGateState("closing");
          settleTimerRef.current = window.setTimeout(() => {
            setGateState("closed");
            settleTimerRef.current = null;
          }, 2400);
        } else {
          setGateState("stopped");
        }
        return true;
      }

      const client = clientRef.current;
      const config = configRef.current;
      if (!client?.connected) return false;

      lastCommandAtRef.current = Date.now();
      clearSettleTimer();
      if (command === "OPEN") {
        setGateState("opening");
        settleTimerRef.current = window.setTimeout(() => {
          setGateState("open");
          settleTimerRef.current = null;
        }, MOVE_SETTLE_MS);
      } else if (command === "CLOSE") {
        setGateState("closing");
        settleTimerRef.current = window.setTimeout(() => {
          setGateState("closed");
          settleTimerRef.current = null;
        }, MOVE_SETTLE_MS);
      } else {
        setGateState("stopped");
      }

      // Fire-and-forget — do not wait for broker ACK (that was the 5–6s lag)
      client.publish(config.topicCommand, command, { qos: 0 });
      return true;
    },
    [clearSettleTimer, mockMode],
  );

  return {
    connection,
    gateState,
    setGateState,
    busy: false,
    sendCommand,
    mqttConfigured,
  };
}
