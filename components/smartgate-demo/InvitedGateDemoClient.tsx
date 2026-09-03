"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSmartGateMqtt } from "@/hooks/useSmartGateMqtt";
import type { GateCommand } from "@/lib/smartgate/types";
import { GateControlPanel } from "./GateControlPanel";
import { InviteLocaleBar } from "./InviteLocaleBar";
import { PresentationBadge } from "./GateSelector";
import { LocaleProvider, useLocale } from "./LocaleProvider";
import { AppLogo } from "@/components/ui/AppLogo";

function DemoGuestInner() {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const guestName = searchParams.get("guest")?.trim() || "Անի";

  const { gateState, busy, sendCommand } = useSmartGateMqtt({
    mockMode: true,
    gateId: "gate-home",
  });

  const handleCommand = useCallback(
    (command: GateCommand) => {
      sendCommand(command);
    },
    [sendCommand],
  );

  return (
    <>
      <PresentationBadge />
      <header className="shrink-0 border-b border-gate-line bg-gate-surface/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gate-line bg-gate-surface p-1 shadow-sm">
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
