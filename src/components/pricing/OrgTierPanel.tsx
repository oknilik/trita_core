import type { Locale } from "@/lib/i18n";
import { getOrgPricingPlans } from "@/lib/pricing";
import { TierCard } from "./TierCard";

const introText: Record<Locale, string> = {
  hu: "Előfizetéses hozzáférés szervezeti szinten — több csapat, szerepkörök, candidate flow.",
  en: "Subscription access at the organizational level — multiple teams, roles, candidate flow.",
};

const trialNote: Record<Locale, string> = {
  hu: "Éves számlázásnál kedvezőbb havi díj. 14 napos próba kártyaadat nélkül.",
  en: "Annual billing offers a lower monthly rate. 14-day trial, no card required.",
};

const ctaLabels: Record<Locale, { org: string; scale: string }> = {
  hu: { org: "Elindítom", scale: "Kapcsolatfelvétel" },
  en: { org: "Get started", scale: "Get in touch" },
};

export function OrgTierPanel({
  locale,
  isLoggedIn,
}: {
  locale: Locale;
  isLoggedIn: boolean;
}) {
  const plans = getOrgPricingPlans(locale);
  const labels = ctaLabels[locale] ?? ctaLabels.hu;

  return (
    <div>
      <p className="mb-6 text-sm text-ink-body">{introText[locale] ?? introText.hu}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <TierCard
            key={plan.id}
            eyebrow={
              plan.isCustom
                ? locale === "hu" ? "szervezet · egyedi" : "organization · custom"
                : locale === "hu" ? "szervezet · előfizetés" : "organization · subscription"
            }
            name={plan.name}
            badge={plan.badge}
            price={plan.price}
            priceSub={plan.perMonth}
            description={plan.description}
            features={plan.features}
            ctaLabel={plan.isCustom ? labels.scale : labels.org}
            ctaHref={
              plan.isCustom
                ? plan.ctaHref
                : isLoggedIn
                ? "/billing/checkout?plan=org_annual"
                : plan.ctaHref
            }
            ctaVariant={plan.id === "org" ? "primary" : "outline"}
            highlighted={plan.id === "org"}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">{trialNote[locale] ?? trialNote.hu}</p>
    </div>
  );
}
