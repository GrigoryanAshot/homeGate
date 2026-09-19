"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BackButton } from "./BackButton";
import { useLocale } from "./LocaleProvider";
import type { WifiMqttEvent } from "@/hooks/useSmartGateMqtt";
import {
  bleRescueSupported,
  connectBleAndSendWifi,
} from "@/lib/smartgate/ble-wifi-rescue";

type Network = { ssid: string; rssi: number };

export function ChangeWifiModal({
  open,
  onClose,
  gateName,
  mqttOnline,
  onScan,
  onConnect,
  lastWifiEvent,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  gateName: string;
  mqttOnline: boolean;
  onScan: () => boolean;
  onConnect: (ssid: string, password: string) => boolean;
  lastWifiEvent: WifiMqttEvent | null;
  onToast?: (message: string) => void;
}) {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState("");
  const [manualSsid, setManualSsid] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<
    "idle" | "scanning" | "connecting" | "ble"
  >("idle");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setNetworks([]);
    setSelected("");
    setManualSsid("");
    setPassword("");
    setPhase("idle");
    setStatus(null);
    setScanning(false);
  }, [open]);

  useEffect(() => {
    if (!open || !lastWifiEvent) return;
    if (lastWifiEvent.wifiEvent === "scan_start") {
      setScanning(true);
      setPhase("scanning");
      setStatus(t.wifiChangeScanning);
      return;
    }
    if (lastWifiEvent.wifiEvent === "scan") {
      setScanning(false);
      setPhase("idle");
      const list = [...(lastWifiEvent.networks ?? [])].sort(
        (a, b) => b.rssi - a.rssi,
      );
      // unique by ssid
      const seen = new Set<string>();
      const uniq: Network[] = [];
      for (const n of list) {
        const key = n.ssid.trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        uniq.push({ ssid: key, rssi: n.rssi });
      }
      setNetworks(uniq);
      setStatus(
        uniq.length ? t.wifiChangePickNetwork : t.wifiChangeNoNetworks,
      );
      return;
    }
    if (lastWifiEvent.wifiEvent === "join") {
      if (lastWifiEvent.phase === "trying") {
        setPhase("connecting");
        setStatus(t.wifiChangeTrying);
        return;
      }
      if (lastWifiEvent.ok) {
        setPhase("idle");
        setStatus(t.wifiChangeSuccess);
        onToast?.(t.wifiChangeSuccess);
        window.setTimeout(() => onClose(), 900);
        return;
      }
      setPhase("idle");
      const err = lastWifiEvent.error ?? "";
      if (err === "reverted" || err === "auth_or_timeout") {
        setStatus(t.wifiChangeBadPassword);
        onToast?.(t.wifiChangeBadPassword);
      } else if (err === "revert_failed") {
        setStatus(t.wifiChangeRevertFailed);
      } else {
        setStatus(t.wifiChangeFailed);
      }
    }
  }, [lastWifiEvent, open, onClose, onToast, t]);

  const ssid = useMemo(
    () => (selected || manualSsid).trim(),
    [selected, manualSsid],
  );

  const handleScan = useCallback(() => {
    if (!mqttOnline) {
      setStatus(t.wifiChangeNeedOnline);
      return;
    }
    setScanning(true);
    setPhase("scanning");
    setStatus(t.wifiChangeScanning);
    if (!onScan()) {
      setScanning(false);
      setPhase("idle");
      setStatus(t.wifiChangeNeedOnline);
    }
  }, [mqttOnline, onScan, t]);

  const handleConnect = useCallback(() => {
    if (!ssid) {
      setStatus(t.wifiChangePickNetwork);
      return;
    }
    if (!mqttOnline) {
      setStatus(t.wifiChangeNeedOnline);
      return;
    }
    setPhase("connecting");
    setStatus(t.wifiChangeTrying);
    if (!onConnect(ssid, password)) {
      setPhase("idle");
      setStatus(t.wifiChangeNeedOnline);
    }
  }, [ssid, password, mqttOnline, onConnect, t]);

  const handleBle = useCallback(async () => {
    if (!bleRescueSupported()) {
      setStatus(t.wifiChangeBleUnsupported);
      return;
    }
    if (!ssid) {
      setStatus(t.wifiChangePickNetwork);
      return;
    }
    setPhase("ble");
    setStatus(t.wifiChangeBleHint);
    const result = await connectBleAndSendWifi(ssid, password);
    if (result.ok) {
      setStatus(t.wifiChangeSuccess);
      onToast?.(t.wifiChangeSuccess);
      window.setTimeout(() => onClose(), 900);
    } else {
      setPhase("idle");
      setStatus(result.error || t.wifiChangeFailed);
    }
  }, [ssid, password, onClose, onToast, t]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[min(92dvh,720px)] w-full max-w-md overflow-y-auto rounded-[28px] border border-gate-line bg-gate-surface p-5 shadow-gate"
      >
        <div className="mb-3 flex items-center gap-2">
          <BackButton onClick={onClose} />
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gate-ink">
              {t.wifiChangeTitle}
            </h2>
            <p className="truncate text-xs text-gate-muted">{gateName}</p>
          </div>
        </div>

        <p className="mb-3 text-sm leading-relaxed text-gate-muted">
          {mqttOnline ? t.wifiChangeHintOnline : t.wifiChangeHintOffline}
        </p>

        {mqttOnline && (
          <button
            type="button"
            disabled={scanning || phase === "connecting"}
            onClick={handleScan}
            className="mb-3 w-full rounded-2xl bg-blue-500 py-3.5 text-sm font-bold text-white active:bg-blue-600 disabled:opacity-45"
          >
            {scanning ? t.pleaseWait : t.wifiChangeScan}
          </button>
        )}

        {networks.length > 0 && (
          <div className="mb-3 max-h-48 space-y-1.5 overflow-y-auto rounded-2xl border border-gate-line bg-gate-bg p-2">
            {networks.map((n) => (
              <button
                key={n.ssid}
                type="button"
                onClick={() => {
                  setSelected(n.ssid);
                  setManualSsid("");
                }}
                className={
                  selected === n.ssid
                    ? "flex w-full items-center justify-between rounded-xl bg-blue-500 px-3 py-2.5 text-left text-sm font-bold text-white"
                    : "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gate-ink active:bg-gate-card"
                }
              >
                <span className="truncate">{n.ssid}</span>
                <span className="shrink-0 text-xs opacity-80">{n.rssi}</span>
              </button>
            ))}
          </div>
        )}

        <label className="mb-2 block">
          <span className="mb-1 block text-xs font-semibold text-gate-muted">
            {t.wifiChangeSsidLabel}
          </span>
          <input
            type="text"
            value={selected || manualSsid}
            onChange={(e) => {
              setManualSsid(e.target.value);
              setSelected("");
            }}
            placeholder="MyHomeWiFi"
            className="w-full rounded-2xl border border-gate-line bg-gate-bg px-4 py-3 text-sm outline-none ring-blue-400 focus:ring-2"
            autoComplete="off"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-semibold text-gate-muted">
            {t.wifiChangePassLabel}
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-gate-line bg-gate-bg px-4 py-3 text-sm outline-none ring-blue-400 focus:ring-2"
            autoComplete="new-password"
          />
        </label>

        {status && (
          <p className="mb-3 text-center text-sm font-semibold text-gate-ink">
            {status}
          </p>
        )}

        {mqttOnline ? (
          <button
            type="button"
            disabled={!ssid || phase === "connecting"}
            onClick={handleConnect}
            className="w-full rounded-2xl bg-green-600 py-3.5 text-sm font-bold text-white active:bg-green-700 disabled:opacity-45"
          >
            {phase === "connecting" ? t.pleaseWait : t.wifiChangeConnect}
          </button>
        ) : (
          <button
            type="button"
            disabled={!ssid || phase === "ble"}
            onClick={() => void handleBle()}
            className="w-full rounded-2xl bg-violet-600 py-3.5 text-sm font-bold text-white active:bg-violet-700 disabled:opacity-45"
          >
            {phase === "ble" ? t.pleaseWait : t.wifiChangeBleConnect}
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
