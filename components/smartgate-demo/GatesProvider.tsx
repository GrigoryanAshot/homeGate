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
  selectedGate: UserGate | null;
  selectGate: (id: string) => void;
  addGateFromScan: (name: string, deviceId?: string) => UserGate;
  renameGate: (id: string, name: string) => Promise<boolean>;
  removeGate: (id: string) => Promise<boolean>;
  suggestNextGateName: (locale: Locale) => string;
  refreshFromServer: () => Promise<UserGate[]>;
};

const GatesContext = createContext<GatesContextValue | null>(null);

export function GatesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [gates, setGates] = useState<UserGate[]>([]);
  const [selectedGateId, setSelectedGateId] = useState("");

  // Load per-user cache whenever the signed-in profile changes.
  useEffect(() => {
    if (!userId) {
      setGates([]);
      setSelectedGateId("");
      setActiveGateId("");
      return;
    }
    const cached = loadUserGates(userId);
    setGates(cached);
    setSelectedGateId(loadSelectedGateId(cached[0]?.id ?? "", userId));
  }, [userId]);

  const refreshFromServer = useCallback(async (): Promise<UserGate[]> => {
    if (!userId) return [];
    try {
      const res = await fetch("/api/devices/mine", { credentials: "include" });
      if (!res.ok) return [];
      const data = (await res.json()) as {
        devices?: { id: string; name: string | null; claimedAt: string | null }[];
      };
      const remote = (data.devices ?? []).map((d) => ({
        id: d.id,
        name: d.name?.trim() || d.id,
        createdAt: d.claimedAt ? Date.parse(d.claimedAt) : Date.now(),
      }));

      // Oldest claim first so Gate 1 stays visually first.
      remote.sort((a, b) => a.createdAt - b.createdAt);

      setGates((prev) =>
        remote.map((g) => {
          const existing = prev.find((p) => p.id === g.id);
          return {
            id: g.id,
            name: g.name,
            createdAt: existing?.createdAt ?? g.createdAt,
          };
        }),
      );

      setSelectedGateId((cur) =>
        remote.some((g) => g.id === cur) ? cur : (remote[0]?.id ?? ""),
      );
      return remote;
    } catch {
      return [];
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void refreshFromServer();
  }, [userId, refreshFromServer]);

  useEffect(() => {
    if (!userId) return;
    saveUserGates(gates, userId);
  }, [gates, userId]);

  useEffect(() => {
    if (!userId) return;
    saveSelectedGateId(selectedGateId, userId);
    setActiveGateId(selectedGateId || "");
  }, [selectedGateId, userId]);

  const selectedGate = useMemo(
    () => gates.find((g) => g.id === selectedGateId) ?? gates[0] ?? null,
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
          // Already listed — keep existing name (server owns renames via PATCH).
          return prev;
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

      if (user) {
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
      if (user) {
        try {
          const res = await fetch(`/api/devices/${encodeURIComponent(id)}`, {
            method: "DELETE",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          // Already free / not owned — still drop from UI
          if (!res.ok && res.status !== 404) return false;
        } catch {
          return false;
        }
      }

      setGates((prev) => {
        const next = prev.filter((g) => g.id !== id);
        setSelectedGateId((cur) =>
          cur === id ? (next[0]?.id ?? "") : cur,
        );
        return next;
      });

      window.setTimeout(() => {
        void refreshFromServer();
      }, 300);

      return true;
    },
    [user, refreshFromServer],
  );

  const suggestNextGateName = useCallback(
    (locale: Locale) => nextGateDefaultName(gates, locale),
    [gates],
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
