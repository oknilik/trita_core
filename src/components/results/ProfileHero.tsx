"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { SuccessCheck } from "@/components/ui/primitives/SuccessCheck";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";
import { ShareIcon, DocumentIcon } from "@/components/ui/icons";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import { resolveGlyphPair } from "@/lib/type-glyph";
import { isSecondaryUncertain } from "@/lib/personality-type";
import { SELF_PAYWALL_ENABLED } from "@/lib/operating-mode";

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
  const level = LEVEL_CONFIG[accessLevel];
  const selfTheme = SURFACE_HERO_THEME.self;

  return (
    <SurfaceHero
      variant="self"
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
        // A monogram-avatár helyén a típus-ábra áll (2026-07-30): a fejlécben
        // egyetlen kép van, és az a profilról szól, nem a névkezdőbetűről.
        // A dátum a névvel egy blokkban marad, hogy az ábra a teljes
        // név-blokk magasságát kiadja (64 px).
        <div className="mb-0.5 flex items-center gap-4">
          {glyphPair && (
            <TypeGlyph
              primaryCode={glyphPair.primaryCode}
              secondaryCode={glyphPair.secondaryCode}
              typeLabel={personalityType}
              locale={locale === "hu" ? "hu" : "en"}
              intensity={glyphPair.intensity}
              secondaryUncertain={glyphUncertain}
              variant="badge"
              className="h-14 w-14 shrink-0 rounded-xl border border-white/20 md:h-16 md:w-16"
            />
          )}
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
          {/* A típusnév mellől az ábra kikerült — a fejlécben egy ábra van,
              a név mellett. A jelentését a hero alatti tábla adja. Az
              ál-percentilis badge végleg kivezetve (B17) — valós norma-
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
  );
}
