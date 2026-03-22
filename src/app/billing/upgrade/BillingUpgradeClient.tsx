"use client";
import { useState } from "react";
import Link from "next/link";

type Props = {
  isAdmin: boolean;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  alreadySetup?: boolean;
};

export function BillingUpgradeClient({ isAdmin, subscriptionStatus, trialEndsAt, alreadySetup }: Props) {
  const [loading, setLoading] = useState(false);

  const isExpiredTrial =
    subscriptionStatus === "trialing" &&
    trialEndsAt &&
    new Date(trialEndsAt) < new Date();

  const isPastDue = subscriptionStatus === "past_due";
  const isCanceled = subscriptionStatus === "canceled";
  const isActiveOrSetup = subscriptionStatus === "active" || (subscriptionStatus === "trialing" && alreadySetup && !isExpiredTrial);

  const handleCheckout = (priceKey: string) => {
    window.location.href = `/billing/checkout?plan=${priceKey}`;
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#faf9f6] px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#c8410a]">
            // előfizetés
          </p>
          <h1 className="mt-2 font-playfair text-3xl text-[#1a1814]">
            {isActiveOrSetup
              ? "Előfizetés aktív"
              : isExpiredTrial
              ? "A trial lejárt"
              : isPastDue
              ? "Fizetési probléma"
              : isCanceled
              ? "Előfizetés megszűnt"
              : "Aktiváld az előfizetést"}
          </h1>
          <p className="mt-3 text-sm text-[#5a5650]">
            {isActiveOrSetup
              ? "A fizetési módod el van mentve. A trial időszak végén automatikusan számlázunk."
              : isExpiredTrial
              ? "A 14 napos próbaidőszakod lejárt. Aktiváld az előfizetést a hozzáférés folytatásához."
              : isPastDue
              ? "Az utolsó fizetési kísérlet sikertelen volt. Frissítsd a fizetési adatokat."
              : isCanceled
              ? "Az előfizetésed megszűnt. Bármikor újraaktiválhatod."
              : "Válassz csomagot az előfizetés megkezdéséhez."}
          </p>
        </div>

        {!isAdmin ? (
          <div className="rounded-xl border border-[#e0ddd6] bg-white p-6 text-center">
            <p className="text-sm text-[#5a5650]">
              Az előfizetés kezeléséhez adminisztrátori jogosultság szükséges.
              Kérj meg egy adminisztrátort, hogy aktiválja az előfizetést.
            </p>
          </div>
        ) : isActiveOrSetup ? (
          <div className="rounded-xl border border-[#1a5c3a]/20 bg-[#f0fdf4] p-6 text-center">
            <p className="text-sm text-[#1a5c3a] font-medium mb-4">
              Minden rendben — a számlázás be van állítva.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/profile/results"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#c8410a] px-6 text-sm font-semibold text-white hover:bg-[#a33408]"
              >
                Vissza a dashboardra →
              </Link>
              <button
                onClick={async () => {
                  setLoading(true);
                  const res = await fetch("/api/billing/portal", { method: "POST" });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                  setLoading(false);
                }}
                disabled={loading}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#e0ddd6] bg-white px-6 text-sm font-semibold text-[#3d3a35] hover:border-[#c8410a] hover:text-[#c8410a] disabled:opacity-60"
              >
                {loading ? "Betöltés..." : "Számlázás kezelése"}
              </button>
            </div>
          </div>
        ) : isPastDue || isCanceled ? (
          <div className="rounded-xl border border-[#e0ddd6] bg-white p-6 text-center">
            <button
              onClick={async () => {
                setLoading(true);
                const res = await fetch("/api/billing/portal", { method: "POST" });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
                setLoading(false);
              }}
              disabled={loading}
              className="inline-flex min-h-[48px] items-center rounded-lg bg-[#c8410a] px-8 text-sm font-semibold text-white hover:bg-[#a33408] disabled:opacity-60"
            >
              {loading ? "Betöltés..." : "Számlázás kezelése →"}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {[
              {
                key: "team_annual",
                name: "Team",
                price: "€49",
                cadence: "/ hó (éves)",
                desc: "10 seatig, éves számlázás",
              },
              {
                key: "org_annual",
                name: "Org",
                price: "€99",
                cadence: "/ hó (éves)",
                desc: "Korlátlan seat, csapatjelentések",
                badge: "Ajánlott",
              },
            ].map((plan) => (
              <div
                key={plan.key}
                className={`relative rounded-xl border p-5 ${
                  plan.badge ? "border-[#c8410a] bg-[#fef3ec]" : "border-[#e0ddd6] bg-white"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-5 rounded-full bg-[#c8410a] px-3 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#1a1814]">{plan.name}</p>
                    <p className="text-xs text-[#7a756e]">{plan.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-playfair text-2xl text-[#1a1814]">{plan.price}</span>
                    <span className="ml-1 text-xs text-[#7a756e]">{plan.cadence}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCheckout(plan.key)}
                  className="mt-4 w-full min-h-[44px] rounded-lg bg-[#c8410a] text-sm font-semibold text-white hover:bg-[#a33408]"
                >
                  Fizetés →
                </button>
              </div>
            ))}
            <Link
              href="/pricing"
              className="block text-center text-sm text-[#7a756e] hover:text-[#1a1814]"
            >
              Részletes összehasonlítás →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
