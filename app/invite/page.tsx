import type { Metadata } from "next";
import { InvitedGateClient } from "@/components/smartgate-demo/InvitedGateClient";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Gate access",
  description: "Open or close the gate",
  robots: { index: false, follow: false },
};

/**
 * Family-friendly invite URL: /invite?t=TOKEN
 * (path /invite/TOKEN.breaks on phones — tokens contain a ".")
 */
export default async function InviteQueryPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; token?: string }>;
}) {
  const q = await searchParams;
  const token = (q.t ?? q.token ?? "").trim();
  if (!token) {
    redirect("/gate");
  }
  return <InvitedGateClient token={token} />;
}
