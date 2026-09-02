import type { Metadata } from "next";
import { InvitedGateClient } from "@/components/smartgate-demo/InvitedGateClient";

export const metadata: Metadata = {
  title: "Gate access",
  description: "Open or close the gate",
  robots: { index: false, follow: false },
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);

  return <InvitedGateClient token={decoded} />;
}
