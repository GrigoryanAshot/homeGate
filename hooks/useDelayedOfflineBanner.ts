"use client";

import { useEffect, useState } from "react";
import type { ConnectionStatus } from "@/lib/smartgate/types";

/**
 * Hide the scary “not connected” banner while MQTT is still handshaking.
 * Only show after we've been not-online for `delayMs`.
 */
export function useDelayedOfflineBanner(
  connection: ConnectionStatus,
  mqttConfigured: boolean,
  delayMs = 4500,
): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (mqttConfigured && connection === "online") {
      setShow(false);
      return;
    }
    const timer = window.setTimeout(() => setShow(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [connection, mqttConfigured, delayMs]);

  return show;
}
