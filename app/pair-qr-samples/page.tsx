import type { Metadata } from "next";
import { PairQrSamplesClient } from "./PairQrSamplesClient";

export const metadata: Metadata = {
  title: "Pair QR samples",
  robots: { index: false, follow: false },
};

export default function PairQrSamplesPage() {
  return <PairQrSamplesClient />;
}
