import type { Metadata } from "next";
import { InvitedGateDemoClient } from "@/components/smartgate-demo/InvitedGateDemoClient";

export const metadata: Metadata = {
  title: "Guest access — demo",
  description: "Guest gate control demonstration",
  robots: { index: false, follow: false },
};

export default function InviteDemoPage() {
  return <InvitedGateDemoClient />;
}
