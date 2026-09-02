import type { Metadata, Viewport } from "next";
import { SmartGateDemoClient } from "@/components/smartgate-demo/SmartGateDemoClient";

export const metadata: Metadata = {
  title: "Smart Gate — Demo",
  description: "Cloud gate control and access sharing demonstration.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smart Gate",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#e8f2ff",
};

export default function SmartGateDemoPage() {
  return <SmartGateDemoClient />;
}
