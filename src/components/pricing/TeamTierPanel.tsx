import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { getTeamPricingPlans } from "@/lib/pricing";
import { TierCard } from "./TierCard";

export function TeamTierPanel({
  locale,
  isLoggedIn,
}: {
  locale: Locale;
  isLoggedIn: boolean;
}) {
  const plans = getTeamPricingPlans(locale);

  return (
    <div>
      <p className="mb-6 text-sm text-ink-body">{t("pricing.teamIntro", locale)}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <TierCard
            key={plan.id}
            eyebrow={t("pricing.teamEyebrow", locale)}
            name={plan.name}
            badge={plan.badge}
            price={plan.price}
            priceSub={plan.perMonth}
            description={plan.description}
            features={plan.features}
            ctaLabel={t("pricing.teamCta", locale)}
            ctaHref={isLoggedIn ? "/billing/checkout?plan=team_annual" : plan.ctaHref}
            ctaVariant={plan.id === "team" ? "primary" : "outline"}
            highlighted={plan.id === "team"}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">{t("pricing.teamTrialNote", locale)}</p>
    </div>
  );
}
