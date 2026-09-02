"use client";

import { useState } from "react";
import { Badge, Button, GlassCard, SectionHeader } from "@/components/ui/primitives";
import {
  DEFAULT_PERMISSIONS,
  type PermissionUser,
} from "@/lib/smartgate/types";

export function PermissionsTable({
  onRevoke,
}: {
  onRevoke?: (user: PermissionUser) => void;
}) {
  const [users, setUsers] = useState(DEFAULT_PERMISSIONS);

  function revoke(user: PermissionUser) {
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    onRevoke?.(user);
  }

  const roleLabels: Record<PermissionUser["role"], string> = {
    owner: "Owner",
    family: "Family",
    guest: "Guest",
  };

  return (
    <GlassCard className="h-full">
      <SectionHeader
        kicker="Access control"
        title="Permissions & Roles"
        description="Role-based access matrix for residents, staff, and temporary guests."
      />

      <div className="overflow-hidden rounded-2xl border border-gate-line">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-gate-line bg-slate-50">
                {["User", "Role", "Access", "Action"].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gate-muted"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className={
                    i % 2 === 0
                      ? "border-b border-gate-line/60 bg-transparent"
                      : "border-b border-gate-line/60 bg-slate-50/80"
                  }
                >
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-gate-ink">{user.name}</p>
                    <p className="text-xs text-gate-muted">{user.label}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={user.role === "guest" ? "cyan" : "gold"}>
                      {roleLabels[user.role]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-gate-muted">{user.access}</td>
                  <td className="px-4 py-3.5">
                    {user.role !== "owner" ? (
                      <Button
                        variant="ghost"
                        className="min-h-9 px-3 py-1.5 text-xs"
                        onClick={() => revoke(user)}
                      >
                        Revoke
                      </Button>
                    ) : (
                      <span className="text-xs text-gate-muted/60">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </GlassCard>
  );
}
