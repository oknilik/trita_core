"use client";

import { useRef } from "react";
import { OrgCurrentPlanCard, type SerializedSubscription } from "./OrgCurrentPlanCard";
import { OrgPlanComparison } from "./OrgPlanComparison";
import { OrgProductCards } from "./OrgProductCards";
import { OrgInvoiceList } from "./OrgInvoiceList";

interface OrgBillingTabProps {
  orgId: string;
  subscription: SerializedSubscription | null;
  memberCount: number;
  seatLimit: number;
  teams: Array<{ id: string; name: string }>;
  locale: string;
  isAdmin: boolean;
}

export function OrgBillingTab({
  orgId,
  subscription,
  memberCount,
  seatLimit,
  teams,
  locale,
  isAdmin,
}: OrgBillingTabProps) {
  const plansRef = useRef<HTMLDivElement>(null);

  function scrollToPlans() {
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Current plan */}
      <OrgCurrentPlanCard
        subscription={subscription}
        memberCount={memberCount}
        seatLimit={seatLimit}
        locale={locale}
        isAdmin={isAdmin}
        onScrollToPlans={scrollToPlans}
      />

      {/* Plan comparison */}
      <div ref={plansRef}>
        <OrgPlanComparison
          currentPlanType={subscription?.planType ?? null}
          currentInterval={subscription?.billingInterval ?? null}
          hasSubscription={!!subscription?.stripeSubscriptionId}
          orgId={orgId}
          locale={locale}
          isAdmin={isAdmin}
        />
      </div>

      {/* One-time products */}
      <OrgProductCards
        teams={teams}
        locale={locale}
        isAdmin={isAdmin}
      />

      {/* Invoices */}
      <OrgInvoiceList
        orgId={orgId}
        locale={locale}
      />
    </div>
  );
}
