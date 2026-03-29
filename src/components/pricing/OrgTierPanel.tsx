import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { getOrgPricingPlans } from "@/lib/pricing";
import { TierCard } from "./TierCard";

export function OrgTierPanel({
  locale,
  isLoggedIn,
}: {
  locale: Locale;
  isLoggedIn: boolean;
}) {
  const plans = getOrgPricingPlans(locale);

  return (
    <div>
      <p className="mb-6 text-sm text-ink-body">{t("pricing.orgIntro", locale)}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <TierCard
            key={plan.id}
            eyebrow={
              plan.isCustom
                ? t("pricing.orgEyebrowCustom", locale)
                : t("pricing.orgEyebrowSub", locale)
            }
            name={plan.name}
            badge={plan.badge}
            price={plan.price}
            priceSub={plan.perMonth}
            description={plan.description}
            features={plan.features}
            ctaLabel={plan.isCustom ? t("pricing.orgCtaScale", locale) : t("pricing.orgCtaOrg", locale)}
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
      <p className="mt-4 text-xs text-muted">{t("pricing.orgTrialNote", locale)}</p>
    </div>
  );
}
