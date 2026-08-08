"use client";

import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { TypeGlyph } from "@/components/type/TypeGlyph";

export interface TeaserTopDim {
  code: string;
  letter: string;
  label: string;
  score: number;
}

interface TryTeaserCardProps {
  typeLabel: string;
  primaryCode: string;
  secondaryCode: string;
  intensity: number;
  dimensionLabel: string;
  topDims: TeaserTopDim[];
  locale: Locale;
}

/**
 * A vendég-teszt záróoldalának eredmény-ízelítője: a kitöltő saját
 * típus-ábrája + archetípus-neve + a két legerősebb dimenzió chipje.
 * Szándékosan csak ízelítő — a teljes riport (facettek, munkastílus,
 * megosztás) a claim után, a fiókban nyílik meg. Prezentációs komponens:
 * minden adatot propként kap, így önmagában tesztelhető.
 */
export function TryTeaserCard({
  typeLabel,
  primaryCode,
  secondaryCode,
  intensity,
  dimensionLabel,
  topDims,
  locale,
}: TryTeaserCardProps) {
  return (
    <section
      data-testid="try-teaser-card"
      className="rounded-[22px] border border-sand bg-surface-card p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5"
    >
      <SectionEyebrow tone="muted">
        {t("tryComplete.teaserEyebrow", locale)}
      </SectionEyebrow>

      <div className="mt-3">
        <TypeGlyph
          primaryCode={primaryCode}
          secondaryCode={secondaryCode}
          typeLabel={typeLabel}
          dimensionLabel={dimensionLabel}
          locale={locale === "hu" ? "hu" : "en"}
          intensity={intensity}
          variant="hero"
          canvas={false}
        />
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
          {t("tryComplete.teaserTopDims", locale)}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {topDims.map((dim) => (
            <span
              key={dim.code}
              className="inline-flex items-center gap-1.5 rounded-full border border-sand bg-cream/60 px-2.5 py-1 text-[12px] text-ink-body"
            >
              <span className="font-semibold text-ink">{dim.letter}</span>
              {dim.label}
              <span className="font-semibold text-[var(--color-accent-primary-strong)]">{dim.score}%</span>
            </span>
          ))}
        </div>
      </div>

      <p className="mt-4 text-caption leading-relaxed text-ink-body">
        {t("tryComplete.teaserHint", locale)}
      </p>
    </section>
  );
}
