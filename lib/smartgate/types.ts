export type ConnectionStatus = "online" | "connecting" | "offline";

export type GateState =
  | "closed"
  | "open"
  | "opening"
  | "closing"
  | "stopped"
  | "unknown";

export type GateCommand = "OPEN" | "CLOSE" | "STOP";

export type ControllerAccessType = "unlimited" | "once" | "hours" | "range";

export interface ControllerAccessRule {
  type: ControllerAccessType;
  /** For `hours` — duration in ms from grant time */
  durationMs?: number;
  /** Expiry timestamp (hours / once / range end) */
  expiresAt?: number;
  rangeFrom?: number;
  rangeTo?: number;
}

export interface GateController {
  id: string;
  name: string;
  rule: ControllerAccessRule;
  grantedAt: number;
}

export interface GateAccessHistoryEntry {
  id: string;
  userName: string;
  action: "OPEN" | "CLOSE";
  timestamp: number;
}

export const SEED_CONTROLLERS: GateController[] = [
  {
    id: "c1",
    name: "Անի",
    rule: { type: "unlimited" },
    grantedAt: Date.now() - 86400000 * 120,
  },
  {
    id: "c2",
    name: "Առաքիչ",
    rule: {
      type: "hours",
      durationMs: 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 86400000 * 2,
    },
    grantedAt: Date.now() - 3600000,
  },
  {
    id: "c3",
    name: "Հյուր #1042",
    rule: { type: "once", expiresAt: Date.now() + 86400000 },
    grantedAt: Date.now() - 7200000,
  },
];

export const SEED_ACCESS_HISTORY: GateAccessHistoryEntry[] = [
  {
    id: "h1",
    userName: "Անի",
    action: "CLOSE",
    timestamp: Date.now() - 3600000,
  },
  {
    id: "h2",
    userName: "Admin",
    action: "OPEN",
    timestamp: Date.now() - 7200000,
  },
  {
    id: "h3",
    userName: "Առաքիչ",
    action: "OPEN",
    timestamp: Date.now() - 86400000,
  },
  {
    id: "h4",
    userName: "Admin",
    action: "CLOSE",
    timestamp: Date.now() - 90000000,
  },
];

export type GuestPassDuration = "1h" | "24h" | "once";

export type PermissionRole = "owner" | "family" | "guest";

export interface MqttConfig {
  host: string;
  username: string;
  password: string;
  port: number;
  path: string;
  topicCommand: string;
  topicStatus: string;
}

export interface PermissionUser {
  id: string;
  name: string;
  role: PermissionRole;
  label: string;
  access: string;
}

export interface ActivityEvent {
  id: string;
  message: string;
  timestamp: number;
}

export interface GuestPass {
  id: string;
  token: string;
  url: string;
  duration: GuestPassDuration;
  expiresAt: number;
  oneTime: boolean;
}

export const GATE_STATE_LABELS: Record<GateState, string> = {
  closed: "Fully Closed",
  open: "Fully Open",
  opening: "Opening…",
  closing: "Closing…",
  stopped: "Stopped Mid-Way",
  unknown: "Status Unknown",
};

export const DEFAULT_PERMISSIONS: PermissionUser[] = [
  {
    id: "1",
    name: "Admin",
    role: "owner",
    label: "Owner (Admin)",
    access: "Full Access",
  },
  {
    id: "2",
    name: "Family Member",
    role: "family",
    label: "Family Member",
    access: "Full Access",
  },
  {
    id: "3",
    name: "Courier / Guest",
    role: "guest",
    label: "Courier / Guest",
    access: "Temporary",
  },
];

export function getMqttConfig(): MqttConfig {
  // Defaults match firmware/HomeGate/config.h (browser uses WSS :8884)
  // Use || so empty Vercel env vars still fall back to defaults.
  const fromEnv = {
    host:
      process.env.NEXT_PUBLIC_MQTT_HOST ||
      "3c391676ced3426b8300afc7d6b4961e.s1.eu.hivemq.cloud",
    username: process.env.NEXT_PUBLIC_MQTT_USER || "Gate1",
    password: process.env.NEXT_PUBLIC_MQTT_PASS || "Ash7289...",
    port: Number(process.env.NEXT_PUBLIC_MQTT_PORT || 8884),
    path: process.env.NEXT_PUBLIC_MQTT_PATH || "/mqtt",
    topicCommand:
      process.env.NEXT_PUBLIC_MQTT_TOPIC_COMMAND || "home/gate/command",
    topicStatus:
      process.env.NEXT_PUBLIC_MQTT_TOPIC_STATUS || "home/gate/status",
  };

  // Same keys as the old static app gear menu
  if (typeof window !== "undefined") {
    const host =
      window.localStorage.getItem("homegate.mqtt.host")?.trim() || fromEnv.host;
    const username =
      window.localStorage.getItem("homegate.mqtt.user")?.trim() ||
      fromEnv.username;
    const password =
      window.localStorage.getItem("homegate.mqtt.pass") ?? fromEnv.password;
    return {
      ...fromEnv,
      host,
      username,
      password,
    };
  }

  return fromEnv;
}

export function saveMqttLocalConfig(partial: {
  host: string;
  username: string;
  password: string;
}) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("homegate.mqtt.host", partial.host.trim());
  window.localStorage.setItem("homegate.mqtt.user", partial.username.trim());
  window.localStorage.setItem("homegate.mqtt.pass", partial.password);
}

/** Per-gate MQTT topics for multi-device setups */
export function getMqttConfigForGate(gateId?: string): MqttConfig {
  const base = getMqttConfig();
  // Current C3 firmware listens on shared home/gate/* (same as old app).
  // Per-gate topics later when each ESP uses home/{deviceId}/command.
  void gateId;
  return base;
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return "Just now";
  if (sec < 60) return `${sec} secs ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  return `${hr} hour${hr === 1 ? "" : "s"} ago`;
}

export function guestPassLabel(duration: GuestPassDuration): string {
  if (duration === "1h") return "1 Hour";
  if (duration === "24h") return "24 Hours";
  return "One-Time Use";
}

export function guestPassExpiryMs(duration: GuestPassDuration): number {
  if (duration === "1h") return 60 * 60 * 1000;
  if (duration === "24h") return 24 * 60 * 60 * 1000;
  return 15 * 60 * 1000;
}
