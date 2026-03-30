"use client";

import { useState } from "react";
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
  const [billing, setBilling] = useState<"annual" | "monthly">("annual");
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
            monthlyPrice={plan.monthlyPrice}
            priceSub={plan.perMonth}
            description={plan.description}
            features={plan.features}
            ctaLabel={plan.isCustom ? t("pricing.orgCtaScale", locale) : t("pricing.orgCtaOrg", locale)}
            ctaHref={
              plan.isCustom
                ? plan.ctaHref
                : isLoggedIn
                ? `/billing/checkout?plan=org_${billing}`
                : plan.ctaHref
            }
            ctaVariant={plan.id === "org" ? "primary" : "outline"}
            highlighted={plan.id === "org"}
            billing={plan.isCustom ? undefined : billing}
            onBillingChange={plan.isCustom ? undefined : setBilling}
            billingLabelAnnual={t("pricing.billingAnnual", locale)}
            billingLabelMonthly={t("pricing.billingMonthly", locale)}
            billingLegend={t("pricing.billingLegend", locale)}
            billingHintAnnual={t("pricing.billingHintAnnual", locale)}
            billingHintMonthly={t("pricing.billingHintMonthly", locale)}
            billingSavingsNote={t("pricing.billingSavingsNote", locale)}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">{t("pricing.orgTrialNote", locale)}</p>
    </div>
  );
}
