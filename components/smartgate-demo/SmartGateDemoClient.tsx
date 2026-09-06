"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSmartGateMqtt } from "@/hooks/useSmartGateMqtt";
import type { GateCommand, GateState } from "@/lib/smartgate/types";
import { AddGateScanModal } from "./AddGateScanModal";
import { BottomNav, type DemoView } from "./BottomNav";
import { ControllersPanel } from "./ControllersPanel";
import { DemoHeader } from "./DemoHeader";
import { GateCardsRow } from "./GateCardsRow";
import { GateControlPanel } from "./GateControlPanel";
import { GatesProvider, useGates } from "./GatesProvider";
import { LocaleProvider, useLocale } from "./LocaleProvider";
import { ThemeProvider } from "./ThemeProvider";
import { BiometricProvider } from "./BiometricProvider";
import { BiometricLockScreen } from "./BiometricLockScreen";

function SmartGateDemoInner() {
  const { t } = useLocale();
  const { selectedGateId } = useGates();
  const [view, setView] = useState<DemoView>("control");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const gateStateByIdRef = useRef<Record<string, GateState>>({});
  const prevGateIdRef = useRef(selectedGateId);

  // Clear old sticky demo mode from earlier deploys
  useEffect(() => {
    try {
      window.localStorage.removeItem("smartgate-presentation");
    } catch {
      /* ignore */
    }
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const { connection, gateState, setGateState, busy, sendCommand, mqttConfigured } =
    useSmartGateMqtt({
      mockMode: false,
      gateId: selectedGateId,
    });

  useEffect(() => {
    if (prevGateIdRef.current !== selectedGateId) {
      gateStateByIdRef.current[prevGateIdRef.current] = gateState;
      prevGateIdRef.current = selectedGateId;
      setGateState(gateStateByIdRef.current[selectedGateId] ?? "closed");
      return;
    }
    gateStateByIdRef.current[selectedGateId] = gateState;
  }, [selectedGateId, gateState, setGateState]);

  const handleCommand = useCallback(
    (command: GateCommand) => {
      const ok = sendCommand(command);
      if (!ok) showToast(t.toastCommandFailed);
    },
    [sendCommand, showToast, t.toastCommandFailed],
  );

  return (
    <div className="app-shell bg-gate-bg text-gate-ink">
      <div className="pointer-events-none fixed inset-0 bg-gate-mesh" />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <DemoHeader
          gateState={gateState}
          settingsOpen={settingsOpen}
          onSettingsOpenChange={setSettingsOpen}
          onToast={showToast}
        />

        {!mqttConfigured && view === "control" && (
          <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
            {t.gateNotConnected}
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-hidden px-4 py-3">
          {view === "control" ? (
            <div className="flex h-full min-h-0 flex-col">
              <GateCardsRow
                onAddGate={() => setScanOpen(true)}
                connection={connection}
              />
              <GateControlPanel
                busy={busy}
                gateState={gateState}
                onCommand={handleCommand}
              />
            </div>
          ) : (
            <ControllersPanel onToast={showToast} />
          )}
        </main>

        <BottomNav active={view} onChange={setView} />
      </div>

      <AddGateScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onAdded={(name) => showToast(t.toastGateAdded(name))}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] w-[min(88vw,320px)] -translate-x-1/2 rounded-2xl border border-blue-200 bg-gate-surface px-4 py-3 text-center text-sm font-semibold text-gate-ink shadow-gate"
        >
          {toast}
        </div>
      )}

      <BiometricLockScreen />
    </div>
  );
}

export function SmartGateDemoClient() {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <BiometricProvider>
          <GatesProvider>
            <SmartGateDemoInner />
          </GatesProvider>
        </BiometricProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
