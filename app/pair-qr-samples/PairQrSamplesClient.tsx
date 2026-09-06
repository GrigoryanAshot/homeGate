"use client";

import { QRCodeSVG } from "qrcode.react";
import { buildPairQrValue } from "@/lib/smartgate/pair-qr";

const SAMPLES = [
  {
    label: "FREE — demo-gate-001",
    id: "demo-gate-001",
    secret: "secret-demo-001",
  },
  {
    label: "FREE — demo-gate-002",
    id: "demo-gate-002",
    secret: "secret-demo-002",
  },
  {
    label: "BUSY — should reject",
    id: "demo-gate-busy",
    secret: "secret-demo-busy",
  },
];

export function PairQrSamplesClient() {
  return (
    <main className="mx-auto min-h-dvh max-w-lg space-y-8 bg-white px-4 py-8 text-slate-900">
      <div>
        <h1 className="text-xl font-bold">Pair QR samples</h1>
        <p className="mt-1 text-sm text-slate-600">
          Open this page on another device, then scan from Touch SmartGate → Add
          gate. Local only — seed DB first (`npm run db:seed`).
        </p>
      </div>
      {SAMPLES.map((sample) => {
        const value = buildPairQrValue(sample.id, sample.secret);
        return (
          <section
            key={sample.id}
            className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 p-4"
          >
            <p className="text-sm font-bold">{sample.label}</p>
            <QRCodeSVG value={value} size={200} level="M" includeMargin />
            <p className="break-all text-center font-mono text-[0.65rem] text-slate-500">
              {value}
            </p>
          </section>
        );
      })}
    </main>
  );
}
