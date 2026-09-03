import { cn } from "@/lib/utils";

/** Header logo — logo3 (logo-app.png = visible render for light backgrounds) */
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
      className={cn("shrink-0 object-contain dark:invert", className)}
      style={{ width: size, height: size }}
    />
  );
}
