"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "./LocaleProvider";

const SCANNER_ELEMENT_ID = "smartgate-qr-reader";

export function DeviceQrScanner({
  active,
  onDecoded,
  onError,
}: {
  active: boolean;
  onDecoded: (text: string) => void;
  onError?: (message: string) => void;
}) {
  const { t } = useLocale();
  const [starting, setStarting] = useState(false);
  const [running, setRunning] = useState(false);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const onDecodedRef = useRef(onDecoded);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onDecodedRef.current = onDecoded;
    onErrorRef.current = onError;
  }, [onDecoded, onError]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    handledRef.current = false;

    async function start() {
      setStarting(true);
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const existing = scannerRef.current;
        if (existing?.isScanning) {
          await existing.stop().catch(() => undefined);
          existing.clear();
        }

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
          verbose: false,
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 8,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1,
          },
          (decoded) => {
            if (handledRef.current || cancelled) return;
            handledRef.current = true;
            onDecodedRef.current(decoded);
          },
          () => {
            /* frame with no QR — ignore */
          },
        );

        if (cancelled) {
          await scanner.stop().catch(() => undefined);
          scanner.clear();
          return;
        }
        setRunning(true);
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        const message = err instanceof Error ? err.message : String(err);
        if (
          name === "NotAllowedError" ||
          /permission|NotAllowed/i.test(message)
        ) {
          onErrorRef.current?.(t.scanCameraPermissionDenied);
        } else if (
          name === "NotFoundError" ||
          /Requested device not found|no camera/i.test(message)
        ) {
          onErrorRef.current?.(t.scanCameraUnavailable);
        } else {
          onErrorRef.current?.(t.scanCameraUnavailable);
        }
        setRunning(false);
      } finally {
        if (!cancelled) setStarting(false);
      }
    }

    void start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      setRunning(false);
      setStarting(false);
      if (scanner) {
        void (async () => {
          try {
            if (scanner.isScanning) await scanner.stop();
          } catch {
            /* ignore */
          }
          try {
            scanner.clear();
          } catch {
            /* ignore */
          }
        })();
      }
    };
  }, [active, t.scanCameraPermissionDenied, t.scanCameraUnavailable]);

  return (
    <div className="relative mx-auto mb-4 w-full max-w-[280px]">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border-4 border-slate-800 bg-slate-900",
          "[&_video]:!h-full [&_video]:!w-full [&_video]:object-cover",
          "[&_img]:!h-full [&_img]:!w-full [&_img]:object-cover",
        )}
      >
        <div id={SCANNER_ELEMENT_ID} className="min-h-[260px] w-full" />
      </div>
      {(starting || !running) && active && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/40">
          <span className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
            {starting ? t.scanCameraStarting : t.scanGateScanning}
          </span>
        </div>
      )}
    </div>
  );
}
