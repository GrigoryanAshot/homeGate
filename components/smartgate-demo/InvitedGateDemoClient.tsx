"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSmartGateMqtt } from "@/hooks/useSmartGateMqtt";
import type { GateCommand } from "@/lib/smartgate/types";
import { ConnectionBadge } from "./ConnectionBadge";
import { GateControlPanel } from "./GateControlPanel";
import { InviteLocaleBar } from "./InviteLocaleBar";
import { PresentationBadge } from "./GateSelector";
import { LocaleProvider, useLocale } from "./LocaleProvider";
import { AppLogo } from "@/components/ui/AppLogo";

function DemoGuestInner() {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const guestName = searchParams.get("guest")?.trim() || "Անի";
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const onCommandSent = useCallback(
    (command: GateCommand) => {
      if (command === "OPEN") showToast(t.toastOpening);
      else if (command === "CLOSE") showToast(t.toastClosing);
      else showToast(t.toastStopped);
    },
    [showToast, t],
  );

  const { gateState, busy, sendCommand } = useSmartGateMqtt({
    mockMode: true,
    gateId: "gate-home",
    onCommandSent,
  });

  const handleCommand = useCallback(
    (command: GateCommand) => {
      sendCommand(command);
    },
    [sendCommand],
  );

  const connectionForUi = useMemo(() => "online" as const, []);

  return (
    <>
      <PresentationBadge />
      <header className="shrink-0 border-b border-gate-line bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gate-line bg-white p-1 shadow-sm">
              <AppLogo size={36} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-gate-ink">
                {t.inviteWelcome(guestName)}
              </p>
              <p className="text-xs text-gate-muted">{t.guestViewSubtitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ConnectionBadge status={connectionForUi} mockMode />
            <InviteLocaleBar />
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden px-4 py-3">
        <GateControlPanel
          busy={busy}
          mockMode
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

export function InvitedGateDemoClient() {
  return (
    <LocaleProvider>
      <div className="app-shell bg-gate-bg text-gate-ink">
        <div className="pointer-events-none fixed inset-0 bg-gate-mesh" />
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center text-sm text-gate-muted">
                …
              </div>
            }
          >
            <DemoGuestInner />
          </Suspense>
        </div>
      </div>
    </LocaleProvider>
  );
}
