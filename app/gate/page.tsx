import type { Metadata } from "next";
import { SmartGateDemoClient } from "@/components/smartgate-demo/SmartGateDemoClient";

export const metadata: Metadata = {
  title: "Touch SmartGate",
  description: "Cloud gate control and access sharing.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function GateAppPage() {
  return <SmartGateDemoClient />;
}
