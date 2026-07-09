"use client";

import { useState } from "react";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export interface SerializedSubscription {
  status: string;
  planType: string | null;
  billingInterval: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  candidateCredits: number;
  stripePriceId: string | null;
  stripeSubscriptionId: string | null;
}

interface OrgCurrentPlanCardProps {
  subscription: SerializedSubscription | null;
  memberCount: number;
  seatLimit: number;
  locale: string;
  isAdmin: boolean;
  onScrollToPlans?: () => void;
}

function StatusBadge({ status, locale }: { status: string; locale: string }) {
  const loc = locale as Locale;
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "bg-[rgba(26,92,58,0.08)]", text: "text-sage", label: t("org.billing.statusActive", loc) },
    trialing: { bg: "bg-[rgba(200,65,10,0.08)]", text: "text-bronze", label: t("org.billing.statusTrialing", loc) },
    past_due: { bg: "bg-[rgba(220,60,60,0.08)]", text: "text-rose-600", label: t("org.billing.statusPastDue", loc) },
    canceled: { bg: "bg-sand", text: "text-muted", label: t("org.billing.statusCanceled", loc) },
    none: { bg: "bg-sand", text: "text-muted", label: t("org.billing.statusNone", loc) },
  };
  const c = config[status] ?? config.none!;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

export function OrgCurrentPlanCard({
  subscription,
  memberCount,
  seatLimit,
  locale,
  isAdmin,
  onScrollToPlans,
}: OrgCurrentPlanCardProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const loc = locale as Locale;
  const sub = subscription;
  const status = sub?.status ?? "none";
  const planType = sub?.planType ?? "none";
  const interval = sub?.billingInterval;
  const hasSubscription = !!sub?.stripeSubscriptionId;

  const planLabel =
    planType === "team" ? t("org.billing.planTeam", loc) :
    planType === "org" ? t("org.billing.planOrg", loc) :
    planType === "scale" ? t("org.billing.planScale", loc) :
    t("org.billing.planNone", loc);

  const intervalLabel = interval === "annual"
    ? t("org.billing.intervalAnnual", loc)
    : interval === "monthly"
    ? t("org.billing.intervalMonthly", loc)
    : null;

  const nextBillingDate = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString(locale === "en" ? "en-GB" : "hu-HU")
    : null;

  const trialDaysLeft = sub?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  const seatPct = seatLimit > 0 && seatLimit !== Infinity
    ? Math.min(100, Math.round((memberCount / seatLimit) * 100))
    : 0;

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-bronze">
        {t("org.billing.currentPlanEyebrow", loc)}
      </p>
      <h2 className="mt-1 font-fraunces text-xl text-ink">
        {t("org.billing.currentPlanTitle", loc)}
      </h2>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Plan info */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-fraunces text-2xl text-ink">{planLabel}</span>
            <StatusBadge status={status} locale={locale} />
          </div>

          {intervalLabel && (
            <p className="text-xs text-muted">{intervalLabel}</p>
          )}

          {status === "trialing" && trialDaysLeft !== null && (
            <p className="text-xs text-bronze">
              {tf("org.billing.trialDays", loc, { days: trialDaysLeft })}
            </p>
          )}

          {nextBillingDate && (status === "active" || status === "trialing") && (
            <p className="text-xs text-muted">
              {t("org.billing.nextBilling", loc)}: {nextBillingDate}
            </p>
          )}

          {sub?.cancelAtPeriodEnd && (
            <p className="text-xs text-rose-600">
              {locale === "hu"
                ? "A periódus végén megszűnik"
                : "Cancels at end of period"}
            </p>
          )}
        </div>

        {/* Actions */}
        {isAdmin && (
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            {hasSubscription && (
              <button
                type="button"
                onClick={handlePortal}
                disabled={portalLoading}
                className="inline-flex min-h-[40px] items-center rounded-lg border border-sand bg-white px-4 text-xs font-semibold text-ink-body transition hover:border-sage hover:text-bronze disabled:opacity-60"
              >
                {portalLoading ? "..." : t("org.billing.manageBtn", loc)}
              </button>
            )}
            <button
              type="button"
              onClick={onScrollToPlans}
              className="inline-flex min-h-[40px] items-center rounded-lg bg-sage px-4 text-xs font-semibold text-white transition hover:bg-sage-dark"
            >
              {hasSubscription
                ? t("org.billing.changePlanBtn", loc)
                : t("org.billing.activateBtn", loc)} →
            </button>
          </div>
        )}
      </div>

      {/* Seat usage */}
      {seatLimit > 0 && seatLimit !== Infinity && (
        <div className="mt-5 border-t border-sand pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">
              {tf("org.billing.seatsUsed", loc, { used: memberCount, total: seatLimit })}
            </span>
            <span className="font-semibold text-ink">{seatPct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sand">
            <div
              className={`h-full rounded-full transition-all ${
                seatPct >= 90 ? "bg-bronze" : "bg-sage"
              }`}
              style={{ width: `${seatPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
