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

/** Opto wiring on this unit is reversed vs labels — swap MQTT OPEN/CLOSE only. */
const SWAP_OPEN_CLOSE_MQTT = true;

/** Match firmware MOVE_MS — UI settle only, never blocks buttons */
const MOVE_SETTLE_MS = 12_000;

function mqttWireCommand(command: GateCommand): GateCommand {
  if (!SWAP_OPEN_CLOSE_MQTT) return command;
  if (command === "OPEN") return "CLOSE";
  if (command === "CLOSE") return "OPEN";
  return command;
}

/** ESP status is also inverted when commands are swapped — mirror for the UI. */
function displayStateFromBroker(raw: GateState): GateState {
  if (!SWAP_OPEN_CLOSE_MQTT) return raw;
  if (raw === "opening") return "closing";
  if (raw === "closing") return "opening";
  if (raw === "open") return "closed";
  if (raw === "closed") return "open";
  return raw;
}

/** Map UI state back to ESP/broker language (same swap). */
function brokerStateFromDisplay(display: GateState): GateState {
  return displayStateFromBroker(display);
}

const MOTION_STATES = new Set<GateState>(["opening", "closing"]);

interface UseSmartGateMqttOptions {
  mockMode: boolean;
  gateId?: string;
  configEpoch?: number;
  onCommandSent?: (command: GateCommand) => void;
  onWifiEvent?: (event: WifiMqttEvent) => void;
}

export type WifiMqttEvent =
  | { wifiEvent: "scan_start" }
  | {
      wifiEvent: "scan";
      networks: { ssid: string; rssi: number }[];
    }
  | {
      wifiEvent: "join";
      ok?: boolean;
      error?: string;
      phase?: string;
    };

function settleMotion(state: GateState): GateState {
  if (state === "opening") return "open";
  if (state === "closing") return "closed";
  return state;
}

function scheduleSettle(
  state: GateState,
  ms: number,
  setGateState: (s: GateState) => void,
  settleTimerRef: { current: number | null },
  clearSettleTimer: () => void,
) {
  clearSettleTimer();
  if (state === "opening") {
    settleTimerRef.current = window.setTimeout(() => {
      setGateState("open");
      settleTimerRef.current = null;
    }, ms);
  } else if (state === "closing") {
    settleTimerRef.current = window.setTimeout(() => {
      setGateState("closed");
      settleTimerRef.current = null;
    }, ms);
  }
}

export function useSmartGateMqtt({
  mockMode,
  gateId,
  configEpoch = 0,
  onCommandSent,
  onWifiEvent,
}: UseSmartGateMqttOptions) {
  const clientRef = useRef<MqttClient | null>(null);
  const configRef = useRef<MqttConfig>(getMqttConfig());
  const gateIdRef = useRef(gateId);
  gateIdRef.current = gateId;
  const lastCommandAtRef = useRef(0);
  const settleTimerRef = useRef<number | null>(null);
  const onCommandSentRef = useRef(onCommandSent);
  onCommandSentRef.current = onCommandSent;
  const onWifiEventRef = useRef(onWifiEvent);
  onWifiEventRef.current = onWifiEvent;

  const [connection, setConnection] = useState<ConnectionStatus>("connecting");
  const [gateState, setGateState] = useState<GateState>("closed");
  const [mqttConfigured, setMqttConfigured] = useState(() => {
    const c = getMqttConfig();
    return Boolean(c.host && c.username);
  });
  const [brokerConnected, setBrokerConnected] = useState(false);

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
      setBrokerConnected(false);
      return;
    }

    setConnection("connecting");
    setBrokerConnected(false);
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

    const clearStaleRetained = (settledDisplay: GateState) => {
      try {
        client.publish(
          config.topicStatus,
          JSON.stringify({
            state: brokerStateFromDisplay(settledDisplay),
            online: true,
            source: "app-correct",
          }),
          { qos: 0, retain: true },
        );
      } catch {
        /* ignore */
      }
    };

    const onBrokerState = (raw: GateState) => {
      const display = displayStateFromBroker(raw);
      const recentCommand =
        Date.now() - lastCommandAtRef.current < MOVE_SETTLE_MS;

      // Stale retained motion — settle in UI terms
      if (MOTION_STATES.has(display) && !recentCommand) {
        const settled = settleMotion(display);
        clearSettleTimer();
        setGateState(settled);
        clearStaleRetained(settled);
        return;
      }

      setGateState(display);
      scheduleSettle(
        display,
        MOVE_SETTLE_MS,
        setGateState,
        settleTimerRef,
        clearSettleTimer,
      );
    };

    client.on("connect", () => {
      setConnection("online");
      setBrokerConnected(true);
      client.subscribe(config.topicStatus, { qos: 0 });
    });

    // Auto-reconnect is on — treat drops as "connecting", not a hard offline
    // flash that scares users for the first few seconds.
    client.on("reconnect", () => {
      setConnection("connecting");
      setBrokerConnected(false);
    });
    client.on("offline", () => {
      setConnection("connecting");
      setBrokerConnected(false);
    });
    client.on("close", () => {
      setConnection("connecting");
      setBrokerConnected(false);
    });
    client.on("error", () => {
      setConnection("connecting");
      setBrokerConnected(false);
    });

    client.on("message", (topic, payload) => {
      if (topic !== config.topicStatus) return;
      try {
        const data = JSON.parse(payload.toString()) as {
          state?: GateState;
          wifiEvent?: string;
          networks?: { ssid: string; rssi: number }[];
          ok?: boolean;
          error?: string;
          phase?: string;
        };
        if (data.wifiEvent) {
          onWifiEventRef.current?.(data as WifiMqttEvent);
          return;
        }
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

      lastCommandAtRef.current = Date.now();
      if (command === "OPEN") {
        setGateState("opening");
        scheduleSettle(
          "opening",
          MOVE_SETTLE_MS,
          setGateState,
          settleTimerRef,
          clearSettleTimer,
        );
      } else if (command === "CLOSE") {
        setGateState("closing");
        scheduleSettle(
          "closing",
          MOVE_SETTLE_MS,
          setGateState,
          settleTimerRef,
          clearSettleTimer,
        );
      } else {
        clearSettleTimer();
        setGateState("stopped");
      }

      const id = gateIdRef.current?.trim();
      // Cloud relay — does not depend on the phone's MQTT publish path
      if (id) {
        void fetch(`/api/devices/${encodeURIComponent(id)}/command`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: command }),
        }).catch(() => {
          /* ignore */
        });
      }

      const client = clientRef.current;
      const config = configRef.current;
      if (client?.connected) {
        client.publish(config.topicCommand, mqttWireCommand(command), {
          qos: 1,
        });
      }
      return Boolean(id || client?.connected);
    },
    [clearSettleTimer, mockMode],
  );

  const sendWifiReset = useCallback((targetGateId?: string) => {
    const client = clientRef.current;
    if (!client?.connected) return false;
    const config = targetGateId
      ? getMqttConfigForGate(targetGateId)
      : configRef.current;
    client.publish(config.topicCommand, "WIFI_RESET", { qos: 0 });
    return true;
  }, []);

  const sendWifiScan = useCallback((targetGateId?: string) => {
    const client = clientRef.current;
    if (!client?.connected) return false;
    const config = targetGateId
      ? getMqttConfigForGate(targetGateId)
      : configRef.current;
    client.publish(config.topicCommand, "WIFI_SCAN", { qos: 0 });
    return true;
  }, []);

  const sendWifiSet = useCallback(
    (ssid: string, password: string, targetGateId?: string) => {
      const client = clientRef.current;
      if (!client?.connected) return false;
      const config = targetGateId
        ? getMqttConfigForGate(targetGateId)
        : configRef.current;
      // Keep password case — ESP parses before normalize
      const payload = `WIFI_SET\n${ssid.trim()}\n${password}`;
      client.publish(config.topicCommand, payload, { qos: 0 });
      return true;
    },
    [],
  );

  return {
    connection,
    gateState,
    setGateState,
    busy: false,
    sendCommand,
    sendWifiReset,
    sendWifiScan,
    sendWifiSet,
    mqttConfigured,
    /** True only while the browser MQTT socket is actually up (can publish). */
    brokerConnected,
  };
}
