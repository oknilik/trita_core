"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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
const SWIPE_CARD_GAP = 12;
const HERO_CARD_HEIGHT = 330;

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
  const swipeFrameRef = useRef<HTMLDivElement | null>(null);
  const profileSlideRef = useRef<HTMLDivElement | null>(null);
  const glyphSlideRef = useRef<HTMLDivElement | null>(null);
  const swipeIconRef = useRef<SVGSVGElement | null>(null);
  const hintAnimationsRef = useRef<Animation[]>([]);
  const transitionAnimationsRef = useRef<Animation[]>([]);
  const didRunHintRef = useRef(false);
  const isSwitchingRef = useRef(false);
  const swipeStartRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    lastX: number;
    lastTime: number;
    velocityX: number;
  } | null>(null);
  const swipeOffsetRef = useRef(0);
  const slideWidthRef = useRef(0);
  const slideHeightsRef = useRef({ profile: 330, glyph: 330 });

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

  const setSlidePositions = (side: "profile" | "glyph", offset = 0) => {
    const width = slideWidthRef.current || swipeFrameRef.current?.clientWidth || 1;
    const travel = width + SWIPE_CARD_GAP;
    const profileX = side === "profile" ? offset : -travel + offset;
    const glyphX = side === "profile" ? travel + offset : offset;
    if (profileSlideRef.current) {
      profileSlideRef.current.style.transform = `translate3d(${profileX}px, 0, 0)`;
    }
    if (glyphSlideRef.current) {
      glyphSlideRef.current.style.transform = `translate3d(${glyphX}px, 0, 0)`;
    }
  };

  const setFrameHeight = (height: number) => {
    if (swipeFrameRef.current) swipeFrameRef.current.style.height = `${height}px`;
  };

  useEffect(() => {
    const frame = swipeFrameRef.current;
    const profileSlide = profileSlideRef.current;
    const glyphSlide = glyphSlideRef.current;
    if (!frame || !profileSlide) return;

    const measure = () => {
      slideWidthRef.current = frame.getBoundingClientRect().width || frame.clientWidth || 1;
      slideHeightsRef.current = {
        profile: profileSlide.getBoundingClientRect().height || HERO_CARD_HEIGHT,
        glyph: glyphSlide?.getBoundingClientRect().height || HERO_CARD_HEIGHT,
      };
      setSlidePositions(heroSide);
      setFrameHeight(slideHeightsRef.current[heroSide]);
      profileSlide.inert = heroSide !== "profile";
      if (glyphSlide) glyphSlide.inert = heroSide !== "glyph";
    };
    measure();

    if (typeof ResizeObserver !== "function") return;
    const observer = new ResizeObserver(measure);
    observer.observe(profileSlide);
    if (glyphSlide) observer.observe(glyphSlide);
    return () => observer.disconnect();
  }, [heroSide, hasGlyphPair]);

  useEffect(() => {
    if (!hasGlyphPair || didRunHintRef.current) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof profileSlideRef.current?.animate !== "function") return;
    didRunHintRef.current = true;

    const heroHint = profileSlideRef.current.animate(
      [
        { transform: "translate3d(0, 0, 0)" },
        { transform: "translate3d(0, 0, 0)", offset: 0.48 },
        { transform: "translate3d(-4px, 0, 0)", offset: 0.64 },
        { transform: "translate3d(2px, 0, 0)", offset: 0.8 },
        { transform: "translate3d(0, 0, 0)" },
      ],
      {
        duration: 1150,
        delay: 350,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
    const iconHint = swipeIconRef.current?.animate(
      [
        { transform: "translate3d(0, 0, 0)" },
        { transform: "translate3d(0, 0, 0)", offset: 0.48 },
        { transform: "translate3d(-3px, 0, 0)", offset: 0.64 },
        { transform: "translate3d(3px, 0, 0)", offset: 0.8 },
        { transform: "translate3d(0, 0, 0)" },
      ],
      {
        duration: 1150,
        delay: 350,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
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

  const settleSwipe = (
    nextSide: "profile" | "glyph",
    offset: number,
    velocityX = 0,
  ) => {
    if (isSwitchingRef.current) return;
    isSwitchingRef.current = true;
    hintAnimationsRef.current.forEach((animation) => animation.cancel());
    hintAnimationsRef.current = [];

    const frame = swipeFrameRef.current;
    const profileSlide = profileSlideRef.current;
    const glyphSlide = glyphSlideRef.current;
    const width = slideWidthRef.current || frame?.clientWidth || 1;
    const travel = width + SWIPE_CARD_GAP;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (
      !frame
      || !profileSlide
      || !glyphSlide
      || typeof profileSlide.animate !== "function"
      || typeof glyphSlide.animate !== "function"
      || typeof frame.animate !== "function"
      || reduceMotion
    ) {
      setHeroSide(nextSide);
      setSlidePositions(nextSide);
      setFrameHeight(slideHeightsRef.current[nextSide]);
      if (profileSlide) profileSlide.inert = nextSide !== "profile";
      if (glyphSlide) glyphSlide.inert = nextSide !== "glyph";
      isSwitchingRef.current = false;
      return;
    }

    transitionAnimationsRef.current.forEach((animation) => animation.cancel());
    const currentProfileX = heroSide === "profile" ? offset : -travel + offset;
    const currentGlyphX = heroSide === "profile" ? travel + offset : offset;
    const targetProfileX = nextSide === "profile" ? 0 : -travel;
    const targetGlyphX = nextSide === "profile" ? travel : 0;
    const remaining = Math.abs(targetProfileX - currentProfileX) / travel;
    const duration = Math.round(Math.max(140, Math.min(230, 225 * remaining - Math.abs(velocityX) * 55)));
    const easing = nextSide === heroSide
      ? "cubic-bezier(0.2, 0.85, 0.25, 1)"
      : "cubic-bezier(0.16, 0.82, 0.2, 1)";

    const profileAnimation = profileSlide.animate(
      [
        { transform: `translate3d(${currentProfileX}px, 0, 0)` },
        { transform: `translate3d(${targetProfileX}px, 0, 0)` },
      ],
      { duration, easing, fill: "forwards" },
    );
    const glyphAnimation = glyphSlide.animate(
      [
        { transform: `translate3d(${currentGlyphX}px, 0, 0)` },
        { transform: `translate3d(${targetGlyphX}px, 0, 0)` },
      ],
      { duration, easing, fill: "forwards" },
    );
    const heightAnimations: Animation[] = [];
    const heightDelta = Math.abs(slideHeightsRef.current[nextSide] - frame.getBoundingClientRect().height);
    if (heightDelta > 0.5) {
      heightAnimations.push(frame.animate(
        [
          { height: `${frame.getBoundingClientRect().height}px` },
          { height: `${slideHeightsRef.current[nextSide]}px` },
        ],
        { duration, easing, fill: "forwards" },
      ));
    }
    transitionAnimationsRef.current = [profileAnimation, glyphAnimation, ...heightAnimations];

    let transitionFinished = false;
    const finishTransition = () => {
      if (transitionFinished) return;
      transitionFinished = true;
      profileSlide.style.transform = `translate3d(${targetProfileX}px, 0, 0)`;
      glyphSlide.style.transform = `translate3d(${targetGlyphX}px, 0, 0)`;
      frame.style.height = `${slideHeightsRef.current[nextSide]}px`;
      transitionAnimationsRef.current.forEach((animation) => animation.cancel());
      transitionAnimationsRef.current = [];
      swipeOffsetRef.current = 0;
      profileSlide.inert = nextSide !== "profile";
      glyphSlide.inert = nextSide !== "glyph";
      setHeroSide(nextSide);
      isSwitchingRef.current = false;
    };
    profileAnimation.addEventListener("finish", finishTransition, { once: true });
    if (typeof profileAnimation.addEventListener !== "function") finishTransition();
  };

  const handleSwipeSwitch = (requestedSide?: "profile" | "glyph") => {
    const nextSide = requestedSide ?? (heroSide === "profile" ? "glyph" : "profile");
    if (nextSide === heroSide) return;
    settleSwipe(nextSide, 0);
  };

  const handleSwipeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isSwitchingRef.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    const target = event.target as Element;
    if (target.closest("button, a, input, select, textarea")) return;
    hintAnimationsRef.current.forEach((animation) => animation.cancel());
    hintAnimationsRef.current = [];
    swipeOffsetRef.current = 0;
    const now = performance.now();
    swipeStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastTime: now,
      velocityX: 0,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleSwipeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    if (!start || start.pointerId !== event.pointerId || isSwitchingRef.current) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

    const movingTowardOtherSide = heroSide === "profile" ? deltaX < 0 : deltaX > 0;
    const offset = movingTowardOtherSide ? deltaX : deltaX * 0.18;
    const now = performance.now();
    const elapsed = Math.max(1, now - start.lastTime);
    start.velocityX = start.velocityX * 0.55 + ((event.clientX - start.lastX) / elapsed) * 0.45;
    start.lastX = event.clientX;
    start.lastTime = now;
    swipeOffsetRef.current = offset;
    setSlidePositions(heroSide, offset);

  };

  const handleSwipeEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || start.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const width = slideWidthRef.current || swipeFrameRef.current?.clientWidth || 1;
    const movingTowardOtherSide = heroSide === "profile" ? deltaX < 0 : deltaX > 0;
    const distancePass = Math.abs(deltaX) > Math.min(88, width * 0.22);
    const velocityPass = Math.abs(start.velocityX) > 0.42 && Math.abs(deltaX) > 18;
    const shouldCommit = movingTowardOtherSide
      && Math.abs(deltaX) > Math.abs(deltaY) * 1.15
      && (distancePass || velocityPass);
    const nextSide = shouldCommit
      ? (heroSide === "profile" ? "glyph" : "profile")
      : heroSide;
    settleSwipe(nextSide, swipeOffsetRef.current, start.velocityX);
  };

  const handleSwipeCancel = () => {
    const hadActiveSwipe = Boolean(swipeStartRef.current);
    swipeStartRef.current = null;
    if (!hadActiveSwipe || Math.abs(swipeOffsetRef.current) < 0.5) {
      swipeOffsetRef.current = 0;
      setSlidePositions(heroSide);
      setFrameHeight(slideHeightsRef.current[heroSide]);
      return;
    }
    settleSwipe(heroSide, swipeOffsetRef.current);
  };

  useEffect(() => () => {
    transitionAnimationsRef.current.forEach((animation) => animation.cancel());
    transitionAnimationsRef.current = [];
  }, []);

  const swipeControl = glyphPair ? (
    <button
      type="button"
      aria-pressed={showingGlyph}
      aria-label={t(
        showingGlyph ? "results.heroGlyphBackA11y" : "results.heroGlyphOpenA11y",
        locale,
      )}
      onClick={() => handleSwipeSwitch()}
      className="group absolute right-3 top-3 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-[var(--color-surface-self-accent-soft)] text-[var(--color-accent-self-deep)] shadow-[var(--ui-shadow-lg)] transition hover:bg-[var(--color-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-sage-dark md:right-0 md:top-1/2 md:min-h-[132px] md:w-11 md:-translate-y-1/2 md:flex-col md:gap-2 md:rounded-l-xl md:rounded-r-none md:border-r-0 md:px-2"
    >
      <svg
        ref={swipeIconRef}
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5 transition-transform duration-[var(--motion-duration-base)] group-hover:scale-105 motion-reduce:transition-none"
      >
        <path
          d="M8.5 7.5 4 12l4.5 4.5M15.5 7.5 20 12l-4.5 4.5M5 12h14"
          stroke="currentColor"
          strokeWidth="1.7"
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
    <div className="relative isolate">
      <div
        ref={swipeFrameRef}
        data-profile-swipe-frame
        className="relative overflow-hidden rounded-[28px]"
        onPointerDown={handleSwipeStart}
        onPointerMove={handleSwipeMove}
        onPointerUp={handleSwipeEnd}
        onPointerCancel={handleSwipeCancel}
        style={{ height: `${HERO_CARD_HEIGHT}px`, touchAction: "pan-y" }}
      >
        <div
          ref={profileSlideRef}
          data-profile-swipe-motion
          aria-hidden={showingGlyph}
          className="absolute inset-x-0 top-0 z-0 h-[330px] will-change-transform"
          style={{ transform: showingGlyph ? "translate3d(calc(-100% - 12px), 0, 0)" : "translate3d(0, 0, 0)" }}
        >
          <SurfaceHero
            variant="self"
            className={glyphPair ? "h-[330px]" : undefined}
            contentClassName="mx-auto max-w-4xl px-5 pb-[25px] pt-[27px] md:flex md:h-full md:flex-col md:justify-center md:!py-0 md:!px-9"
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
        </div>

        {glyphPair ? (
          <div
            ref={glyphSlideRef}
            data-profile-glyph-slide
            aria-hidden={!showingGlyph}
            className="absolute inset-x-0 top-0 z-0 h-[330px] will-change-transform"
            style={{ transform: showingGlyph ? "translate3d(0, 0, 0)" : "translate3d(calc(100% + 12px), 0, 0)" }}
          >
          <SurfaceHero
            variant="self"
            className="h-[330px]"
            contentClassName="mx-auto max-w-4xl !px-4 !pb-7 !pt-7 md:flex md:h-full md:flex-col md:justify-center md:!px-9 md:!py-0"
            titleClassName="md:!mt-0"
            title={(
              <div
                id="profile-hero-glyph-side"
                className="grid h-[244px] translate-y-[7px] grid-cols-[112px_minmax(0,1fr)] items-center gap-3 md:h-auto md:min-h-[224px] md:translate-y-0 md:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.1fr)] md:gap-9"
              >
                <div className="flex h-[188px] items-center justify-center overflow-hidden rounded-[18px] border border-white/15 bg-[var(--color-layer-self-soft)] p-1.5 md:h-auto md:min-h-[252px] md:rounded-[20px] md:p-3">
                  <TypeGlyph
                    primaryCode={glyphPair.primaryCode}
                    secondaryCode={glyphPair.secondaryCode}
                    typeLabel={personalityType}
                    locale={locale === "hu" ? "hu" : "en"}
                    intensity={glyphPair.intensity}
                    secondaryUncertain={glyphUncertain}
                    variant="card"
                    canvas={false}
                    className="max-h-[176px] w-full rounded-xl object-contain md:max-h-[252px]"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">
                    {t("results.heroGlyphEyebrow", locale)}
                  </p>
                  <h1 className="mt-1.5 break-words font-fraunces text-[27px] leading-none tracking-tight text-[var(--color-text-on-inverse)] md:mt-2 md:text-[46px]">
                    {personalityType}
                  </h1>
                  <p className="mt-2 font-fraunces text-[14px] leading-snug italic text-[var(--color-accent-primary-soft)] md:mt-4 md:text-[20px]">
                    {glyphPairLabel}
                  </p>
                  <p className="mt-2 max-w-[420px] text-[11px] leading-[1.45] text-[var(--color-text-on-inverse-muted)] md:mt-3 md:text-[14px] md:leading-relaxed">
                    {glyphGrammar}
                  </p>
                </div>
              </div>
            )}
          />
          </div>
        ) : null}
        </div>

      {swipeControl}
    </div>
  );
}
