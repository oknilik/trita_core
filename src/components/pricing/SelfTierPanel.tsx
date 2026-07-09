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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {plans.map((plan) => {
          const isFree = plan.id === "self_start";
          const isFeatured = plan.id === "self_plus";
          return (
            <TierCard
              key={plan.id}
              eyebrow={isFree ? t("pricing.selfEyebrowFree", locale) : t("pricing.selfEyebrowPaid", locale)}
              name={plan.name}
              badge={plan.badge}
              price={plan.price}
              priceSub={plan.seats}
              description={plan.description}
              features={plan.features}
              ctaLabel={isFree ? t("pricing.selfCtaFree", locale) : t("pricing.selfCtaPaid", locale)}
              ctaHref={isLoggedIn ? "/profile/results" : plan.ctaHref}
              ctaVariant={isFeatured ? "primary" : "outline"}
              highlighted={isFeatured}
            />
          );
        })}
      </div>
    </div>
  );
}
