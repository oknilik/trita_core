"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface Team {
  id: string;
  name: string;
}

interface OrgProductCardsProps {
  teams: Team[];
  locale: string;
  isAdmin: boolean;
}

function ProductCard({
  name,
  description,
  price,
  locale,
  isAdmin,
  onPurchase,
  loading,
  children,
}: {
  name: string;
  description: string;
  price: string;
  locale: string;
  isAdmin: boolean;
  onPurchase: () => void;
  loading: boolean;
  children?: React.ReactNode;
}) {
  const loc = locale as Locale;
  return (
    <div className="flex flex-col rounded-xl border border-sand bg-white p-4 transition hover:border-sage/40">
      <p className="font-semibold text-ink">{name}</p>
      <p className="mt-1 text-[11px] text-muted">{description}</p>
      <p className="mt-2 font-fraunces text-lg text-ink">{price}</p>
      {children}
      <button
        type="button"
        onClick={onPurchase}
        disabled={!isAdmin || loading}
        className="mt-3 min-h-[40px] w-full rounded-lg bg-sage text-xs font-semibold text-white transition hover:bg-sage-dark disabled:opacity-50"
      >
        {loading ? "..." : t("org.billing.buyBtn", loc)}
      </button>
    </div>
  );
}

export function OrgProductCards({
  teams,
  locale,
  isAdmin,
}: OrgProductCardsProps) {
  const loc = locale as Locale;
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id ?? "");
  const [candidateQuantity, setCandidateQuantity] = useState<number>(5);

  const candidateAmountCents = Math.round(
    3900 * (candidateQuantity >= 10 ? 0.8 : candidateQuantity >= 5 ? 0.85 : 1),
  ) * candidateQuantity;
  const candidatePrice = new Intl.NumberFormat(locale === "hu" ? "hu-HU" : "en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(candidateAmountCents / 100);

  function handleOneTimePurchase(tier: string) {
    if (!isAdmin) return;
    setLoading(tier);
    const params = new URLSearchParams({ tier });
    if (selectedTeamId) params.set("teamId", selectedTeamId);
    router.push(`/billing/checkout?${params.toString()}`);
  }

  function handleCandidatePurchase() {
    if (!isAdmin) return;
    setLoading("candidate");
    router.push(`/billing/checkout?plan=candidate_custom&qty=${candidateQuantity}`);
  }

  const teamSelector = teams.length > 0 ? (
    <div className="mt-2">
      <label className="text-[10px] text-muted">
        {t("org.billing.selectTeam", loc)}
      </label>
      <select
        value={selectedTeamId}
        onChange={(e) => setSelectedTeamId(e.target.value)}
        className="mt-1 w-full rounded-md border border-sand bg-cream px-2.5 py-1.5 text-xs text-ink"
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>{team.name}</option>
        ))}
      </select>
    </div>
  ) : null;

  return (
    <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-bronze">
        {t("org.billing.productsEyebrow", loc)}
      </p>
      <h2 className="mt-1 font-fraunces text-xl text-ink">
        {t("org.billing.productsTitle", loc)}
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Team Snapshot */}
        <ProductCard
          name={t("org.billing.teamSnapshotName", loc)}
          description={t("org.billing.teamSnapshotDesc", loc)}
          price="€99"
          locale={locale}
          isAdmin={isAdmin}
          onPurchase={() => handleOneTimePurchase("team_snapshot")}
          loading={loading === "team_snapshot"}
        >
          {teamSelector}
        </ProductCard>

        {/* Team Deep Dive */}
        <ProductCard
          name={t("org.billing.teamDeepDiveName", loc)}
          description={t("org.billing.teamDeepDiveDesc", loc)}
          price="€990"
          locale={locale}
          isAdmin={isAdmin}
          onPurchase={() => handleOneTimePurchase("team_deep_dive")}
          loading={loading === "team_deep_dive"}
        >
          {teamSelector}
        </ProductCard>

        {/* Candidate credits */}
        <ProductCard
          name={t("org.billing.candidatePackName", loc)}
          description={t("org.billing.candidatePackDesc", loc)}
          price={candidatePrice}
          locale={locale}
          isAdmin={isAdmin}
          onPurchase={handleCandidatePurchase}
          loading={loading === "candidate"}
        >
          <div className="mt-2">
            <label className="text-[10px] text-muted">
              {t("org.billing.candidatePackName", loc)}: {candidateQuantity}
            </label>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={candidateQuantity}
              onChange={(event) => setCandidateQuantity(Number.parseInt(event.target.value, 10))}
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-sand accent-sage"
            />
            <p className="mt-2 text-[10px] text-muted">
              {candidateQuantity >= 10
                ? "-20%"
                : candidateQuantity >= 5
                ? "-15%"
                : t("org.billing.candidatePackDesc", loc)}
            </p>
          </div>
        </ProductCard>
      </div>

      {!isAdmin && (
        <p className="mt-4 text-xs text-muted">
          {t("org.billing.readOnly", loc)}
        </p>
      )}
    </div>
  );
}
