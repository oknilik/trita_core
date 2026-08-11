import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import { extractDimensionScores, type ScoreResult } from "@/lib/scoring";
import type { TestType } from "@prisma/client";
import { getDimensionTier } from "@/lib/dimension-utils";
import { poleAwareDimensionLabel } from "@/lib/profile-content";
import { resolveDisplayRoleScores } from "@/lib/team-role-estimate";
import {
  isSecondaryUncertain,
  resolvePersonalityTypeFromScores,
} from "@/lib/personality-type";
import { resolveGlyphPair } from "@/lib/type-glyph";
import { loadShareOgModel } from "@/lib/share-og";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import { TEAM_ROLES, getTopRoles } from "@/lib/team-role-scoring";
import { buildWorkstyleContent } from "@/lib/workstyle-content";
import { HowYouWorkSection } from "@/components/results/HowYouWorkSection";
import { IdealEnvironmentSection } from "@/components/results/IdealEnvironmentSection";
import { RoleFitSection } from "@/components/results/RoleFitSection";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// A cím és leírás a megosztott profilhoz igazodik (og:title a
// link-előnézetben), a noindex marad — a kép az opengraph-image route-ból jön.
// A locale ugyanabból a feloldóból (getServerLocale), amiből az oldal törzse
// — a korábbi hardkódolt "hu" EN-nézőnek is magyar címet/típusnevet adott.
// (Az OG-KÉP route-ja tudatosan hu marad — a kép cache-elt, néző-független.)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const [{ token }, locale] = await Promise.all([params, getServerLocale()]);
  const isHu = locale === "hu";
  const model = await loadShareOgModel(token, isHu ? "hu" : "en");
  const title =
    model.displayName && model.typeLabel
      ? `${model.displayName} — ${model.typeLabel} | trita`
      : model.typeLabel
        ? `${model.typeLabel} | trita`
        : isHu
          ? "Megosztott profil | trita"
          : "Shared profile | trita";
  return {
    title,
    description: isHu
      ? "Személyiségprofil a trita platformról — önértékelés és külső visszajelzés, tudományos alapon."
      : "A personality profile from the trita platform — self-assessment and external feedback, on a scientific basis.",
    robots: { index: false },
  };
}

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
        <div className="w-full max-w-md rounded-2xl border border-sand bg-surface-card p-8 text-center md:p-10">
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

  // FIX 4 kiterjesztés (0 mint „nincs mérve"): a score-JSON-ból hiányzó
  // dimenzió NEM 0 pont — a korábbi `?? 0` valódi 0-ként renderelte
  // („figyelendő" badge, 0-ból generált low-próza). A nem mért dimenzió
  // kimarad a megosztott nézetből is.
  // Kanonikus olvasó — az örökség-kulcsos (INTE/RESO/…) sorok is
  // megjeleníthetők maradnak, a megosztott link nem ürül ki.
  const dimensionScores = extractDimensionScores(result.scores) ?? {};

  const dimensions = config.dimensions
    .filter((d) => d.code !== "I")
    .flatMap((dim) => {
      const score = dimensionScores[dim.code];
      if (typeof score !== "number") return [];
      const insights = (dim.insightsByLocale?.[locale] ?? dim.insights) as {
        low: string; mid: string; high: string;
      };
      return [{
        code: dim.code,
        label: (dim.labelByLocale?.[locale] ?? dim.label) as string,
        score,
        insight: getInsight(score, insights),
        description: (dim.descriptionByLocale?.[locale] ?? dim.description) as string,
      }];
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

  const glyphPair = resolveGlyphPair(
    dimensions.map((d) => ({ code: d.code, score: d.score })),
  );
  // S3-hedge: az ábra aria-labelje ugyanazzal a kapuval degradál rendezetlen
  // párrá, mint a címke (isSecondaryUncertain) — erősorrend-állítás nélkül.
  const glyphUncertain = isSecondaryUncertain(
    dimensions.map((d) => ({ code: d.code, score: d.score })),
  );

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
  const hasTeamRole = "H" in hexScores && "X" in hexScores;
  // resolveDisplayRoleScores: exact (nyers evidencia) tie-break — a fő szerep
  // egyezik a többi felülettel; részleges dim-sornál null (nincs becslés
  // kitalált 50-esekből), így a szekció üresen marad.
  const resolvedRole = hasTeamRole
    ? resolveDisplayRoleScores(null, hexScores as Record<"H" | "E" | "X" | "A" | "C" | "O", number>)
    : null;
  const teamRoleTop3 = resolvedRole
    ? getTopRoles(resolvedRole.scores, 3, resolvedRole.exact)
    : [];

  const rankLabels = [
    { hu: "Elsődleges", en: "Primary" },
    { hu: "Másodlagos", en: "Secondary" },
    { hu: "Harmadik", en: "Tertiary" },
  ];

  return (
    <main className="min-h-dvh bg-cream">
      {/* pb-20: a hullámos footer -mt-10/14-gyel az oldal aljára húzódik —
          a lap-vég paddingja ezért ≥56px (md), különben a footer belecsúszik
          az utolsó blokkba (ld. changelog 2026-07-29, footer-hullám fix). */}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-20 pt-10">
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
            {/* Ugyanaz a fejléc-szerkezet, mint a saját eredmény-oldalon:
                a típus-ábra a NÉV mellett áll, a dátum a névvel egy
                blokkban, a típusnév a saját sorában. */}
            <div className="mb-3 flex items-center gap-4">
              {glyphPair && (
                <TypeGlyph
                  primaryCode={glyphPair.primaryCode}
                  secondaryCode={glyphPair.secondaryCode}
                  typeLabel={personalityType || displayName}
                  locale={isHu ? "hu" : "en"}
                  intensity={glyphPair.intensity}
                  secondaryUncertain={glyphUncertain}
                  variant="badge"
                  className="h-14 w-14 shrink-0 rounded-xl border border-white/20 md:h-16 md:w-16"
                />
              )}
              <div className="min-w-0">
                <h1 className="break-words font-fraunces text-[28px] tracking-tight text-white">
                  {displayName}
                </h1>
                <p className="mt-1 text-[11px] text-white/[0.25]">
                  {t("results.heroAssessment", locale)} {formattedDate}
                </p>
              </div>
            </div>
            {personalityType && (
              <p className="font-fraunces text-[18px] italic text-[var(--color-accent-primary-soft)]">
                {personalityType}
              </p>
            )}
          </div>
        </div>

        {/* Dimension strip */}
        <div className="w-full overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-surface-card">
          {/* Mobil-first: 2 oszlop 320-767px között (a 6 oszlopos strip cellái
              ott ~40px szélesek lennének, a címke/pontszám/badge átfolyna a
              szomszédba), md:-től marad az eredeti 6 oszlopos sáv. A cellák
              közti vonalat gap-px + háttér adja, így minden rácsban stimmel. */}
          <div className="grid grid-cols-2 gap-px bg-[var(--color-border-default)] md:grid-cols-6">
            {dimensions.map((dim) => {
              const tier = getDimensionTier(dim.score);
              const tierColor = tier === "high" ? "var(--color-action-primary-bg)" : tier === "mid" ? "var(--color-accent-primary)" : "var(--color-text-muted)";
              const tierBg = tier === "high" ? "var(--color-surface-self-accent-soft)" : tier === "mid" ? "var(--color-surface-highlight-warm)" : "var(--color-surface-subtle)";
              return (
                <div
                  key={dim.code}
                  className="min-w-0 bg-surface-card px-2.5 py-4 text-center"
                >
                  <p className="mb-1.5 break-words text-micro text-[var(--color-text-muted)]">
                    <span className="md:hidden">{dim.label}</span>
                    <span className="hidden md:inline">
                      {dim.label.length > 10 ? dim.label.slice(0, 10) + "." : dim.label}
                    </span>
                  </p>
                  <p className="mb-1.5 font-fraunces text-[22px] leading-none" style={{ color: tierColor }}>
                    {dim.score}
                  </p>
                  <span
                    className="inline-block rounded px-[7px] py-[2px] text-micro font-semibold"
                    style={{ backgroundColor: tierBg, color: tierColor }}
                  >
                    {/* Pólus-tudatos címke: E alacsony sávja „stabil" (FIX 2). */}
                    {poleAwareDimensionLabel(dim.code, dim.score, locale)}
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
          <HowYouWorkSection parts={workstyle.howYouWorkParts} isUnlocked={true} />
          <IdealEnvironmentSection items={workstyle.envItems} isUnlocked={true} />
          <RoleFitSection
            strongFit={workstyle.roleFit.strong}
            mightWork={workstyle.roleFit.might}
            needsPrep={workstyle.roleFit.prep}
            secondary={workstyle.roleFit.secondary}
            strongRoles={workstyle.roleFit.strongRoles}
            mightRoles={workstyle.roleFit.mightRoles}
            prepRoles={workstyle.roleFit.prepRoles}
            isUnlocked={true}
          />
        </div>

        {/* TeamRole */}
        {teamRoleTop3.length > 0 && (
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <p className="text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
                {t("results.teamRoleHeading", locale)}
              </p>
              {/* Forrás-badge — a megosztott nézet mindig profil-alapú becslést mutat. */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-0.5 text-micro font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                {t("results.teamRoleSourceEstimate", locale)}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.4fr_1fr_1fr]">
              {teamRoleTop3.map(({ role }, idx) => {
                const roleMeta = TEAM_ROLES[role];
                const isPrimary = idx === 0;
                return (
                  <div
                    key={role}
                    className={`flex flex-col rounded-xl ${
                      isPrimary
                        ? "border-2 border-[var(--color-action-primary-bg)] bg-[var(--color-surface-self-accent-soft)] p-[22px]"
                        : "border-[1.5px] border-[var(--color-border-default)] bg-surface-card p-[18px]"
                    }`}
                  >
                    <span
                      className={`mb-2 self-start rounded px-[9px] py-[3px] text-micro font-bold uppercase tracking-wide ${
                        isPrimary
                          ? "bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)]"
                          : idx === 1
                            ? "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]"
                            : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]"
                      }`}
                    >
                      {/* Becsült szerepnél NINCS pontszám (P2.3, a PDF-fel
                          egyezően): a profil-alapú becslés %-a álprecizitást
                          sugallna — csak a rang-sáv megy ki. */}
                      {rankLabels[idx][locale]}
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
          <div className="rounded-2xl border border-sand bg-surface-card p-8 text-center md:p-10">
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
