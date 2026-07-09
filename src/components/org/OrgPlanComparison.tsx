"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { PlanUpgradeModal } from "./PlanUpgradeModal";

interface Plan {
  key: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  seats: string;
  description: string;
  priceKeyMonthly: string;
  priceKeyAnnual: string;
}

interface OrgPlanComparisonProps {
  currentPlanType: string | null;
  currentInterval: string | null;
  hasSubscription: boolean;
  orgId: string;
  locale: string;
  isAdmin: boolean;
}

const PLAN_ORDER = ["team", "org", "scale"];

function getPlanRank(planType: string | null): number {
  if (!planType) return -1;
  return PLAN_ORDER.indexOf(planType);
}

export function OrgPlanComparison({
  currentPlanType,
  currentInterval,
  hasSubscription,
  orgId,
  locale,
  isAdmin,
}: OrgPlanComparisonProps) {
  const loc = locale as Locale;
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    (currentInterval as "monthly" | "annual") ?? "annual",
  );
  const [upgradeTarget, setUpgradeTarget] = useState<{
    planKey: string;
    planName: string;
    priceKey: string;
  } | null>(null);

  const plans: Plan[] = [
    {
      key: "team",
      name: "Team",
      priceMonthly: 49,
      priceAnnual: 39,
      seats: t("org.billing.teamSeats", loc),
      description: t("org.billing.teamDesc", loc),
      priceKeyMonthly: "team_monthly",
      priceKeyAnnual: "team_annual",
    },
    {
      key: "org",
      name: "Org",
      priceMonthly: 99,
      priceAnnual: 79,
      seats: t("org.billing.orgSeats", loc),
      description: t("org.billing.orgDesc", loc),
      priceKeyMonthly: "org_monthly",
      priceKeyAnnual: "org_annual",
    },
    {
      key: "scale",
      name: "Scale",
      priceMonthly: 0,
      priceAnnual: 0,
      seats: t("org.billing.scaleSeats", loc),
      description: t("org.billing.scaleDesc", loc),
      priceKeyMonthly: "",
      priceKeyAnnual: "",
    },
  ];

  const currentRank = getPlanRank(currentPlanType);

  function handlePlanAction(plan: Plan) {
    if (plan.key === "scale") return; // Contact sales
    const priceKey = billingCycle === "annual" ? plan.priceKeyAnnual : plan.priceKeyMonthly;

    if (!hasSubscription) {
      // No subscription yet — go to checkout
      window.location.href = `/billing/checkout?plan=${priceKey}`;
      return;
    }

    // Has subscription — show upgrade modal
    setUpgradeTarget({
      planKey: plan.key,
      planName: plan.name,
      priceKey,
    });
  }

  const currentPlanLabel =
    currentPlanType === "team" ? "Team" :
    currentPlanType === "org" ? "Org" :
    currentPlanType === "scale" ? "Scale" : "—";

  return (
    <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-bronze">
        {t("org.billing.plansEyebrow", loc)}
      </p>
      <h2 className="mt-1 font-fraunces text-xl text-ink">
        {t("org.billing.plansTitle", loc)}
      </h2>

      {/* Billing cycle toggle */}
      <div className="mt-4 inline-flex rounded-lg border border-sand bg-cream p-0.5">
        <button
          type="button"
          onClick={() => setBillingCycle("monthly")}
          className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
            billingCycle === "monthly"
              ? "bg-white text-ink shadow-sm"
              : "text-muted hover:text-ink-body"
          }`}
        >
          {t("org.billing.monthly", loc)}
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle("annual")}
          className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
            billingCycle === "annual"
              ? "bg-white text-ink shadow-sm"
              : "text-muted hover:text-ink-body"
          }`}
        >
          {t("org.billing.annual", loc)}
        </button>
      </div>

      {billingCycle === "annual" && (
        <p className="mt-2 text-[11px] text-sage">
          {t("org.billing.annualSave", loc)}
        </p>
      )}

      {/* Plan cards */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const planRank = getPlanRank(plan.key);
          const isCurrent = currentPlanType === plan.key;
          const isUpgrade = planRank > currentRank;
          const isDowngrade = planRank < currentRank && planRank >= 0;
          const price = billingCycle === "annual" ? plan.priceAnnual : plan.priceMonthly;
          const isScale = plan.key === "scale";

          return (
            <div
              key={plan.key}
              className={[
                "flex flex-col rounded-xl border-[1.5px] p-4 transition-all",
                isCurrent && "border-sage bg-sage-soft",
                !isCurrent && isUpgrade && "border-bronze/30 hover:border-bronze/60",
                !isCurrent && !isUpgrade && "border-sand",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* Badge */}
              {isCurrent && (
                <span className="mb-2 inline-flex self-start rounded bg-sage px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  {t("org.billing.currentBadge", loc)}
                </span>
              )}
              {!isCurrent && isUpgrade && !isScale && (
                <span className="mb-2 inline-flex self-start rounded bg-bronze px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  {t("org.billing.recommendedBadge", loc)}
                </span>
              )}

              <p className="font-fraunces text-lg text-ink">{plan.name}</p>

              {!isScale ? (
                <p className="mt-1 font-fraunces text-2xl text-ink">
                  €{price}
                  <span className="ml-1 text-sm font-normal text-muted">
                    {t("org.billing.perMonth", loc)}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted">
                  {locale === "hu" ? "Egyedi árazás" : "Custom pricing"}
                </p>
              )}

              <p className="mt-1 text-xs text-muted">{plan.seats}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-body">{plan.description}</p>

              {/* Action button */}
              <div className="mt-auto pt-3">
                {isCurrent ? (
                  <span className="block min-h-[40px] rounded-lg bg-sage-soft py-2.5 text-center text-xs font-semibold text-sage">
                    {t("org.billing.currentBadge", loc)}
                  </span>
                ) : isScale ? (
                  <a
                    href="mailto:hello@trita.app"
                    className="block min-h-[40px] rounded-lg border border-sand py-2.5 text-center text-xs font-semibold text-muted transition hover:border-bronze hover:text-bronze"
                  >
                    {t("org.billing.contactSales", loc)}
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => handlePlanAction(plan)}
                    className={[
                      "w-full min-h-[40px] rounded-lg py-2.5 text-xs font-semibold transition",
                      isUpgrade
                        ? "bg-sage text-white hover:bg-sage-dark disabled:opacity-50"
                        : "border border-sand text-muted hover:border-sage hover:text-ink disabled:opacity-50",
                    ].join(" ")}
                  >
                    {!hasSubscription
                      ? t("org.billing.activateBtn", loc)
                      : isUpgrade
                      ? t("org.billing.upgradeBtn", loc)
                      : t("org.billing.changePlanBtn", loc)}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isAdmin && (
        <p className="mt-4 text-xs text-muted">
          {t("org.billing.readOnly", loc)}
        </p>
      )}

      {/* Upgrade modal */}
      {upgradeTarget && (
        <PlanUpgradeModal
          currentPlanName={currentPlanLabel}
          targetPlanName={upgradeTarget.planName}
          targetPriceKey={upgradeTarget.priceKey}
          locale={locale}
          onClose={() => setUpgradeTarget(null)}
        />
      )}
    </div>
  );
}
