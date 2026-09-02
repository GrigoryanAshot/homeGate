"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSmartGateMqtt } from "@/hooks/useSmartGateMqtt";
import type { GateCommand, GateState } from "@/lib/smartgate/types";
import { readPresentationMode } from "@/lib/smartgate/presentation";
import { AddGateScanModal } from "./AddGateScanModal";
import { BottomNav, type DemoView } from "./BottomNav";
import { ControllersPanel } from "./ControllersPanel";
import { DemoHeader } from "./DemoHeader";
import { GateCardsRow, PresentationBadge } from "./GateCardsRow";
import { GateControlPanel } from "./GateControlPanel";
import { GatesProvider, useGates } from "./GatesProvider";
import { LocaleProvider, useLocale } from "./LocaleProvider";

function SmartGateDemoInner() {
  const { t } = useLocale();
  const { selectedGateId } = useGates();
  const [view, setView] = useState<DemoView>("control");
  const [presentationMode, setPresentationMode] = useState(true);
  const [mockMode, setMockMode] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const gateStateByIdRef = useRef<Record<string, GateState>>({});
  const prevGateIdRef = useRef(selectedGateId);

  useEffect(() => {
    const pres = readPresentationMode();
    setPresentationMode(pres);
    if (pres) setMockMode(true);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const effectiveMock = presentationMode || mockMode;

  const { connection, gateState, setGateState, busy, sendCommand, mqttConfigured } =
    useSmartGateMqtt({
      mockMode: effectiveMock,
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

  const connectionForUi = useMemo(() => {
    if (effectiveMock) return "online" as const;
    return connection;
  }, [connection, effectiveMock]);

  return (
    <div className="app-shell bg-gate-bg text-gate-ink">
      <div className="pointer-events-none fixed inset-0 bg-gate-mesh" />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        {presentationMode && <PresentationBadge />}

        <DemoHeader
          connection={connectionForUi}
          mockMode={effectiveMock}
          presentationMode={presentationMode}
          gateState={gateState}
          settingsOpen={settingsOpen}
          onSettingsOpenChange={setSettingsOpen}
          onToggleMock={() => setMockMode((v) => !v)}
        />

        {!presentationMode && !effectiveMock && !mqttConfigured && view === "control" && (
          <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
            {t.gateNotConnected}
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-hidden px-4 py-3">
          {view === "control" ? (
            <div className="flex h-full min-h-0 flex-col">
              <GateCardsRow onAddGate={() => setScanOpen(true)} />
              <GateControlPanel
                busy={busy}
                mockMode={effectiveMock}
                gateState={gateState}
                onCommand={handleCommand}
              />
            </div>
          ) : (
            <ControllersPanel
              presentationMode={presentationMode}
              onToast={showToast}
            />
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
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] w-[min(88vw,320px)] -translate-x-1/2 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-center text-sm font-semibold text-gate-ink shadow-gate"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export function SmartGateDemoClient() {
  return (
    <LocaleProvider>
      <GatesProvider>
        <SmartGateDemoInner />
      </GatesProvider>
    </LocaleProvider>
  );
}
