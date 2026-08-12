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
  const heroMotionRef = useRef<HTMLDivElement | null>(null);
  const flipIconRef = useRef<SVGSVGElement | null>(null);
  const hintAnimationsRef = useRef<Animation[]>([]);
  const flipDirectionRef = useRef(-1);
  const didRunHintRef = useRef(false);
  const hasFlippedRef = useRef(false);
  const isFlippingRef = useRef(false);

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
  const hasGlyphPair = Boolean(glyphPair);

  useEffect(() => {
    if (!hasGlyphPair || didRunHintRef.current) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof heroMotionRef.current?.animate !== "function") return;
    didRunHintRef.current = true;

    const heroHint = heroMotionRef.current.animate(
      [
        { transform: "rotateY(0deg) translateX(0)" },
        { transform: "rotateY(0deg) translateX(0)", offset: 0.48 },
        { transform: "rotateY(-2.6deg) translateX(-2px)", offset: 0.64 },
        { transform: "rotateY(0.9deg) translateX(0)", offset: 0.79 },
        { transform: "rotateY(0deg) translateX(0)" },
      ],
      {
        duration: 1350,
        delay: 300,
        easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
      },
    );
    const iconHint = flipIconRef.current?.animate(
      [
        { transform: "rotate(0deg) scale(1)" },
        { transform: "rotate(0deg) scale(1)", offset: 0.48 },
        { transform: "rotate(115deg) scale(1.08)", offset: 0.68 },
        { transform: "rotate(92deg) scale(1)", offset: 0.82 },
        { transform: "rotate(0deg) scale(1)" },
      ],
      {
        duration: 1350,
        delay: 300,
        easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
      },
    );

    hintAnimationsRef.current = iconHint ? [heroHint, iconHint] : [heroHint];
    return () => {
      hintAnimationsRef.current.forEach((animation) => animation.cancel());
      hintAnimationsRef.current = [];
      // Fejlesztői Strict Mode-ban az első effect-kört a React azonnal
      // visszavonja. Engedjük, hogy a valódi második kör elindítsa a jelzést.
      didRunHintRef.current = false;
    };
  }, [hasGlyphPair]);

  useEffect(() => {
    if (!hasFlippedRef.current) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      isFlippingRef.current = false;
      return;
    }
    if (typeof heroMotionRef.current?.animate !== "function") {
      isFlippingRef.current = false;
      return;
    }

    const incomingAngle = flipDirectionRef.current * -14;
    const animation = heroMotionRef.current.animate(
      [
        { opacity: 0.84, transform: `rotateY(${incomingAngle}deg)` },
        { opacity: 1, transform: "rotateY(0deg)" },
      ],
      {
        duration: 260,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    );
    animation.addEventListener("finish", () => {
      isFlippingRef.current = false;
    }, { once: true });

    return () => animation.cancel();
  }, [heroSide]);

  const handleFlip = () => {
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;
    const nextSide = heroSide === "profile" ? "glyph" : "profile";
    const direction = nextSide === "glyph" ? -1 : 1;
    flipDirectionRef.current = direction;
    hintAnimationsRef.current.forEach((animation) => animation.cancel());
    hintAnimationsRef.current = [];
    hasFlippedRef.current = true;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || typeof heroMotionRef.current?.animate !== "function") {
      setHeroSide(nextSide);
      isFlippingRef.current = false;
      return;
    }

    const outgoing = heroMotionRef.current.animate(
      [
        { opacity: 1, transform: "rotateY(0deg)" },
        { opacity: 0.84, transform: `rotateY(${direction * 14}deg)` },
      ],
      {
        duration: 150,
        easing: "cubic-bezier(0.32, 0, 0.67, 0)",
      },
    );
    outgoing.addEventListener("finish", () => setHeroSide(nextSide), { once: true });
  };

  const flipControl = glyphPair ? (
    <button
      type="button"
      aria-pressed={showingGlyph}
      aria-label={t(
        showingGlyph ? "results.heroGlyphBackA11y" : "results.heroGlyphOpenA11y",
        locale,
      )}
      onClick={handleFlip}
      className="group absolute right-3 top-3 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-[var(--color-surface-self-accent-soft)] text-[var(--color-accent-self-deep)] shadow-[var(--ui-shadow-lg)] transition hover:bg-[var(--color-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-sage-dark md:right-0 md:top-1/2 md:min-h-[132px] md:w-11 md:-translate-y-1/2 md:flex-col md:gap-2 md:rounded-l-xl md:rounded-r-none md:border-r-0 md:px-2"
    >
      <svg
        ref={flipIconRef}
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5 transition-transform duration-[var(--motion-duration-base)] group-hover:rotate-45 motion-reduce:transition-none"
      >
        <path
          d="M19 8.5A7.5 7.5 0 0 0 6.6 5.7L5 7.3M5 7.3V3.5M5 7.3h3.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 15.5a7.5 7.5 0 0 0 12.4 2.8L19 16.7m0 0v3.8m0-3.8h-3.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="hidden text-xs font-semibold md:block md:[writing-mode:vertical-rl]">
        {t(showingGlyph ? "results.heroGlyphBack" : "results.heroGlyphOpen", locale)}
      </span>
    </button>
  ) : null;

  return (
    <div className="relative" style={{ perspective: "1400px" }}>
      <div
        ref={heroMotionRef}
        data-profile-hero-motion
        style={{ transformOrigin: showingGlyph ? "right center" : "left center" }}
      >
        {showingGlyph && glyphPair ? (
          <SurfaceHero
            variant="self"
            className="min-h-[330px]"
            contentClassName="mx-auto max-w-4xl !px-5 !pb-7 !pt-5 md:!px-9 md:!pb-9 md:!pt-9"
            title={(
              <div
                id="profile-hero-glyph-side"
                className="grid min-h-[224px] items-center gap-6 md:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.1fr)] md:gap-9"
              >
                <div className="flex min-h-[192px] items-center justify-center overflow-hidden rounded-[20px] border border-white/15 bg-[var(--color-layer-self-soft)] p-2 md:min-h-[252px] md:p-3">
                  <TypeGlyph
                    primaryCode={glyphPair.primaryCode}
                    secondaryCode={glyphPair.secondaryCode}
                    typeLabel={personalityType}
                    locale={locale === "hu" ? "hu" : "en"}
                    intensity={glyphPair.intensity}
                    secondaryUncertain={glyphUncertain}
                    variant="card"
                    canvas={false}
                    className="max-h-[202px] w-full rounded-xl object-contain md:max-h-[252px]"
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
            contentClassName="mx-auto max-w-4xl px-5 py-8 md:px-9 md:py-10"
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
        <div id="profile-hero-profile-side" className="mb-0.5">
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
      </div>

      {flipControl}
    </div>
  );
}
