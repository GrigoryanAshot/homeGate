import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  glow,
}: {
  className?: string;
  children: React.ReactNode;
  glow?: "gold" | "ok" | "cyan" | "none";
}) {
  return (
    <section
      className={cn(
        "glass-panel p-5 md:p-6",
        glow === "gold" && "shadow-glow",
        glow === "ok" && "shadow-glow-ok",
        glow === "cyan" && "shadow-[0_8px_32px_rgba(2,132,199,0.12)]",
        className,
      )}
    >
      <div className="relative z-[1]">{children}</div>
    </section>
  );
}

export function SectionHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {kicker && <p className="section-kicker">{kicker}</p>}
        <h2 className="mt-1 text-xl font-bold tracking-tight text-gate-ink md:text-[1.35rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-gate-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone,
  variant,
}: {
  children: React.ReactNode;
  tone?: "gold" | "muted" | "ok" | "danger" | "cyan" | "warning";
  variant?: "gold" | "muted" | "ok" | "danger" | "cyan" | "warning";
}) {
  const resolved = variant ?? tone ?? "muted";
  const tones = {
    gold: "border border-blue-200 bg-blue-50 text-blue-800",
    muted: "border border-slate-200 bg-slate-50 text-slate-600",
    ok: "border border-green-200 bg-green-50 text-green-800",
    danger: "border border-red-200 bg-red-50 text-red-800",
    cyan: "border border-sky-200 bg-sky-50 text-sky-800",
    warning: "border border-amber-200 bg-amber-50 text-amber-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-wide",
        tones[resolved],
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  variant = "secondary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles = {
    primary: "control-btn-primary font-bold",
    secondary: "control-btn-secondary font-semibold",
    danger: "control-btn-danger font-semibold",
    ghost:
      "rounded-2xl border border-gate-line bg-white font-medium text-gate-muted transition hover:border-blue-200 hover:bg-blue-50 hover:text-gate-ink",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-40",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        "inline-flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition-all",
        checked
          ? "border-blue-300 bg-blue-50 text-blue-800"
          : "border-gate-line bg-white text-gate-muted hover:border-blue-200 hover:bg-blue-50/50",
      )}
    >
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-gate-gold" : "bg-slate-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

/* backward compat aliases */
export const Card = GlassCard;
export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-lg font-semibold text-gate-ink", className)}>
      {children}
    </h2>
  );
}
