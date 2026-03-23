import type { Locale } from "@/lib/i18n";
import { getSelfPricingPlans } from "@/lib/pricing";
import { TierCard } from "./TierCard";

const ctaLabels: Record<Locale, { free: string; solo: string }> = {
  hu: { free: "Kezdem ingyen", solo: "Kipróbálom ingyen" },
  en: { free: "Start for free", solo: "Try for free" },
};

const introText: Record<Locale, string> = {
  hu: "Személyes fejlődéshez — facet szintű részletességgel, observer visszajelzéssel.",
  en: "For personal development — facet-level depth, with observer feedback.",
};

export function SelfTierPanel({
  locale,
  isLoggedIn,
}: {
  locale: Locale;
  isLoggedIn: boolean;
}) {
  const plans = getSelfPricingPlans(locale);
  const labels = ctaLabels[locale] ?? ctaLabels.hu;

  return (
    <div>
      <p className="mb-6 text-sm text-ink-body">{introText[locale] ?? introText.hu}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <TierCard
            key={plan.id}
            eyebrow={
              plan.id === "free"
                ? locale === "hu" ? "egyéni · ingyenes" : "individual · free"
                : locale === "hu" ? "egyéni · előfizetés" : "individual · subscription"
            }
            name={plan.name}
            badge={plan.badge}
            price={plan.price}
            priceSub={plan.perMonth}
            description={plan.description}
            features={plan.features}
            ctaLabel={plan.id === "solo" ? labels.solo : labels.free}
            ctaHref={isLoggedIn ? "/dashboard" : plan.ctaHref}
            ctaVariant={plan.id === "solo" ? "primary" : "outline"}
            highlighted={plan.id === "solo"}
          />
        ))}
      </div>
    </div>
  );
}
