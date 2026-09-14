"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSmartGateMqtt } from "@/hooks/useSmartGateMqtt";
import { clearControllersForGate } from "@/lib/smartgate/controllers-store";
import type { GateCommand, GateState } from "@/lib/smartgate/types";
import { getMqttConfig } from "@/lib/smartgate/types";
import { AddGateScanModal } from "./AddGateScanModal";
import { BottomNav, type DemoView } from "./BottomNav";
import { ControllersPanel } from "./ControllersPanel";
import { DemoHeader } from "./DemoHeader";
import { GateCardsRow } from "./GateCardsRow";
import { GateControlPanel } from "./GateControlPanel";
import { GatesProvider, useGates } from "./GatesProvider";
import { LocaleProvider, useLocale } from "./LocaleProvider";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { AuthWelcomeGate } from "./AuthWelcomeGate";

function SmartGateDemoInner() {
  const { t } = useLocale();
  const { gates, selectedGateId, selectGate, removeGate } = useGates();
  const hasGate = gates.length > 0 && !!selectedGateId;
  const [view, setView] = useState<DemoView>("control");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [mqttEpoch, setMqttEpoch] = useState(0);
  const gateStateByIdRef = useRef<Record<string, GateState>>({});
  const prevGateIdRef = useRef(selectedGateId);

  useEffect(() => {
    try {
      window.localStorage.removeItem("smartgate-presentation");
      window.localStorage.removeItem("smartgate-biometric-enabled");
      window.localStorage.removeItem("smartgate-biometric-cred");
      window.localStorage.removeItem("smartgate-biometric-unlocked");
    } catch {
      /* ignore */
    }
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const { connection, gateState, setGateState, busy, sendCommand, sendWifiReset, mqttConfigured } =
    useSmartGateMqtt({
      mockMode: false,
      gateId: hasGate ? selectedGateId : undefined,
      configEpoch: mqttEpoch,
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

  const clearSharesForGate = useCallback((gateId: string) => {
    clearControllersForGate(gateId);
    const mqtt = getMqttConfig();
    void fetch("/api/invites", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clearAll: true,
        gateId,
        mqtt: {
          host: mqtt.host,
          username: mqtt.username,
          password: mqtt.password,
          port: mqtt.port,
          path: mqtt.path,
        },
      }),
    }).catch(() => {
      /* best-effort */
    });
  }, []);

  /** SoftAP again + revoke shared invites for THIS gate only. */
  const handleWifiReset = useCallback(
    (gateId?: string) => {
      const id = gateId ?? selectedGateId;
      clearSharesForGate(id);
      return sendWifiReset(id);
    },
    [sendWifiReset, selectedGateId, clearSharesForGate],
  );

  const handleRemoveGate = useCallback(
    async (gateId: string) => {
      // Never WIFI_RESET on remove — that bricks the box SoftAP and can hit the
      // wrong mental model (“remove from app” ≠ “wipe hardware”). Only unclaim
      // this product + clear THIS gate’s shares.
      clearSharesForGate(gateId);
      await removeGate(gateId);
    },
    [clearSharesForGate, removeGate],
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
          onMqttSaved={() => setMqttEpoch((n) => n + 1)}
          onWifiReset={() => handleWifiReset()}
          mqttOnline={mqttConfigured && connection === "online"}
        />

        {view === "control" &&
          hasGate &&
          (!mqttConfigured || connection === "offline") && (
          <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
            {t.gateNotConnected}
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-hidden px-4 py-3">
          {view === "control" ? (
            <div className="flex h-full min-h-0 flex-col">
              <GateCardsRow
                onAddGate={() => setScanOpen(true)}
                connection={hasGate ? connection : "offline"}
                mqttOnline={hasGate && mqttConfigured && connection === "online"}
                onResetGate={(id) => {
                  selectGate(id);
                  return handleWifiReset(id);
                }}
                onRemoveGate={handleRemoveGate}
                onToast={showToast}
              />
              {hasGate ? (
                <GateControlPanel
                  busy={busy}
                  gateState={gateState}
                  onCommand={handleCommand}
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
                  <p className="text-base font-bold text-gate-ink">
                    {t.noGatesYetTitle}
                  </p>
                  <p className="max-w-sm text-sm leading-relaxed text-gate-muted">
                    {t.noGatesYetHint}
                  </p>
                  <button
                    type="button"
                    onClick={() => setScanOpen(true)}
                    className="mt-2 rounded-2xl bg-blue-500 px-6 py-3.5 text-sm font-bold text-white active:bg-blue-600"
                  >
                    + {t.addGate}
                  </button>
                </div>
              )}
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
    </div>
  );
}

export function SmartGateDemoClient() {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <AuthProvider>
          <AuthWelcomeGate>
            <GatesProvider>
              <SmartGateDemoInner />
            </GatesProvider>
          </AuthWelcomeGate>
        </AuthProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
