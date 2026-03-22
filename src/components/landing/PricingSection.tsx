import Link from "next/link";
import { getPricingPlans } from "@/lib/pricing";
import type { Locale } from "@/lib/i18n";

const copy: Record<
  Locale,
  {
    eyebrow: string;
    heading: string;
    sub: string;
    trial: string;
    viewAll: string;
    popular: string;
    perMonth: string;
    seats: string;
    custom: string;
    contactUs: string;
    startFree: string;
    startOrg: string;
  }
> = {
  hu: {
    eyebrow: "04 — Árazás",
    heading: "Egyszerű árazás.\nNincs meglepetés.",
    sub: "Éves számlázással. 14 napos ingyenes próba, kártyaadat nélkül.",
    trial: "14 nap ingyenes",
    viewAll: "Részletes összehasonlítás →",
    popular: "Legnépszerűbb",
    perMonth: "/hó",
    seats: "seatig",
    custom: "Egyedi",
    contactUs: "Kapcsolat →",
    startFree: "Kipróbálom ingyen",
    startOrg: "Elindítom",
  },
  en: {
    eyebrow: "04 — Pricing",
    heading: "Simple pricing.\nNo surprises.",
    sub: "Annual billing. 14-day free trial, no credit card required.",
    trial: "14-day free trial",
    viewAll: "Detailed comparison →",
    popular: "Most popular",
    perMonth: "/mo",
    seats: "seats",
    custom: "Custom",
    contactUs: "Contact us →",
    startFree: "Try for free",
    startOrg: "Get started",
  },
};

export function PricingSection({ locale }: { locale: Locale }) {
  const c = copy[locale] ?? copy.hu;
  const plans = getPricingPlans(locale);
  const [headingLine1, headingLine2] = c.heading.split("\n");

  return (
    <section id="pricing" className="border-b border-[#e0ddd6] px-6 py-12 md:px-16 md:py-20">
      <div className="font-ibm-plex-mono mb-4 text-[11px] uppercase tracking-[2px] text-[#5a5650]">
        {c.eyebrow}
      </div>

      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h2 className="font-playfair text-[clamp(28px,7vw,48px)] font-black leading-[1.1] tracking-[-1px] text-[#1a1814] md:tracking-[-1.5px]">
          {headingLine1}
          <br />
          {headingLine2}
        </h2>
        <p className="font-ibm-plex-mono text-[12px] text-[#5a5650] md:text-right">
          {c.sub}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isTeam = plan.id === "team";
          const isScale = plan.id === "scale";

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col overflow-hidden rounded border ${
                isTeam
                  ? "border-[#c8410a]/40 bg-[#1a1814] text-white"
                  : "border-[#e0ddd6] bg-white text-[#1a1814]"
              }`}
            >
              {plan.badge && (
                <div className="absolute right-4 top-4">
                  <span className="font-ibm-plex-mono rounded-full bg-[#c8410a] px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-white">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className={`px-6 pb-5 pt-6 ${isTeam ? "border-b border-white/10" : "border-b border-[#e0ddd6]"}`}>
                <p className={`font-ibm-plex-mono mb-3 text-[10px] uppercase tracking-[2px] ${isTeam ? "text-white/40" : "text-[#5a5650]"}`}>
                  {plan.name}
                </p>
                {isScale ? (
                  <div className="font-playfair text-[36px] font-black leading-none tracking-[-1px]">
                    {c.custom}
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="font-playfair text-[40px] font-black leading-none tracking-[-2px]">
                      {plan.price}
                    </span>
                    <span className={`font-ibm-plex-sans text-sm font-light ${isTeam ? "text-white/50" : "text-[#5a5650]"}`}>
                      {c.perMonth}
                    </span>
                  </div>
                )}
                <p className={`mt-1.5 text-[12px] ${isTeam ? "text-white/40" : "text-[#5a5650]"}`}>
                  {isScale ? plan.seats : `${plan.seats.split("·")[0].trim()} · ${locale === "hu" ? c.seats : c.seats}`}
                </p>
              </div>

              <ul className="flex flex-1 flex-col gap-2.5 px-6 py-5">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-[13px] ${isTeam ? "text-white/75" : "text-[#5a5650]"}`}>
                    <span className={`mt-0.5 shrink-0 text-[11px] font-bold ${isTeam ? "text-[#c8410a]" : "text-[#1a5c3a]"}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="px-6 pb-6">
                <Link
                  href={isScale ? "/contact" : "/sign-up"}
                  className={`inline-flex min-h-[44px] w-full items-center justify-center rounded text-[14px] font-medium transition-all hover:-translate-y-px ${
                    isTeam
                      ? "bg-[#c8410a] text-white hover:bg-[#a33408]"
                      : "border border-[#e0ddd6] bg-white text-[#1a1814] hover:border-[#c8410a]/40 hover:text-[#c8410a]"
                  }`}
                >
                  {isScale ? c.contactUs : isTeam ? c.startFree : c.startOrg}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="font-ibm-plex-mono text-[11px] text-[#5a5650]">
          {locale === "hu" ? "Extra seat: +€19/fő/hó · Jelölt értékelés: +€39/értékelés" : "Extra seat: +€19/user/mo · Candidate assessment: +€39/assessment"}
        </p>
        <Link
          href="/pricing"
          className="font-ibm-plex-mono text-[11px] text-[#5a5650] transition-colors hover:text-[#c8410a]"
        >
          {c.viewAll}
        </Link>
      </div>
    </section>
  );
}
