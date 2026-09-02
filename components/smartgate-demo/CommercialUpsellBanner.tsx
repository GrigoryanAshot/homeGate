import { IconArrowRight, IconSparkle } from "@/components/ui/icons";
import { Button } from "@/components/ui/primitives";

export function CommercialUpsellBanner() {
  return (
    <aside className="relative overflow-hidden rounded-[28px] border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-6 md:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-green-200/40 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-800">
            <IconSparkle className="h-3.5 w-3.5" />
            Enterprise ready
          </div>
          <h2 className="text-balance text-xl font-bold tracking-tight text-gate-ink md:text-2xl">
            White-label SmartGate for your properties & logistics fleet
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gate-muted md:text-base">
            MQTT cloud relay, guest QR passes, role-based permissions, audit logs,
            and co-branded mobile experiences — deployed on your domain with
            HiveMQ or your preferred broker.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-gate-muted sm:grid-cols-2">
            {[
              "Multi-site dashboard",
              "API & webhook integrations",
              "SLA-backed cloud broker",
              "Custom branding & SSO",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gate-gold" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
          <Button variant="primary" className="gap-2 whitespace-nowrap">
            Schedule pilot call
            <IconArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="whitespace-nowrap">
            Download spec sheet
          </Button>
        </div>
      </div>
    </aside>
  );
}
