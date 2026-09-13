"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createGateFromScan,
  loadSelectedGateId,
  loadUserGates,
  nextGateDefaultName,
  saveSelectedGateId,
  saveUserGates,
  type UserGate,
} from "@/lib/smartgate/gates-store";
import { setActiveGateId } from "@/lib/smartgate/gate-id";
import type { Locale } from "@/lib/smartgate/i18n";
import { useAuth } from "./AuthProvider";

type GatesContextValue = {
  gates: UserGate[];
  selectedGateId: string;
  selectedGate: UserGate;
  selectGate: (id: string) => void;
  addGateFromScan: (name: string, deviceId?: string) => UserGate;
  suggestNextGateName: (locale: Locale) => string;
  refreshFromServer: () => Promise<void>;
};

const GatesContext = createContext<GatesContextValue | null>(null);

export function GatesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [gates, setGates] = useState<UserGate[]>(() => loadUserGates());
  const [selectedGateId, setSelectedGateId] = useState(() =>
    loadSelectedGateId(loadUserGates()[0]?.id ?? "gate-1"),
  );

  const refreshFromServer = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/devices/mine", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        devices?: { id: string; name: string | null; claimedAt: string | null }[];
      };
      const remote = (data.devices ?? []).map((d) => ({
        id: d.id,
        name: d.name?.trim() || d.id,
        createdAt: d.claimedAt ? Date.parse(d.claimedAt) : Date.now(),
      }));
      if (remote.length === 0) return;
      setGates((prev) => {
        const byId = new Map(prev.map((g) => [g.id, g]));
        for (const g of remote) {
          const existing = byId.get(g.id);
          byId.set(g.id, {
            id: g.id,
            name: g.name,
            createdAt: existing?.createdAt ?? g.createdAt,
          });
        }
        return Array.from(byId.values());
      });
      setSelectedGateId((cur) =>
        remote.some((g) => g.id === cur) ? cur : remote[0].id,
      );
    } catch {
      /* keep local */
    }
  }, [user]);

  useEffect(() => {
    void refreshFromServer();
  }, [refreshFromServer]);

  useEffect(() => {
    saveUserGates(gates);
  }, [gates]);

  useEffect(() => {
    saveSelectedGateId(selectedGateId);
    setActiveGateId(selectedGateId);
  }, [selectedGateId]);

  const selectedGate = useMemo(
    () => gates.find((g) => g.id === selectedGateId) ?? gates[0],
    [gates, selectedGateId],
  );

  const selectGate = useCallback((id: string) => {
    setSelectedGateId(id);
  }, []);

  const addGateFromScan = useCallback(
    (name: string, deviceId?: string) => {
      const gate = createGateFromScan(name, gates, deviceId);
      setGates((prev) => {
        if (prev.some((g) => g.id === gate.id)) {
          return prev.map((g) =>
            g.id === gate.id ? { ...g, name: gate.name } : g,
          );
        }
        return [...prev, gate];
      });
      setSelectedGateId(gate.id);
      return gate;
    },
    [gates],
  );

  const suggestNextGateName = useCallback(
    (locale: Locale) => nextGateDefaultName(gates.length, locale),
    [gates.length],
  );

  const value = useMemo(
    () => ({
      gates,
      selectedGateId,
      selectedGate,
      selectGate,
      addGateFromScan,
      suggestNextGateName,
      refreshFromServer,
    }),
    [
      gates,
      selectedGateId,
      selectedGate,
      selectGate,
      addGateFromScan,
      suggestNextGateName,
      refreshFromServer,
    ],
  );

  return (
    <GatesContext.Provider value={value}>{children}</GatesContext.Provider>
  );
}

export function useGates() {
  const ctx = useContext(GatesContext);
  if (!ctx) throw new Error("useGates must be used within GatesProvider");
  return ctx;
}
