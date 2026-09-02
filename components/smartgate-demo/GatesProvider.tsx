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

type GatesContextValue = {
  gates: UserGate[];
  selectedGateId: string;
  selectedGate: UserGate;
  selectGate: (id: string) => void;
  addGateFromScan: (name: string) => UserGate;
  suggestNextGateName: (locale: Locale) => string;
};

const GatesContext = createContext<GatesContextValue | null>(null);

export function GatesProvider({ children }: { children: React.ReactNode }) {
  const [gates, setGates] = useState<UserGate[]>(() => loadUserGates());
  const [selectedGateId, setSelectedGateId] = useState(() =>
    loadSelectedGateId(loadUserGates()[0]?.id ?? "gate-1"),
  );

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
    (name: string) => {
      const gate = createGateFromScan(name, gates);
      setGates((prev) => [...prev, gate]);
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
    }),
    [
      gates,
      selectedGateId,
      selectedGate,
      selectGate,
      addGateFromScan,
      suggestNextGateName,
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
