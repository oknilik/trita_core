import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { SurfaceHero } from "@/components/ui/patterns/SurfaceHero";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import { extractDimensionScores, type ScoreResult } from "@/lib/scoring";
import type { TestType } from "@prisma/client";
import { dimColorsCss } from "@/lib/color-system";
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
import { dimensionDefinition } from "@/lib/dimension-description";
import { HowYouWorkSection } from "@/components/results/HowYouWorkSection";
import { IdealEnvironmentSection } from "@/components/results/IdealEnvironmentSection";
import { RoleFitSection } from "@/components/results/RoleFitSection";
import { t, tf } from "@/lib/i18n";
import { buildSignInPath } from "@/lib/navigation/auth-redirects";

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

// A dimenzió személyre szabott értelmezése — a megosztott lapon ugyanaz a
// sáv-választás fut, mint a saját eredmény-oldalon: a szám mellé MINDIG a
// pontszámhoz tartozó szöveg megy ki, nem a dimenzió általános definíciója.
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
            <Link href={buildSignInPath(`/share/${token}`)} className={getButtonClassName({ variant: "secondary" })}>
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

  // A dimenziók bipolárisak: egy alacsony pontszám ugyanúgy karakteres
  // működési pólus lehet, mint egy magas. Ezért nem a nyers pontszámot,
  // hanem a semleges középponttól való eltérést rangsoroljuk.
  const distinctiveDimensions = [...dimensions].sort(
    (a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50),
  );
  const mostDistinctiveDimension = distinctiveDimensions[0] ?? null;
  const secondDistinctiveDimension = distinctiveDimensions[1] ?? null;
  const topDimensions = distinctiveDimensions.slice(0, 2);
  const sharedHeroInsight = topDimensions.length >= 2
    ? tf("results.shareHeroInsight", locale, {
        first: topDimensions[0].label,
        second: topDimensions[1].label,
      })
    : mostDistinctiveDimension
      ? tf("results.shareHeroInsightSingle", locale, { first: mostDistinctiveDimension.label })
      : "";

  const quickSummary = [
    {
      label: t("results.shareQuickNatural", locale),
      text: mostDistinctiveDimension
        ? tf("results.shareQuickNaturalText", locale, {
            label: mostDistinctiveDimension.label,
            score: mostDistinctiveDimension.score,
          })
        : "",
    },
    {
      label: t("results.shareQuickNuance", locale),
      text: secondDistinctiveDimension
        ? tf("results.shareQuickNuanceText", locale, {
            label: secondDistinctiveDimension.label,
            score: secondDistinctiveDimension.score,
          })
        : "",
    },
    {
      label: t("results.shareQuickUse", locale),
      text: t("results.shareQuickUseText", locale),
    },
  ].filter((item) => item.text);

  return (
    <main className="min-h-dvh bg-cream">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 pb-20 pt-8 md:gap-14 md:pt-10">
        <SurfaceHero
          variant="self"
          contentClassName="px-6 pb-7 pt-7 md:px-9 md:pb-9 md:pt-9"
          eyebrow={(
            <p className="font-mono text-micro uppercase tracking-widest text-white/[0.45]">
              {t("results.sharedProfileLabel", locale)}
            </p>
          )}
          title={(
            <div className="flex items-center gap-4">
              {glyphPair ? (
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
              ) : null}
              <h1 className="break-words font-fraunces text-[30px] tracking-tight text-white md:text-[34px]">
                {displayName}
              </h1>
            </div>
          )}
          meta={(
            <p className="text-[11px] text-white/[0.45]">
              {t("results.heroAssessment", locale)} {formattedDate}
            </p>
          )}
          body={personalityType ? (
            <p className="font-fraunces text-[20px] italic text-[var(--color-accent-primary-soft)]">
              {personalityType}
            </p>
          ) : null}
          summary={sharedHeroInsight}
          chips={topDimensions.map((dimension) => (
            <span key={dimension.code} className="rounded-full bg-white/[0.12] px-3 py-1 text-micro font-medium text-white/[0.8]">
              {dimension.label} {dimension.score}
            </span>
          ))}
        />

        <section aria-labelledby="share-summary-heading">
          <SectionEyebrow variant="clean" tone="bronze" className="mb-2">
            {t("results.shareSummaryEyebrow", locale)}
          </SectionEyebrow>
          <h2 id="share-summary-heading" className="max-w-2xl font-fraunces text-[27px] leading-tight text-ink md:text-[31px]">
            {tf("results.shareSummaryTitle", locale, { name: displayName })}
          </h2>
          <p className="mt-2 max-w-2xl text-caption leading-relaxed text-muted">
            {t("results.shareSummaryBody", locale)}
          </p>
          <div className="mt-6 overflow-hidden rounded-[20px] border border-[var(--color-border-soft)] bg-surface-card px-5 md:px-7">
            {quickSummary.map((item, index) => (
              <article key={item.label} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 border-t border-[var(--color-border-soft)] py-5 first:border-t-0 md:grid-cols-[42px_minmax(0,1fr)]">
                <span className="pt-0.5 font-mono text-micro font-semibold tracking-widest text-[var(--color-accent-primary-strong)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{item.label}</h3>
                  <p className="mt-1.5 text-caption leading-relaxed text-ink-body">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="share-dimensions-heading">
          <SectionEyebrow variant="clean" tone="bronze" className="mb-2">
            {t("results.dimSectionEyebrow", locale)}
          </SectionEyebrow>
          <h2 id="share-dimensions-heading" className="font-fraunces text-[25px] leading-tight text-ink md:text-[29px]">
            {t("results.shareDimensionsTitle", locale)}
          </h2>
          <p className="mt-2 max-w-2xl text-caption leading-relaxed text-muted">
            {t("results.shareDimensionsBody", locale)}
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            {dimensions.map((dimension) => {
              const colors = dimColorsCss(dimension.code);
              return (
                <details
                  key={dimension.code}
                  open={dimension.code === mostDistinctiveDimension?.code}
                  className="group overflow-hidden rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card shadow-[var(--ui-shadow-sm)]"
                >
                  <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-state-focus-ring)] [&::-webkit-details-marker]:hidden">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors.base }} />
                    <span className="min-w-0 flex-1 text-sm font-medium text-ink">{dimension.label}</span>
                    <span className="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-[var(--color-border-default)] sm:block">
                      <span className="block h-full rounded-full" style={{ width: `${dimension.score}%`, backgroundColor: colors.base }} />
                    </span>
                    <span className="w-10 shrink-0 text-right font-fraunces text-base tabular-nums" style={{ color: colors.strong }}>
                      {dimension.score}
                    </span>
                    <span className="text-muted transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                  </summary>
                  <div className="border-t border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-4 md:px-5">
                    <span className="inline-flex rounded-full px-2.5 py-1 text-micro font-semibold" style={{ backgroundColor: colors.soft, color: colors.strong }}>
                      {poleAwareDimensionLabel(dimension.code, dimension.score, locale)}
                    </span>
                    {/* Előbb a személyre szabott értelmezés (ez a megosztás
                        tétje), utána halkabban a dimenzió definíciója —
                        az adja a kontextust annak, aki most találkozik vele. */}
                    <p className="mt-3 max-w-2xl text-caption font-medium leading-relaxed text-ink">
                      {dimension.insight}
                    </p>
                    <p className="mt-2.5 max-w-2xl text-caption leading-relaxed text-muted">
                      {dimensionDefinition(dimension.description)}
                    </p>
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="share-deeper-heading">
          <SectionEyebrow variant="clean" tone="bronze" className="mb-2">
            {t("results.shareExploreEyebrow", locale)}
          </SectionEyebrow>
          <h2 id="share-deeper-heading" className="font-fraunces text-[25px] leading-tight text-ink md:text-[29px]">
            {t("results.shareExploreTitle", locale)}
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            <details className="group overflow-hidden rounded-[18px] border border-[var(--color-border-soft)] bg-surface-card shadow-[var(--ui-shadow-sm)]">
              <summary className="flex min-h-[82px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span>
                  <strong className="block font-fraunces text-[20px] font-medium text-ink">{t("results.shareChapterWork", locale)}</strong>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">{t("results.shareChapterWorkBody", locale)}</span>
                </span>
                <span aria-hidden="true" className="text-lg text-sage-dark transition-transform group-open:rotate-180">⌄</span>
              </summary>
              {/* A saját eredmény-oldallal AZONOS narratíva (közös producer:
                  workstyle-content) — a korábbi sablonmondat helyett, ami
                  minden profilnak ugyanazt a két dimenzió-nevet mondta fel. */}
              <div className="border-t border-[var(--color-border-soft)] px-5 py-5">
                <HowYouWorkSection parts={workstyle.howYouWorkParts} isUnlocked hideHeading />
              </div>
            </details>

            <details className="group overflow-hidden rounded-[18px] border border-[var(--color-border-soft)] bg-surface-card shadow-[var(--ui-shadow-sm)]">
              <summary className="flex min-h-[82px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span>
                  <strong className="block font-fraunces text-[20px] font-medium text-ink">{t("results.shareChapterEnvironment", locale)}</strong>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">{t("results.shareChapterEnvironmentBody", locale)}</span>
                </span>
                <span aria-hidden="true" className="text-lg text-sage-dark transition-transform group-open:rotate-180">⌄</span>
              </summary>
              {/* A szint-szó a kanonikus feloldóból jön (resolveEnvLevel), nem
                  az érték-szöveg vágásából — a hedge-sáv („Inkább magas") és a
                  magyarázó fél mondat így nem esik ki a megosztott nézetből. */}
              <div className="border-t border-[var(--color-border-soft)] px-5 py-5">
                <IdealEnvironmentSection items={workstyle.envItems} isUnlocked hideHeading />
              </div>
            </details>

            <details className="group overflow-hidden rounded-[18px] border border-[var(--color-border-soft)] bg-surface-card shadow-[var(--ui-shadow-sm)]">
              <summary className="flex min-h-[82px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span>
                  <strong className="block font-fraunces text-[20px] font-medium text-ink">{t("results.shareChapterRoleFit", locale)}</strong>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">{t("results.shareChapterRoleFitBody", locale)}</span>
                </span>
                <span aria-hidden="true" className="text-lg text-sage-dark transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="border-t border-[var(--color-border-soft)] px-5 py-5">
                <RoleFitSection
                  strongFit={workstyle.roleFit.strong}
                  mightWork={workstyle.roleFit.might}
                  needsPrep={workstyle.roleFit.prep}
                  secondary={workstyle.roleFit.secondary}
                  strongRoles={workstyle.roleFit.strongRoles}
                  mightRoles={workstyle.roleFit.mightRoles}
                  prepRoles={workstyle.roleFit.prepRoles}
                  isUnlocked
                  hideHeading
                />
              </div>
            </details>

            {teamRoleTop3.length > 0 ? (
              <details className="group overflow-hidden rounded-[18px] border border-[var(--color-border-soft)] bg-surface-card shadow-[var(--ui-shadow-sm)]">
                <summary className="flex min-h-[82px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span>
                    <strong className="block font-fraunces text-[20px] font-medium text-ink">{t("results.shareChapterRoles", locale)}</strong>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">{t("results.shareChapterRolesBody", locale)}</span>
                  </span>
                  <span aria-hidden="true" className="text-lg text-sage-dark transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <div className="border-t border-[var(--color-border-soft)] px-5 py-5">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-micro font-bold uppercase tracking-wide text-muted">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    {t("results.teamRoleSourceEstimate", locale)}
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {teamRoleTop3.map(({ role }, index) => (
                      <div key={role} className={`rounded-xl p-4 ${index === 0 ? "border-2 border-sage bg-sage-soft" : "border border-[var(--color-border-soft)] bg-surface-card"}`}>
                        <span className="text-micro font-bold uppercase tracking-wide text-muted">{rankLabels[index][locale]}</span>
                        <p className="mt-1 font-fraunces text-[18px] text-ink">{TEAM_ROLES[role][locale]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            ) : null}
          </div>
        </section>

        {/* Footer CTA — csak kijelentkezett látogatónak (bejelentkezett
            usernek nincs értelme a "készíts profilt" felhívásnak) */}
        {!userId && (
          <div className="rounded-[20px] border border-sand bg-surface-card p-8 text-center shadow-[var(--ui-shadow-sm)] md:p-10">
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
