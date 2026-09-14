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
  renameGate: (id: string, name: string) => Promise<boolean>;
  removeGate: (id: string) => Promise<boolean>;
  suggestNextGateName: (locale: Locale) => string;
  refreshFromServer: () => Promise<void>;
};

const GatesContext = createContext<GatesContextValue | null>(null);

function fallbackGate(): UserGate {
  return { id: "gate-1", name: "Դարպաս 1", createdAt: Date.now() };
}

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
        const remoteIds = new Set(remote.map((g) => g.id));
        const locals = prev.filter(
          (g) => g.id.startsWith("gate-") && !remoteIds.has(g.id),
        );
        return [
          ...remote.map((g) => {
            const existing = prev.find((p) => p.id === g.id);
            return {
              id: g.id,
              name: g.name,
              createdAt: existing?.createdAt ?? g.createdAt,
            };
          }),
          ...locals,
        ];
      });

      setSelectedGateId((cur) =>
        remote.some((g) => g.id === cur) || cur.startsWith("gate-")
          ? cur
          : remote[0].id,
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
    () => gates.find((g) => g.id === selectedGateId) ?? gates[0] ?? fallbackGate(),
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

  const renameGate = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      if (user && !id.startsWith("gate-")) {
        try {
          const res = await fetch(`/api/devices/${encodeURIComponent(id)}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: trimmed }),
          });
          if (!res.ok) return false;
        } catch {
          return false;
        }
      }

      setGates((prev) =>
        prev.map((g) => (g.id === id ? { ...g, name: trimmed } : g)),
      );
      return true;
    },
    [user],
  );

  const removeGate = useCallback(
    async (id: string) => {
      if (user && !id.startsWith("gate-")) {
        try {
          const res = await fetch(`/api/devices/${encodeURIComponent(id)}`, {
            method: "DELETE",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          if (!res.ok && res.status !== 404) return false;
        } catch {
          return false;
        }
      }

      setGates((prev) => {
        const next = prev.filter((g) => g.id !== id);
        const final = next.length > 0 ? next : [fallbackGate()];
        setSelectedGateId((cur) => (cur === id ? final[0].id : cur));
        return final;
      });
      return true;
    },
    [user],
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
      renameGate,
      removeGate,
      suggestNextGateName,
      refreshFromServer,
    }),
    [
      gates,
      selectedGateId,
      selectedGate,
      selectGate,
      addGateFromScan,
      renameGate,
      removeGate,
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
