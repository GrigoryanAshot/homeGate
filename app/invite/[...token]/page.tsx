import type { Metadata } from "next";
import { InvitedGateClient } from "@/components/smartgate-demo/InvitedGateClient";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Gate access",
  description: "Open or close the gate",
  robots: { index: false, follow: false },
};

/**
 * Legacy path URLs. Tokens are "payload.signature" — catch-all rejoins the dot.
 */
export default async function InvitePathPage({
  params,
}: {
  params: Promise<{ token: string[] }>;
}) {
  const { token: parts } = await params;
  const joined = (parts ?? []).map((p) => decodeURIComponent(p)).join(".");
  if (!joined || joined === "demo") {
    // /invite/demo is a separate route; shouldn't hit here
    redirect("/smartgate-demo");
  }
  // Prefer query form going forward
  redirect(`/invite?t=${encodeURIComponent(joined)}`);
}
