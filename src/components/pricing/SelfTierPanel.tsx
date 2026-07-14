import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { getSelfPricingPlans } from "@/lib/pricing";
import { TierCard } from "./TierCard";

export function SelfTierPanel({
  locale,
  isLoggedIn,
}: {
  locale: Locale;
  isLoggedIn: boolean;
}) {
  const plans = getSelfPricingPlans(locale);

  return (
    <div>
      <p className="mb-6 text-sm text-ink-body">{t("pricing.selfIntro", locale)}</p>
      <div className="mx-auto grid max-w-md grid-cols-1 gap-5">
        {plans.map((plan) => (
          <TierCard
            key={plan.id}
            eyebrow={t("pricing.selfEyebrowFree", locale)}
            name={plan.name}
            badge={plan.badge}
            price={plan.price}
            priceSub={plan.seats}
            description={plan.description}
            features={plan.features}
            ctaLabel={t("pricing.selfCtaFree", locale)}
            ctaHref={isLoggedIn ? "/profile/results" : plan.ctaHref}
            ctaVariant="primary"
            highlighted
          />
        ))}
      </div>
    </div>
  );
}
