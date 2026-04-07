"use client";

import { useCallback, useEffect, useState } from "react";
import { TritaCheckoutForm } from "@/components/billing/TritaCheckoutForm";

interface CheckoutState {
  clientSecret: string;
  mode: "payment" | "subscription" | "trial";
  returnUrl: string;
  amount?: number;
  currency?: string;
  productName?: string;
  trialEnd?: string | null;
  subscriptionId?: string;
}

interface Props {
  priceKey?: string;
  quantity?: number;
  tier?: string;
  teamId?: string;
  locale: string;
}

export function EmbeddedCheckoutClient({ priceKey, quantity, tier, teamId, locale }: Props) {
  const [state, setState] = useState<CheckoutState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isHu = locale !== "en";

  useEffect(() => {
    async function init() {
      try {
        const body: Record<string, unknown> = {};
        if (tier) body.tier = tier;
        if (teamId) body.teamId = teamId;
        if (priceKey) {
          if (priceKey.startsWith("candidate_")) {
            body.candidatePack = priceKey;
          } else {
            body.plan = priceKey;
          }
        }
        if (quantity && quantity > 1) body.quantity = quantity;

        const res = await fetch("/api/billing/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const code = data.error ?? "CHECKOUT_FAILED";
          const msg = code === "PRICE_NOT_CONFIGURED"
            ? (isHu ? "Ez a csomag jelenleg nem elérhető. Kérjük, vedd fel a kapcsolatot." : "This plan is not yet available. Please contact us.")
            : code === "FORBIDDEN"
            ? (isHu ? "Ehhez a művelethez admin jogosultság szükséges." : "Admin access required for this action.")
            : (isHu ? "Nem sikerült a fizetési folyamat elindítása." : "Failed to initialize checkout.");
          throw new Error(msg);
        }

        const data = await res.json();
        console.log("[TritaCheckout] API response:", { mode: data.mode, hasClientSecret: !!data.clientSecret, amount: data.amount });
        setState(data);
      } catch (err) {
        console.error("[TritaCheckout] Init error:", err);
        setError(
          err instanceof Error && err.message !== "CHECKOUT_FAILED"
            ? err.message
            : (isHu
              ? "Nem sikerült a fizetési folyamat elindítása. Próbáld újra."
              : "Failed to initialize checkout. Please try again."),
        );
      }
      setLoading(false);
    }
    init();
  }, [tier, teamId, priceKey, quantity, isHu]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-sand bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-sand border-t-sage" />
          <p className="text-sm text-muted">
            {isHu ? "Fizetési felület betöltése..." : "Loading checkout..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
        <p className="text-sm text-rose-700">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 min-h-[44px] rounded-lg border border-rose-200 bg-white px-6 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          {isHu ? "Újrapróbálás" : "Try again"}
        </button>
      </div>
    );
  }

  // Trial mode — no payment needed now
  if (state?.mode === "trial") {
    const trialEndDate = state.trialEnd
      ? new Date(state.trialEnd).toLocaleDateString(isHu ? "hu-HU" : "en-GB")
      : null;

    return (
      <div className="rounded-2xl border border-sage/20 bg-sage-soft p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage/10">
          <span className="text-2xl text-sage">✓</span>
        </div>
        <h2 className="font-fraunces text-xl text-ink">
          {isHu ? "Előfizetés aktiválva!" : "Subscription activated!"}
        </h2>
        <p className="mt-2 text-sm text-ink-body">
          {isHu
            ? `${TRIAL_DAYS} napos próbaidőszak elindult. Az első fizetés ${trialEndDate ?? "a próbaidőszak végén"} esedékes.`
            : `Your ${TRIAL_DAYS}-day trial has started. First payment due ${trialEndDate ?? "at end of trial"}.`}
        </p>
        <a
          href={state.returnUrl}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-sage px-6 text-sm font-semibold text-white transition hover:bg-sage-dark"
        >
          {isHu ? "Tovább →" : "Continue →"}
        </a>
      </div>
    );
  }

  // Payment / subscription mode — show form
  if (!state?.clientSecret) {
    return (
      <div className="rounded-2xl border border-sand bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-muted">
          {isHu ? "Nem sikerült a fizetés inicializálása." : "Failed to initialize payment."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
      <TritaCheckoutForm
        clientSecret={state.clientSecret}
        returnUrl={state.returnUrl}
        mode={state.mode === "subscription" ? "subscription" : "payment"}
        locale={locale}
      />
    </div>
  );
}

const TRIAL_DAYS = 14;
