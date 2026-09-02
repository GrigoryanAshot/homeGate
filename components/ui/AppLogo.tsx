import { cn } from "@/lib/utils";

/** Logo with visible dark lines (derived from logo3.png alpha mask) */
export const APP_LOGO_SRC = "/img/logo-app.png";

export function AppLogo({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={APP_LOGO_SRC}
      alt="HomeGate"
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
