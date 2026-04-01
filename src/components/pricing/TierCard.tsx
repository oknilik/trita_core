import Link from "next/link";

export interface TierCardProps {
  eyebrow: string;
  name: string;
  badge?: string;
  price: string;
  monthlyPrice?: string;
  priceSub: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "primary" | "outline";
  highlighted?: boolean;
  billing?: "annual" | "monthly";
  onBillingChange?: (billing: "annual" | "monthly") => void;
  billingLabelAnnual?: string;
  billingLabelMonthly?: string;
  billingLegend?: string;
  billingHintAnnual?: string;
  billingHintMonthly?: string;
  billingSavingsNote?: string;
}

export function TierCard({
  eyebrow,
  name,
  badge,
  price,
  monthlyPrice,
  priceSub,
  description,
  features,
  ctaLabel,
  ctaHref,
  ctaVariant,
  highlighted = false,
  billing,
  onBillingChange,
  billingLabelAnnual,
  billingLabelMonthly,
  billingLegend,
  billingHintAnnual,
  billingHintMonthly,
  billingSavingsNote,
}: TierCardProps) {
  const showToggle = monthlyPrice && billing && onBillingChange;
  const displayPrice = billing === "monthly" && monthlyPrice ? monthlyPrice : price;
  const isAnnual = billing === "annual";

  return (
    <article
      className={`relative flex flex-col rounded-2xl border p-6 md:p-8 ${
        highlighted
          ? "border-sage bg-sage-ghost shadow-sm"
          : "border-sand bg-white"
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-6 rounded-full bg-sage px-3 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
          {badge}
        </span>
      )}

      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {eyebrow}
      </p>
      <h3 className="mt-2 font-fraunces text-2xl text-ink">{name}</h3>
      <p className="mt-1.5 text-sm text-ink-body">{description}</p>

      {showToggle && (
        <div className="mt-4">
          <div className="inline-flex flex-col rounded-[18px] border border-[#ead8c9] bg-[#fbf7f1] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <p className="mb-1 px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#8a7567]">
              {billingLegend ?? "Billing"}
            </p>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => onBillingChange("annual")}
                className={`min-h-[38px] rounded-[14px] px-3.5 text-left transition-all ${
                  billing === "annual"
                    ? "bg-white text-ink shadow-[0_8px_20px_rgba(26,26,46,0.08)] ring-1 ring-[#ead8c9]"
                    : "text-[#7a756e] hover:bg-white/70"
                }`}
              >
                <span className="block text-[12px] font-semibold">
                  {billingLabelAnnual ?? "Éves"}
                </span>
                <span className="mt-0.5 block text-[10px] text-[var(--color-bronze-dark)]">
                  {billingHintAnnual ?? "Better value"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onBillingChange("monthly")}
                className={`min-h-[38px] rounded-[14px] px-3.5 text-left transition-all ${
                  billing === "monthly"
                    ? "bg-white text-ink shadow-[0_8px_20px_rgba(26,26,46,0.08)] ring-1 ring-[#ead8c9]"
                    : "text-[#7a756e] hover:bg-white/70"
                }`}
              >
                <span className="block text-[12px] font-semibold">
                  {billingLabelMonthly ?? "Havi"}
                </span>
                <span className="mt-0.5 block text-[10px] text-[var(--color-text-muted)]">
                  {billingHintMonthly ?? "Flexible"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-sand pt-4">
        <span className="font-fraunces text-4xl tracking-tight text-ink">
          {displayPrice}
        </span>
        {priceSub && (
          <span className="ml-2 text-sm text-muted">{priceSub}</span>
        )}
        {billing === "monthly" && billingSavingsNote && (
          <p className="mt-1.5 text-[11px] text-[var(--color-bronze-dark)]">
            {billingSavingsNote}
          </p>
        )}
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {features.map((f) => (
          <li
            key={f}
            className="relative pl-5 text-sm leading-relaxed text-ink-body before:absolute before:left-0 before:top-[0.75em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-bronze"
          >
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={`mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-5 text-sm font-semibold transition ${
          ctaVariant === "primary"
            ? "bg-sage text-white hover:bg-sage-dark"
            : "border border-sage text-bronze hover:bg-sage-ghost"
        }`}
      >
        {ctaLabel}
      </Link>
    </article>
  );
}
