"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { getTeamPricingPlans } from "@/lib/pricing";
import { TierCard } from "./TierCard";

export function TeamTierPanel({
  locale,
}: {
  locale: Locale;
}) {
  const [billing, setBilling] = useState<"annual" | "monthly">("annual");
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
              monthlyPrice={plan.monthlyPrice}
              priceSub={isSnapshot ? plan.seats : plan.perMonth}
              description={plan.description}
              features={plan.features}
              ctaLabel={t("pricing.contactCta", locale)}
              ctaHref="/contact"
              ctaVariant={plan.id === "team" ? "primary" : "outline"}
              highlighted={plan.id === "team"}
              billing={isSnapshot ? undefined : billing}
              onBillingChange={isSnapshot ? undefined : setBilling}
              billingLabelAnnual={t("pricing.billingAnnual", locale)}
              billingLabelMonthly={t("pricing.billingMonthly", locale)}
              billingLegend={t("pricing.billingLegend", locale)}
              billingHintAnnual={t("pricing.billingHintAnnual", locale)}
              billingHintMonthly={t("pricing.billingHintMonthly", locale)}
              billingSavingsNote={t("pricing.billingSavingsNote", locale)}
            />
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted">{t("pricing.teamTrialNote", locale)}</p>
    </div>
  );
}
