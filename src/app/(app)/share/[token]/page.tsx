import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import type { ScoreResult } from "@/lib/scoring";
import type { TestType } from "@prisma/client";
import { getDimensionTier, getDimensionLabel } from "@/lib/dimension-utils";
import { estimateTeamRolesFromTritan } from "@/lib/team-role-estimate";
import { resolvePersonalityTypeFromScores } from "@/lib/personality-type";
import { TEAM_ROLES, getTopRoles } from "@/lib/team-role-scoring";
import { buildWorkstyleContent } from "@/lib/workstyle-content";
import { HowYouWorkSection } from "@/components/results/HowYouWorkSection";
import { IdealEnvironmentSection } from "@/components/results/IdealEnvironmentSection";
import { RoleFitSection } from "@/components/results/RoleFitSection";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Megosztott profil | trita",
  robots: { index: false },
};

function getInsight(
  score: number,
  insights: { low: string; mid: string; high: string },
): string {
  const range = score < 40 ? "low" : score < 70 ? "mid" : "high";
  return insights[range];
}

export default async function SharedProfilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getServerLocale();
  const isHu = locale === "hu";
  const { userId } = await auth();

  const result = await prisma.assessmentResult.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      scores: true,
      testType: true,
      createdAt: true,
      userProfile: {
        select: { username: true },
      },
    },
  });

  // Visszavont vagy érvénytelen link: nem 404, hanem barátságos állapot-oldal
  // — magyarázat + CTA a saját kitöltésre vagy bejelentkezésre.
  if (!result) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-cream px-4">
        <div className="w-full max-w-md rounded-2xl border border-sand bg-white p-8 text-center md:p-10">
          <SectionEyebrow variant="clean" tone="muted" className="mb-3">
            {t("content.shareExpiredEyebrow", locale)}
          </SectionEyebrow>
          <h1 className="mb-3 font-fraunces text-[26px] tracking-tight text-ink">
            {t("content.shareExpiredTitle", locale)}
          </h1>
          <p className="mb-7 text-sm leading-relaxed text-ink-body">
            {t("content.shareExpiredDesc", locale)}
          </p>
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <Link href="/try" className={getButtonClassName({ variant: "primary" })}>
              {t("content.shareExpiredCtaTry", locale)}
            </Link>
            <Link href="/sign-in" className={getButtonClassName({ variant: "secondary" })}>
              {t("content.shareExpiredCtaSignIn", locale)}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const scores = result.scores as ScoreResult;
  if (scores.type !== "likert") notFound();

  const testType = result.testType as TestType;
  const config = getTestConfig(testType, locale);
  const displayName = result.userProfile?.username ?? t("common.userFallback", locale);

  const dimensions = config.dimensions
    .filter((d) => d.code !== "I")
    .map((dim) => {
      const score = scores.dimensions[dim.code] ?? 0;
      const insights = (dim.insightsByLocale?.[locale] ?? dim.insights) as {
        low: string; mid: string; high: string;
      };
      return {
        code: dim.code,
        label: (dim.labelByLocale?.[locale] ?? dim.label) as string,
        score,
        insight: getInsight(score, insights),
        description: (dim.descriptionByLocale?.[locale] ?? dim.description) as string,
      };
    });

  const formattedDate = result.createdAt.toLocaleDateString(
    isHu ? "hu-HU" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" },
  );

  // Személyiség-típus — a közös archetípus-nyelvtanból (personality-type.ts),
  // a korábban itt duplikált mechanikus címke-összefűzés helyett.
  const personalityType =
    resolvePersonalityTypeFromScores(
      dimensions.map((d) => ({ code: d.code, score: d.score })),
      isHu ? "hu" : "en",
    ) ?? "";

  // Munkastílus — ugyanabból a generátorból, mint a saját eredmény-oldal
  // workstyle tabja (lib/workstyle-content.ts), hogy a megosztott nézet
  // tartalma sose csússzon el a belső nézettől.
  const workstyle = buildWorkstyleContent(
    Object.fromEntries(dimensions.map((d) => [d.code, d.score])),
    testType,
    locale,
  );

  // TeamRole
  const hexScores = Object.fromEntries(dimensions.map((d) => [d.code, d.score]));
  const hasTeamRole = "INTE" in hexScores && "TEMP" in hexScores;
  const teamRoleTop3 = hasTeamRole
    ? getTopRoles(estimateTeamRolesFromTritan(hexScores as Record<"INTE" | "RESO" | "TEMP" | "ADAP" | "THOR" | "OPEN", number>), 3)
    : [];

  const rankLabels = [
    { hu: "Elsődleges", en: "Primary" },
    { hu: "Másodlagos", en: "Secondary" },
    { hu: "Harmadik", en: "Tertiary" },
  ];

  return (
    <main className="min-h-dvh bg-cream">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
        {/* Header */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ background: "linear-gradient(135deg, var(--color-accent-self-strong) 0%, var(--color-accent-self-deep) 60%, var(--color-accent-self-deeper) 100%)" }}
        >
          <div className="px-9 pb-7 pt-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full bg-white/[0.02]" />
            <p className="mb-1.5 text-micro uppercase tracking-widest text-white/[0.28]">
              {t("results.sharedProfileLabel", locale)}
            </p>
            <h1 className="mb-0.5 font-fraunces text-[28px] tracking-tight text-white">
              {displayName}
            </h1>
            <p className="mb-3 text-[11px] text-white/[0.25]">
              {t("results.heroAssessment", locale)} {formattedDate}
            </p>
            {personalityType && (
              <p className="font-fraunces text-[18px] italic text-[var(--color-accent-primary-soft)]">
                {personalityType}
              </p>
            )}
          </div>
        </div>

        {/* Dimension strip */}
        <div className="w-full overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-white">
          <div className="grid grid-cols-6">
            {dimensions.map((dim, i) => {
              const tier = getDimensionTier(dim.score);
              const tierColor = tier === "high" ? "var(--color-action-primary-bg)" : tier === "mid" ? "var(--color-accent-primary)" : "var(--color-text-muted)";
              const tierBg = tier === "high" ? "var(--color-surface-self-accent-soft)" : tier === "mid" ? "var(--color-surface-highlight-warm)" : "var(--color-surface-subtle)";
              return (
                <div
                  key={dim.code}
                  className={`px-2.5 py-4 text-center ${i < dimensions.length - 1 ? "border-r border-[var(--color-border-default)]" : ""}`}
                >
                  <p className="mb-1.5 text-micro text-[var(--color-text-muted)]">
                    {dim.label.length > 10 ? dim.label.slice(0, 10) + "." : dim.label}
                  </p>
                  <p className="mb-1.5 font-fraunces text-[22px] leading-none" style={{ color: tierColor }}>
                    {dim.score}
                  </p>
                  <span
                    className="inline-block rounded px-[7px] py-[2px] text-micro font-semibold"
                    style={{ backgroundColor: tierBg, color: tierColor }}
                  >
                    {getDimensionLabel(dim.score, locale)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dimension details */}
        <div className="flex flex-col gap-3">
          {dimensions.map((dim) => {
            const tier = getDimensionTier(dim.score);
            const tierColor = tier === "high" ? "var(--color-action-primary-bg)" : tier === "mid" ? "var(--color-accent-primary)" : "var(--color-text-muted)";
            const cardBg = tier === "high" ? "var(--color-surface-self-accent-soft)" : tier === "mid" ? "var(--color-surface-highlight-warm)" : "white";
            const borderColor = tier === "high" ? "rgba(61,107,94,0.22)" : tier === "mid" ? "rgba(193,127,74,0.18)" : "var(--color-border-default)";
            return (
              <div
                key={dim.code}
                className="rounded-xl p-4 px-[18px]"
                style={{ backgroundColor: cardBg, border: `1.5px solid ${borderColor}` }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tierColor }} />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{dim.label}</span>
                  </div>
                  <span className="font-fraunces text-base" style={{ color: tierColor }}>{dim.score}%</span>
                </div>
                <p className="text-caption font-medium leading-relaxed text-[var(--color-text-primary)]">{dim.insight}</p>
              </div>
            );
          })}
        </div>

        {/* Munkastílus */}
        <div className="flex flex-col">
          <HowYouWorkSection paragraphs={workstyle.howYouWork} isUnlocked={true} />
          <IdealEnvironmentSection items={workstyle.envItems} isUnlocked={true} />
          <RoleFitSection
            strongFit={workstyle.roleFit.strong}
            mightWork={workstyle.roleFit.might}
            needsPrep={workstyle.roleFit.prep}
            strongRoles={workstyle.roleFit.strongRoles}
            mightRoles={workstyle.roleFit.mightRoles}
            prepRoles={workstyle.roleFit.prepRoles}
            isUnlocked={true}
          />
        </div>

        {/* TeamRole */}
        {teamRoleTop3.length > 0 && (
          <div>
            <p className="mb-1.5 text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
              {t("results.teamRoleHeading", locale)}
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.4fr_1fr_1fr]">
              {teamRoleTop3.map(({ role, score }, idx) => {
                const roleMeta = TEAM_ROLES[role];
                const isPrimary = idx === 0;
                return (
                  <div
                    key={role}
                    className={`flex flex-col rounded-xl ${
                      isPrimary
                        ? "border-2 border-[var(--color-action-primary-bg)] bg-[var(--color-surface-self-accent-soft)] p-[22px]"
                        : "border-[1.5px] border-[var(--color-border-default)] bg-white p-[18px]"
                    }`}
                  >
                    <span
                      className={`mb-2 self-start rounded px-[9px] py-[3px] text-micro font-bold uppercase tracking-wide ${
                        isPrimary
                          ? "bg-[var(--color-action-primary-bg)] text-white"
                          : idx === 1
                            ? "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]"
                            : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]"
                      }`}
                    >
                      {rankLabels[idx][locale]} · {score}%
                    </span>
                    <p className={`font-fraunces text-[var(--color-text-primary)] ${isPrimary ? "text-[19px]" : "text-[17px]"}`}>
                      {roleMeta[locale]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer CTA — csak kijelentkezett látogatónak (bejelentkezett
            usernek nincs értelme a "készíts profilt" felhívásnak) */}
        {!userId && (
          <div className="rounded-2xl border border-sand bg-white p-8 text-center md:p-10">
            <p aria-hidden="true" className="text-3xl leading-none">
              🧭
            </p>
            <h2 className="mt-2 font-fraunces text-[22px] tracking-tight text-ink">
              {t("content.shareCtaTitle", locale)}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-body">
              {t("content.shareCtaDesc", locale)}
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/try" className={getButtonClassName({ variant: "primary" })}>
                {t("content.shareCtaButton", locale)}
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
