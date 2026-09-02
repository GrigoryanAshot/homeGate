import type { Metadata, Viewport } from "next";
import { InvitedGateDemoClient } from "@/components/smartgate-demo/InvitedGateDemoClient";

export const metadata: Metadata = {
  title: "Guest access — demo",
  description: "Guest gate control demonstration",
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

export default function InviteDemoPage() {
  return <InvitedGateDemoClient />;
}
