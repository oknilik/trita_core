import Link from "next/link";
import type { CSSProperties } from "react";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { t, tf, type Locale } from "@/lib/i18n";
import { resolveGlyphPair } from "@/lib/type-glyph";

export interface InteractionEntryGlyph {
  primaryCode: string;
  secondaryCode: string;
  intensity: number;
  label: string;
}

export type InteractionEntryPreview =
  | { state: "new" }
  | { state: "pending"; otherName: string | null }
  | {
      state: "ready";
      otherName: string | null;
      pairId: string;
      otherGlyph: InteractionEntryGlyph | null;
    };

interface InteractionEntryCardProps {
  dimensions: Array<{ code: string; score: number }>;
  personalityType: string;
  preview: InteractionEntryPreview;
  locale: Locale;
}

/** A glyph világos vonalrendszert kap a mindkét témában sötét kártyán. */
const GLYPH_TOKENS = {
  "--color-ink": "var(--color-text-on-inverse)",
  "--color-sage": "var(--color-sage-300)",
} as CSSProperties;

function PartnerPlaceholder() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 100"
      className="h-full w-full text-[var(--color-accent-primary)]"
      fill="none"
    >
      <circle cx="51" cy="46" r="23" fill="currentColor" fillOpacity="0.42" />
      <circle cx="73" cy="58" r="18" stroke="currentColor" strokeWidth="3" />
      <path d="M45 46h12M51 40v12" stroke="var(--color-text-on-inverse)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="73" cy="58" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function InteractionEntryCard({
  dimensions,
  personalityType,
  preview,
  locale,
}: InteractionEntryCardProps) {
  const selfGlyph = resolveGlyphPair(dimensions);
  const otherName = preview.state === "new"
    ? t("results.interactionEntrySomeone", locale)
    : preview.otherName ?? t("results.interactionEntrySomeone", locale);

  const copy = preview.state === "ready"
    ? {
        status: tf("results.interactionEntryReadyStatus", locale, { name: otherName }),
        title: t("results.interactionEntryReadyTitle", locale),
        body: tf("results.interactionEntryReadyBody", locale, { name: otherName }),
        primary: t("results.interactionEntryReadyPrimary", locale),
        primaryHref: `/interaction?pair=${encodeURIComponent(preview.pairId)}`,
        secondary: t("results.interactionEntryReadySecondary", locale),
        secondaryHref: "/interaction",
      }
    : preview.state === "pending"
      ? {
          status: tf("results.interactionEntryPendingStatus", locale, { name: otherName }),
          title: t("results.interactionEntryPendingTitle", locale),
          body: tf("results.interactionEntryPendingBody", locale, { name: otherName }),
          primary: t("results.interactionEntryPendingPrimary", locale),
          primaryHref: "/interaction?mode=real",
          secondary: t("results.interactionEntryPendingSecondary", locale),
          secondaryHref: "/interaction?mode=type",
        }
      : {
          status: null,
          title: t("results.interactionEntryNewTitle", locale),
          body: t("results.interactionEntryNewBody", locale),
          primary: t("results.interactionEntryNewPrimary", locale),
          primaryHref: "/interaction?mode=real",
          secondary: t("results.interactionEntryNewSecondary", locale),
          secondaryHref: "/interaction?mode=type",
        };

  return (
    <section
      aria-labelledby="interaction-entry-heading"
      className="relative overflow-hidden rounded-[20px] border border-[var(--color-accent-primary)]/35 bg-[var(--color-surface-inverse)] p-6 text-[var(--color-text-on-inverse)] shadow-[var(--ui-shadow-md)] md:p-7"
    >
      <span
        aria-hidden="true"
        className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[var(--color-action-primary-bg)]/10 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="absolute right-5 top-5 h-px w-14 bg-[var(--color-accent-primary)]/65"
      />

      <div className="relative grid gap-7 md:grid-cols-[minmax(0,1.15fr)_minmax(220px,0.85fr)] md:items-center">
        <div>
          <p className="text-label uppercase text-[var(--color-accent-primary)]">
            {t("results.interactionEntryEyebrow", locale)}
          </p>

          {copy.status ? (
            <p className="mt-3 flex items-center gap-2 text-micro font-semibold text-[var(--color-text-on-inverse-muted)]">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  preview.state === "ready"
                    ? "bg-[var(--color-sage-300)]"
                    : "bg-[var(--color-accent-primary)]"
                }`}
              />
              {copy.status}
            </p>
          ) : null}

          <h2
            id="interaction-entry-heading"
            className="mt-2 max-w-xl font-fraunces text-heading leading-tight text-[var(--color-text-on-inverse)] md:text-title"
          >
            {copy.title}
          </h2>
          <p className="mt-3 max-w-xl text-caption leading-relaxed text-[var(--color-text-on-inverse-muted)]">
            {copy.body}
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={copy.primaryHref}
              className={getButtonClassName({
                size: "md",
                onInverse: true,
                className: "rounded-xl sm:w-auto",
              })}
              style={{
                backgroundColor:
                  preview.state === "ready"
                    ? "var(--color-sage-300)"
                    : "var(--color-accent-primary)",
                color: "var(--color-surface-inverse)",
              }}
            >
              {copy.primary}
            </Link>
            <Link
              href={copy.secondaryHref}
              className={getButtonClassName({
                variant: "secondary",
                size: "md",
                onInverse: true,
                className: "rounded-xl sm:w-auto",
              })}
            >
              {copy.secondary}
            </Link>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="grid grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)] items-center gap-1"
        >
          <div className="min-w-0 text-center">
            <div className="mx-auto flex h-24 max-w-32 items-center justify-center" style={GLYPH_TOKENS}>
              {selfGlyph ? (
                <TypeGlyph
                  primaryCode={selfGlyph.primaryCode}
                  secondaryCode={selfGlyph.secondaryCode}
                  typeLabel={personalityType}
                  locale={locale === "hu" ? "hu" : "en"}
                  intensity={selfGlyph.intensity}
                  variant="card"
                  canvas={false}
                  className="h-full w-full"
                />
              ) : null}
            </div>
            <p className="mt-1 text-micro font-semibold uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">
              {t("results.interactionPairYou", locale)}
            </p>
          </div>

          <span className="text-center font-fraunces text-heading text-[var(--color-accent-primary)]">×</span>

          <div className={`min-w-0 text-center ${preview.state === "new" ? "opacity-50" : ""}`}>
            <div className="mx-auto flex h-24 max-w-32 items-center justify-center" style={GLYPH_TOKENS}>
              {preview.state === "ready" && preview.otherGlyph ? (
                <TypeGlyph
                  primaryCode={preview.otherGlyph.primaryCode}
                  secondaryCode={preview.otherGlyph.secondaryCode}
                  typeLabel={preview.otherGlyph.label}
                  locale={locale === "hu" ? "hu" : "en"}
                  intensity={preview.otherGlyph.intensity}
                  variant="card"
                  canvas={false}
                  className="h-full w-full"
                />
              ) : (
                <PartnerPlaceholder />
              )}
            </div>
            <p className="mt-1 truncate text-micro font-semibold uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">
              {otherName}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
