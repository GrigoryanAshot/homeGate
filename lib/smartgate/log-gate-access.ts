import type { GateCommand } from "./types";

/** Best-effort cloud log for OPEN/CLOSE (does not block MQTT). */
export function logGateAccess(input: {
  gateId: string;
  command: GateCommand;
  /** Invite token when a shared controller is acting */
  token?: string;
  /** Invite device bind id (non-unlimited shares) */
  inviteDeviceId?: string;
}) {
  if (input.command !== "OPEN" && input.command !== "CLOSE") return;
  const gateId = input.gateId.trim();
  if (!gateId) return;

  void fetch(`/api/devices/${encodeURIComponent(gateId)}/history`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: input.command,
      ...(input.token ? { token: input.token } : {}),
      ...(input.inviteDeviceId ? { deviceId: input.inviteDeviceId } : {}),
    }),
  }).catch(() => {
    /* ignore — control must still work offline */
  });
}
