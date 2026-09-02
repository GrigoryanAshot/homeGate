import type { Metadata, Viewport } from "next";
import { InvitedGateClient } from "@/components/smartgate-demo/InvitedGateClient";

export const metadata: Metadata = {
  title: "Gate access",
  description: "Open or close the gate",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#e8f2ff",
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
