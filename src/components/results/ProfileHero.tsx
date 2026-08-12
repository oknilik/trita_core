"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { SuccessCheck } from "@/components/ui/primitives/SuccessCheck";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";
import { ShareIcon, DocumentIcon } from "@/components/ui/icons";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import { DIMENSION_GLYPHS, resolveGlyphPair } from "@/lib/type-glyph";
import { isSecondaryUncertain } from "@/lib/personality-type";
import { SELF_PAYWALL_ENABLED } from "@/lib/operating-mode";
import { HEXACO_DIMENSIONS, type HexacoCode } from "@/lib/hexaco";
import { withHuArticle } from "@/lib/hu-grammar";

type AccessLevel = "start" | "plus";

const LEVEL_CONFIG: Record<AccessLevel, { label: string; bg: string; color: string }> = {
  start: { label: "Free",  bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" },
  plus:  { label: "Plus",  bg: "rgba(193,127,74,0.2)",   color: "var(--color-accent-primary-soft)" },
};

const SELF_TOP_DIM_BG = "rgba(61,107,94,0.3)";
const SELF_TOP_DIM_TEXT = "var(--color-surface-self-accent-soft)";

interface ProfileHeroProps {
  userName: string;
  completedAt: string;
  personalityType: string;
  /** A típus-ábrához: pontozott dimenziók (TRITAN-kódok). Enélkül nincs ábra. */
  glyphDimensions?: Array<{ code: string; score: number }>;
  insight: string;
  accessLevel?: AccessLevel;
  onDownloadPdf?: () => void;
  pdfLoading?: boolean;
  onShare?: () => void;
  shareLoading?: boolean;
  topDimensions?: string[];
  watchDimensions?: string[];
}

export function ProfileHero({
  userName,
  completedAt,
  personalityType,
  glyphDimensions,
  insight,
  accessLevel = "start",
  onDownloadPdf,
  pdfLoading,
  onShare,
  shareLoading,
  topDimensions = [],
  watchDimensions = [],
}: ProfileHeroProps) {
  const { locale } = useLocale();
  const [heroSide, setHeroSide] = useState<"profile" | "glyph">("profile");

  // PDF-gomb finom visszajelzése: generálás alatt pörgő progress,
  // siker után zöld pipa, ami pár másodperc múlva magától eltűnik.
  const [pdfDone, setPdfDone] = useState(false);
  const wasPdfLoading = useRef(false);
  useEffect(() => {
    const was = wasPdfLoading.current;
    wasPdfLoading.current = Boolean(pdfLoading);
    if (was && !pdfLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPdfDone(true);
      const id = setTimeout(() => setPdfDone(false), 2600);
      return () => clearTimeout(id);
    }
  }, [pdfLoading]);

  const glyphPair = glyphDimensions ? resolveGlyphPair(glyphDimensions) : null;
  // S3-hedge: az ábra aria-labelje ugyanazzal a kapuval degradál rendezetlen
  // párrá, mint a címke/tábla (isSecondaryUncertain) — a felolvasott szöveg
  // nem állíthat erősorrendet, amit a látható felület már nem állít.
  const glyphUncertain = glyphDimensions
    ? isSecondaryUncertain(glyphDimensions)
    : false;
  const dimensionName = (code: string) => {
    const dimension = HEXACO_DIMENSIONS[code as HexacoCode];
    if (!dimension) return code;
    return locale === "hu" ? dimension.hu : dimension.en;
  };
  const glyphPairLabel = glyphPair
    ? glyphPair.primaryCode === glyphPair.secondaryCode
      ? dimensionName(glyphPair.primaryCode)
      : glyphUncertain
        ? tf("results.glyphPairUncertain", locale, {
            a: dimensionName(glyphPair.primaryCode),
            b: dimensionName(glyphPair.secondaryCode),
          })
        : `${dimensionName(glyphPair.primaryCode)} × ${dimensionName(glyphPair.secondaryCode)}`
    : "";
  const glyphGrammar = glyphPair
    ? tf(
        glyphUncertain ? "results.heroGlyphGrammarUncertain" : "results.heroGlyphGrammar",
        locale,
        {
          form: locale === "hu"
            ? withHuArticle(DIMENSION_GLYPHS[glyphPair.primaryCode].formName.hu)
            : DIMENSION_GLYPHS[glyphPair.primaryCode].formName.en,
          primary: locale === "hu"
            ? withHuArticle(dimensionName(glyphPair.primaryCode))
            : dimensionName(glyphPair.primaryCode),
          motif: locale === "hu"
            ? withHuArticle(DIMENSION_GLYPHS[glyphPair.secondaryCode].motifName.hu)
            : DIMENSION_GLYPHS[glyphPair.secondaryCode].motifName.en,
          secondary: locale === "hu"
            ? withHuArticle(dimensionName(glyphPair.secondaryCode))
            : dimensionName(glyphPair.secondaryCode),
        },
      )
    : "";
  const level = LEVEL_CONFIG[accessLevel];
  const selfTheme = SURFACE_HERO_THEME.self;
  const showingGlyph = Boolean(glyphPair) && heroSide === "glyph";

  const flipControl = glyphPair ? (
    <button
      type="button"
      aria-pressed={showingGlyph}
      aria-label={t(
        showingGlyph ? "results.heroGlyphBackA11y" : "results.heroGlyphOpenA11y",
        locale,
      )}
      onClick={() => setHeroSide((side) => side === "profile" ? "glyph" : "profile")}
      className="group absolute bottom-0 left-1/2 z-20 inline-flex min-h-[48px] w-[calc(100%-2.5rem)] -translate-x-1/2 items-center justify-center gap-2 rounded-t-lg border border-b-0 border-white/20 bg-[var(--color-surface-card)] px-4 text-xs font-semibold text-sage-dark shadow-[var(--ui-shadow-md)] transition hover:bg-[var(--color-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-sage-dark md:bottom-auto md:left-auto md:right-0 md:top-1/2 md:min-h-[132px] md:w-11 md:-translate-x-0 md:-translate-y-1/2 md:flex-col md:rounded-l-xl md:rounded-r-none md:border-b md:border-r-0 md:px-2 md:shadow-[var(--ui-shadow-lg)]"
    >
      <span
        aria-hidden="true"
        className="text-base leading-none transition-transform duration-[var(--motion-duration-base)] group-hover:rotate-45 motion-reduce:transition-none"
      >
        ↻
      </span>
      <span className="md:[writing-mode:vertical-rl]">
        {t(showingGlyph ? "results.heroGlyphBack" : "results.heroGlyphOpen", locale)}
      </span>
    </button>
  ) : null;

  return (
    <div className="relative">
      {showingGlyph && glyphPair ? (
        <SurfaceHero
          variant="self"
          className="min-h-[330px]"
          contentClassName="mx-auto max-w-4xl !px-5 !pb-20 !pt-6 md:!px-9 md:!pb-9 md:!pt-9"
          title={(
            <div
              id="profile-hero-glyph-side"
              className="grid min-h-[224px] items-center gap-6 md:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.1fr)] md:gap-9"
              style={{ animation: "fadeIn 0.24s ease-out" }}
            >
              <div className="flex min-h-[210px] items-center justify-center rounded-[20px] border border-white/15 bg-[var(--color-surface-card)]/95 p-3 shadow-[var(--ui-shadow-lg)] md:min-h-[252px]">
                <TypeGlyph
                  primaryCode={glyphPair.primaryCode}
                  secondaryCode={glyphPair.secondaryCode}
                  typeLabel={personalityType}
                  locale={locale === "hu" ? "hu" : "en"}
                  intensity={glyphPair.intensity}
                  secondaryUncertain={glyphUncertain}
                  variant="card"
                  className="max-h-[230px] w-full rounded-xl object-contain md:max-h-[252px]"
                />
              </div>
              <div className="min-w-0">
                <p className="text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">
                  {t("results.heroGlyphEyebrow", locale)}
                </p>
                <h1 className="mt-2 break-words font-fraunces text-[34px] leading-none tracking-tight text-[var(--color-text-on-inverse)] md:text-[46px]">
                  {personalityType}
                </h1>
                <p className="mt-4 font-fraunces text-[17px] italic text-[var(--color-accent-primary-soft)] md:text-[20px]">
                  {glyphPairLabel}
                </p>
                <p className="mt-3 max-w-[420px] text-[14px] leading-relaxed text-[var(--color-text-on-inverse-muted)]">
                  {glyphGrammar}
                </p>
              </div>
            </div>
          )}
        />
      ) : (
        <SurfaceHero
      variant="self"
      className={glyphPair ? "min-h-[330px]" : undefined}
      contentClassName={`mx-auto max-w-4xl px-5 py-8 md:px-9 md:py-10 ${glyphPair ? "!pb-20 md:!pb-10" : ""}`}
      eyebrow={
        // Kikapcsolt paywallnál az „A te profilod" badge-ként jelenik meg,
        // eyebrow nincs.
        SELF_PAYWALL_ENABLED ? (
          <p className="text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">
            {t("results.heroEyebrow", locale)}
          </p>
        ) : undefined
      }
      badge={
        SELF_PAYWALL_ENABLED ? (
          <span
            className="rounded-md px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide"
            style={{ backgroundColor: level.bg, color: level.color }}
          >
            {level.label}
          </span>
        ) : (
          <span
            className="rounded-md px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {t("results.heroEyebrow", locale)}
          </span>
        )
      }
      title={(
        // A kis karakterábra kikerült a név mellől: ott elveszett, és a hero
        // szöveges hierarchiáját is megtörte. A teljes kompozíció a hero
        // másik oldalán, önálló vizuális fókuszként jelenik meg.
        <div id="profile-hero-profile-side" className="mb-0.5" style={{ animation: "fadeIn 0.24s ease-out" }}>
          <div className="min-w-0">
            <h1 className="break-words font-fraunces text-[26px] tracking-tight text-[var(--color-text-on-inverse)] md:text-[34px]">
              {userName}
            </h1>
            <p className="mt-1 text-[11px] text-[var(--color-text-on-inverse-muted)]">
              {t("results.heroAssessment", locale)} {completedAt}
            </p>
          </div>
        </div>
      )}
      body={(
        <div>
          {/* Az ál-percentilis badge végleg kivezetve (B17) — valós norma-
              adattal térhet vissza (terv P4.3). */}
          <span className="font-fraunces text-[18px] italic text-[var(--color-accent-primary-soft)] md:text-[22px]">
            {personalityType}
          </span>
        </div>
      )}
      summary={insight}
      summaryClassName="max-w-[480px] text-[var(--color-text-on-inverse-muted)]"
      chips={(
        <>
          {(topDimensions.length > 0 || watchDimensions.length > 0) ? (
            <div className="flex flex-wrap items-center gap-2">
              {topDimensions.length > 0 ? (
                <>
                  <span className="text-micro uppercase tracking-wide text-[var(--color-text-on-inverse-muted)]">
                    {t("content.heroTopDims", locale)}:
                  </span>
                  {topDimensions.map((d) => (
                    <span
                      key={d}
                      className="rounded px-2 py-0.5 text-micro font-medium"
                      style={{ backgroundColor: SELF_TOP_DIM_BG, color: SELF_TOP_DIM_TEXT }}
                    >
                      {d}
                    </span>
                  ))}
                </>
              ) : null}
              {watchDimensions.length > 0 ? (
                <>
                  <span className="ml-2 text-micro uppercase tracking-wide text-[var(--color-text-on-inverse-muted)]">
                    {t("content.heroWatchDims", locale)}:
                  </span>
                  {watchDimensions.map((d) => (
                    <span
                      key={d}
                      className="rounded px-2 py-0.5 text-micro font-medium"
                      style={{ backgroundColor: selfTheme.badgeBg, color: "var(--color-accent-primary-soft)" }}
                    >
                      {d}
                    </span>
                  ))}
                </>
              ) : null}
            </div>
          ) : null}
        </>
      )}
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onShare}
            disabled={shareLoading}
            variant="ghost"
            // A sötét hero-panel készlete a primitívből jön (onInverse). A
            // korábbi kézi szín-felülírás NEM működött: a `cn()` nem
            // tailwind-merge, így a variant világos `text-action-secondary-fg`-je
            // nyert, és a gomb csak hoverre vált láthatóvá.
            onInverse
            className="rounded-[9px] px-[18px] text-[11px] font-medium"
          >
            <span className="inline-flex items-center gap-2">
              <ShareIcon />
              {shareLoading ? "..." : t("results.heroShare", locale)}
            </span>
          </Button>
          <Button
            type="button"
            onClick={onDownloadPdf}
            disabled={pdfLoading}
            variant="primary"
            onInverse
            className="rounded-[9px] px-[18px] text-[11px] font-medium transition-all duration-300 hover:brightness-110"
            // Kontraszt-fix (motor-audit v6, M7): a self-glow (brand-bronz
            // #c17f4a) töltés a sötét zsálya-gradiensen ~2,7:1 — a gomb
            // beleolvadt a hероba. A működő herók (team/org/candidate) mintája:
            // VILÁGOS glow-töltés + sötét `text-on-accent` felirat. A self
            // réteg világos bronza az `accent-primary-soft` (bronz-300) —
            // töltésként ≥4,3:1 a gradiens-stopokon, a sötét felirat rajta
            // ≥8:1, és mindkét színsémában világos marad. Inline style-ban,
            // hogy a variant-osztályokkal ne legyen kaszkád-verseny.
            style={{
              backgroundColor: "var(--color-accent-primary-soft)",
              color: "var(--color-text-on-accent)",
            }}
          >
            {pdfLoading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
                {t("results.heroPdf", locale)}
              </span>
            ) : pdfDone ? (
              <span className="inline-flex items-center gap-2">
                <SuccessCheck />
                {t("results.heroPdf", locale)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <DocumentIcon />
                {t("results.heroPdf", locale)}
              </span>
            )}
          </Button>
        </div>
      )}
        />
      )}

      {flipControl}
    </div>
  );
}
