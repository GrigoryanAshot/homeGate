import type { Metadata } from "next";
import { SmartGateDemoClient } from "@/components/smartgate-demo/SmartGateDemoClient";

export const metadata: Metadata = {
  title: "Smart Gate — Demo",
  description: "Cloud gate control and access sharing demonstration.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function SmartGateDemoPage() {
  return <SmartGateDemoClient />;
}
