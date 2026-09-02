"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSmartGateMqtt } from "@/hooks/useSmartGateMqtt";
import { getOrCreateInviteDeviceId } from "@/lib/smartgate/invite-device-client";
import type { ControllerAccessRule, GateCommand } from "@/lib/smartgate/types";
import { ConnectionBadge } from "./ConnectionBadge";
import { GateControlPanel } from "./GateControlPanel";
import { InviteLocaleBar } from "./InviteLocaleBar";
import { LocaleProvider, useLocale } from "./LocaleProvider";

type InviteData = {
  name: string;
  gateId: string;
  rule: ControllerAccessRule;
};

function InvitedGateInner({ token }: { token: string }) {
  const { locale, t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(true);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const deviceId = getOrCreateInviteDeviceId();
        const res = await fetch(
          `/api/invites/verify?token=${encodeURIComponent(token)}&deviceId=${encodeURIComponent(deviceId)}`,
        );
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok || !data.valid) {
          const reason = data.reason as string | undefined;
          if (reason === "expired") setError(t.inviteExpired);
          else if (reason === "not_started") setError(t.inviteNotStarted);
          else if (reason === "used") setError(t.inviteUsed);
          else if (reason === "other_device") setError(t.inviteOtherDevice);
          else setError(t.inviteInvalid);
          setInvite(null);
          return;
        }

        setInvite({
          name: data.name,
          gateId: data.gateId,
          rule: data.rule,
        });
      } catch {
        if (!cancelled) setError(t.inviteInvalid);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  const onCommandSent = useCallback(
    async (command: GateCommand) => {
      if (command === "OPEN") showToast(t.toastOpening);
      else if (command === "CLOSE") showToast(t.toastClosing);
      else showToast(t.toastStopped);

      if (invite?.rule.type === "once") {
        await fetch("/api/invites/consume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            deviceId: getOrCreateInviteDeviceId(),
          }),
        });
      }
    },
    [invite?.rule.type, showToast, t, token],
  );

  const { connection, gateState, busy, sendCommand, mqttConfigured } =
    useSmartGateMqtt({
      mockMode,
      gateId: invite?.gateId,
      onCommandSent,
    });

  useEffect(() => {
    if (mqttConfigured) setMockMode(false);
  }, [mqttConfigured]);

  const connectionForUi = useMemo(() => {
    if (mockMode) return "online" as const;
    return connection;
  }, [connection, mockMode]);

  const handleCommand = useCallback(
    (command: GateCommand) => {
      const ok = sendCommand(command);
      if (!ok) showToast(t.toastCommandFailed);
    },
    [sendCommand, showToast, t.toastCommandFailed],
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-gate-muted">
        {t.inviteLoading}
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-semibold text-red-700">{error ?? t.inviteInvalid}</p>
        <InviteLocaleBar />
      </div>
    );
  }

  return (
    <>
      <header className="shrink-0 border-b border-gate-line bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-gate-ink">
              {t.inviteWelcome(invite.name)}
            </p>
            <p className="text-xs text-gate-muted">{t.appTitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ConnectionBadge status={connectionForUi} mockMode={mockMode} />
            <InviteLocaleBar />
          </div>
        </div>
      </header>

      {!mockMode && !mqttConfigured && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          {t.gateNotConnected}
        </div>
      )}

      <main className="min-h-0 flex-1 overflow-hidden px-4 py-3">
        <GateControlPanel
          busy={busy}
          mockMode={mockMode}
          gateState={gateState}
          onCommand={handleCommand}
        />
      </main>

      {toast && (
        <div
          role="status"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[60] w-[min(88vw,320px)] -translate-x-1/2 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-center text-sm font-semibold text-gate-ink shadow-gate"
        >
          {toast}
        </div>
      )}
    </>
  );
}

export function InvitedGateClient({ token }: { token: string }) {
  return (
    <LocaleProvider>
      <div className="app-shell bg-gate-bg text-gate-ink">
        <div className="pointer-events-none fixed inset-0 bg-gate-mesh" />
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <InvitedGateInner token={token} />
        </div>
      </div>
    </LocaleProvider>
  );
}
