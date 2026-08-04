"use client";

import { useState, useEffect } from "react";
import { PATTERN_NAMES } from "@/lib/team-pattern";
import { t, tf, type Locale } from "@/lib/i18n";

// Tier mapping from getPlanTier() in src/lib/subscription.ts:
//   nincs / lejárt → "none" · próbaidő → "trial" · aktív → "advisory"
export type AdvisoryTier = "trial" | "advisory" | "none";

interface TeamInfo {
  id: string;
  name: string;
  memberCount: number;
}

interface TeamPatternSummary {
  teamId: string;
  patternCode: string;
  patternName: string;
  diversitySuffix: string;
}

interface Props {
  userName: string;
  orgName: string;
  tier: AdvisoryTier;
  isHu: boolean;
  teams: TeamInfo[];
}

export function AdvisoryPageClient({ userName, orgName, tier, isHu, teams }: Props) {
  const [patterns, setPatterns] = useState<TeamPatternSummary[]>([]);
  const [loadingPatterns, setLoadingPatterns] = useState(teams.length > 0);
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const locale: Locale = isHu ? "hu" : "en";
  const firstName = userName.split(/[\s@]/)[0] ?? userName;

  const isAdvisory = tier === "advisory";
  const isUpgrade = tier === "trial" || tier === "none";

  useEffect(() => {
    if (teams.length === 0) {
      setLoadingPatterns(false);
      return;
    }
    Promise.all(
      teams.map((tm) =>
        fetch(`/api/team/${tm.id}/pattern`)
          .then((r) => r.json())
          .then((data) => {
            const pr = data.patternResult;
            if (!pr) return null;
            return {
              teamId: tm.id,
              patternCode: pr.patternCode,
              patternName: pr.patternName,
              diversitySuffix: pr.diversitySuffix,
            } as TeamPatternSummary;
          })
          .catch(() => null)
      )
    ).then((results) => {
      setPatterns(results.filter(Boolean) as TeamPatternSummary[]);
      setLoadingPatterns(false);
    });
  }, [teams]);

  const handleRequestConsultation = async () => {
    setRequestLoading(true);
    try {
      const res = await fetch("/api/advisory/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teams: patterns.map((p) => ({
            name: teams.find((tm) => tm.id === p.teamId)?.name ?? "",
            pattern: p.patternName,
          })),
        }),
      });
      if (res.ok) setRequestSent(true);
    } finally {
      setRequestLoading(false);
    }
  };

  const firstPattern = patterns[0];
  const secondPattern = patterns[1];
  const firstContent = firstPattern ? PATTERN_NAMES[firstPattern.patternCode] : null;

  const steps = [
    { n: "1", title: t("advisory.step1Title", locale), body: t("advisory.step1Body", locale) },
    { n: "2", title: t("advisory.step2Title", locale), body: t("advisory.step2Body", locale) },
    { n: "3", title: t("advisory.step3Title", locale), body: t("advisory.step3Body", locale) },
  ];

  const upgradeFeatures = [
    t("advisory.upgradeFeature1", locale),
    t("advisory.upgradeFeature2", locale),
    t("advisory.upgradeFeature3", locale),
    t("advisory.upgradeFeature4", locale),
    t("advisory.upgradeFeature5", locale),
    t("advisory.upgradeFeature6", locale),
  ];

  const faqItems = [
    [t("advisory.faqQ1", locale), t("advisory.faqA1", locale)],
    [t("advisory.faqQ2", locale), t("advisory.faqA2", locale)],
    [t("advisory.faqQ3", locale), t("advisory.faqA3", locale)],
    [t("advisory.faqQ4", locale), t("advisory.faqA4", locale)],
    [t("advisory.faqQ5", locale), t("advisory.faqA5", locale)],
    [t("advisory.faqQ6", locale), t("advisory.faqA6", locale)],
  ];

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-bronze">
          {"// "}{t("advisory.eyebrow", locale)}
        </p>
        <h1 className="mt-1 font-fraunces text-3xl text-ink md:text-4xl">
          {isAdvisory
            ? `${firstName}${t("advisory.headingAdvisory", locale)}`
            : t("advisory.headingUpgrade", locale)}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-body">
          {isAdvisory
            ? t("advisory.subtitleAdvisory", locale)
            : t("advisory.subtitleUpgrade", locale)}
        </p>
      </div>

      {/* ── A te csapataid most ────────────────────────────── */}
      {!loadingPatterns && patterns.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 font-fraunces text-xl text-ink">
            {t("advisory.teamsNow", locale)}
          </h2>
          <div className="flex flex-col gap-3">
            {patterns.map((p) => {
              const team = teams.find((tm) => tm.id === p.teamId);
              return (
                <div
                  key={p.teamId}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-sand bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-ink">{team?.name}</p>
                    <p className="mt-0.5 text-sm text-ink-body">
                      {p.patternName}
                      {p.diversitySuffix ? ` — ${p.diversitySuffix}` : ""}
                      <span className="mx-2 text-sand">·</span>
                      {team?.memberCount} {t("advisory.members", locale)}
                    </p>
                  </div>
                  <a
                    href={`/team/${p.teamId}`}
                    className="shrink-0 text-sm font-semibold text-bronze transition-colors hover:text-bronze-dark"
                  >
                    {t("advisory.details", locale)}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mit kapsz a konzultáción ──────────────────────── */}
      <div className="mb-10">
        <h2 className="mb-2 font-fraunces text-xl text-ink">
          {t("advisory.whatYouGet", locale)}
        </h2>
        <p className="mb-6 text-sm text-ink-body">
          {t("advisory.whatYouGetSubtitle", locale)}
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ConsultationFeature
            number="01"
            title={t("advisory.feature1Title", locale)}
            description={t("advisory.feature1Desc", locale)}
            example={
              secondPattern
                ? tf("advisory.feature1ExampleTwo", locale, {
                    first: firstPattern!.patternName,
                    second: secondPattern.patternName,
                  })
                : firstPattern
                ? tf("advisory.feature1ExampleOne", locale, {
                    pattern: firstPattern.patternName,
                  })
                : undefined
            }
          />
          <ConsultationFeature
            number="02"
            title={t("advisory.feature2Title", locale)}
            description={t("advisory.feature2Desc", locale)}
            example={t("advisory.feature2Example", locale)}
          />
          <ConsultationFeature
            number="03"
            title={t("advisory.feature3Title", locale)}
            description={t("advisory.feature3Desc", locale)}
            example={
              firstContent?.leaderActions?.[0]
                ? `${t("advisory.feature3ExamplePrefix", locale)}: \u201E${firstContent.leaderActions[0]}\u201D`
                : undefined
            }
          />
          <ConsultationFeature
            number="04"
            title={t("advisory.feature4Title", locale)}
            description={t("advisory.feature4Desc", locale)}
          />
        </div>
      </div>

      {/* ── Hogyan működik a negyedéves konzultáció ──────── */}
      <div className="mb-10 rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-6 font-fraunces text-xl text-ink">
          {t("advisory.howItWorks", locale)}
        </h2>

        {/* 3 fázis */}
        <div className="mb-8 space-y-6">
          {steps.map(({ n, title, body }) => (
            <div key={n} className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage/10 font-fraunces text-sm font-medium text-bronze">
                {n}
              </span>
              <div>
                <p className="mb-1 text-sm font-semibold text-ink">{title}</p>
                <p className="text-sm text-ink-body">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add-on */}
        <div className="border-t border-sand pt-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-ink">
                {t("advisory.deepDiveTitle", locale)}
              </p>
              <p className="text-xs text-muted">
                {t("advisory.deepDiveDesc", locale)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-ink">
              {t("advisory.deepDivePrice", locale)}
            </span>
          </div>
        </div>
      </div>

      {/* ── CTA — tanácsadói konzultáció ──────────────────── */}
      {isAdvisory && !requestSent && (
        <div className="mb-10 rounded-2xl border border-sage/20 bg-white p-8 text-center shadow-sm">
          <p className="mb-2 font-mono text-micro uppercase tracking-widest text-bronze">
            {"// "}{t("advisory.ctaAdvisoryEyebrow", locale)}
          </p>
          <h2 className="mb-3 font-fraunces text-2xl text-ink">
            {t("advisory.ctaAdvisoryHeading", locale)}
          </h2>
          <p className="mx-auto mb-6 max-w-lg text-sm text-ink-body">
            {t("advisory.ctaAdvisoryBody", locale)}
          </p>
          <button
            onClick={handleRequestConsultation}
            disabled={requestLoading}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-8 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {requestLoading
              ? t("advisory.sending", locale)
              : t("advisory.requestConsultation", locale)}
          </button>
        </div>
      )}

      {isAdvisory && requestSent && (
        <div className="mb-10 rounded-2xl border border-sand bg-white p-8 text-center shadow-sm">
          <p className="mb-3 font-fraunces text-3xl text-bronze">✦</p>
          <h2 className="mb-2 font-fraunces text-2xl text-ink">
            {t("advisory.requestReceived", locale)}
          </h2>
          <p className="text-sm text-ink-body">
            {t("advisory.requestFollowUp", locale)}
          </p>
        </div>
      )}

      {/* ── CTA — upgrade ────────────────────────────────── */}
      {isUpgrade && (
        <div className="mb-10 rounded-2xl border-2 border-sage/20 bg-white p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-1 font-mono text-micro uppercase tracking-widest text-bronze">
                {"// advisory"}
              </p>
              <h2 className="mb-3 font-fraunces text-2xl text-ink">
                Trita Advisory
              </h2>
              <p className="mb-5 text-sm leading-relaxed text-ink-body">
                {t("advisory.upgradeDesc", locale)}
              </p>
              <ul className="mb-6 space-y-2 text-sm text-ink-body">
                {upgradeFeatures.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="shrink-0 text-bronze">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mb-4 flex items-baseline gap-2">
                <span className="font-fraunces text-2xl text-ink">
                  {t("advisory.pricePerMonth", locale)}
                </span>
              </div>
              {tier === "trial" && (
                <p className="mb-4 text-xs font-semibold text-bronze">
                  {t("advisory.foundingCustomer", locale)}
                </p>
              )}
              <a
                href="/contact"
                className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-8 text-sm font-semibold text-white transition hover:bg-sage-dark"
              >
                {t("advisory.upgradeButton", locale)}
              </a>
            </div>
            <div className="hidden md:block">
              <div className="rounded-xl border border-sand bg-cream p-6 text-center">
                <p className="text-sm italic leading-relaxed text-ink-body">
                  {t("advisory.testimonial", locale)}
                </p>
                <p className="mt-3 text-xs text-muted">
                  {t("advisory.testimonialAuthor", locale)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FAQ ──────────────────────────────────────────── */}
      <div className="mt-4 border-t border-sand pt-10">
        <h2 className="mb-6 font-fraunces text-xl text-ink">
          {t("advisory.faqTitle", locale)}
        </h2>
        <div className="space-y-3">
          {faqItems.map(([q, a]) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function ConsultationFeature({
  number,
  title,
  description,
  example,
}: {
  number: string;
  title: string;
  description: string;
  example?: string;
}) {
  return (
    <div className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-sm text-bronze/50">{number}</span>
        <h3 className="font-semibold text-ink">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-ink-body">{description}</p>
      {example && (
        <p className="mt-3 text-xs italic text-bronze/70">{example}</p>
      )}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-sand bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-semibold text-ink transition-colors hover:text-bronze">
        <span className="shrink-0 font-mono text-bronze/50 transition-transform group-open:rotate-90">
          ›
        </span>
        {q}
      </summary>
      <p className="px-5 pb-4 text-sm leading-relaxed text-ink-body">{a}</p>
    </details>
  );
}
