import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { getTeamPricingPlans } from "@/lib/pricing";
import { TierCard } from "./TierCard";

export function TeamTierPanel({
  locale,
}: {
  locale: Locale;
}) {
  const plans = getTeamPricingPlans(locale);

  return (
    <div>
      <p className="mb-6 text-sm text-ink-body">{t("pricing.teamIntro", locale)}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {plans.map((plan) => {
          const isSnapshot = plan.id === "snapshot";
          return (
            <TierCard
              key={plan.id}
              eyebrow={isSnapshot
                ? t("pricing.teamEyebrowSnapshot", locale)
                : t("pricing.teamEyebrow", locale)
              }
              name={plan.name}
              badge={plan.badge}
              price={plan.price}
              priceSub={isSnapshot ? plan.seats : `${plan.perMonth} · ${plan.seats}`}
              description={plan.description}
              features={plan.features}
              ctaLabel={t("pricing.contactCta", locale)}
              ctaHref="/contact"
              ctaVariant={plan.id === "team" ? "primary" : "outline"}
              highlighted={plan.id === "team"}
            />
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted">{t("pricing.teamTrialNote", locale)}</p>
    </div>
  );
}
