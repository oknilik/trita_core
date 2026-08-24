"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { CompareInviteCard, type SerializedCompareInvite } from "@/components/results/CompareInviteCard";
import { InteractionSection } from "@/components/results/InteractionSection";
import type { ArchetypeSimulationView } from "@/lib/interaction-view";

type ComparisonRoute = "real" | "type";

interface InteractionComparisonChooserProps {
  invites: SerializedCompareInvite[];
  simulations: ArchetypeSimulationView[];
  selfLabel?: string;
  selfGlyph?: { primaryCode: string; secondaryCode: string; intensity: number };
  initialRoute?: ComparisonRoute;
}

function PeopleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.25" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M14 14.5a4.5 4.5 0 0 1 6.5 4" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z" />
      <path d="M18.5 16.5c.25 1.5 1 2.25 2.5 2.5-1.5.25-2.25 1-2.5 2.5-.25-1.5-1-2.25-2.5-2.5 1.5-.25 2.25-1 2.5-2.5Z" />
    </svg>
  );
}

export function InteractionComparisonChooser({
  invites,
  simulations,
  selfLabel,
  selfGlyph,
  initialRoute,
}: InteractionComparisonChooserProps) {
  const { locale } = useLocale();
  // A default az ADAT alapján dől el, nem elvi sorrend szerint: akinek van
  // elfogadott párja, annak a valódi út a jutalom; akinek nincs, annak a
  // „valódi" út egy üres lista lenne, miközben a karakter-út azonnal
  // használható. Az elvi sorrend (valódi > típus) a kártyák sorrendjében
  // marad meg.
  const hasAcceptedInvite = invites.some((inv) => inv.state === "ACCEPTED");
  const [route, setRoute] = useState<ComparisonRoute>(
    initialRoute ?? (hasAcceptedInvite ? "real" : "type"),
  );

  const choices: Array<{
    id: ComparisonRoute;
    title: string;
    body: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "real",
      title: t("results.compareChooserRealTitle", locale),
      body: t("results.compareChooserRealBody", locale),
      icon: <PeopleIcon />,
    },
    {
      id: "type",
      title: t("results.compareChooserTypeTitle", locale),
      body: t("results.compareChooserTypeBody", locale),
      icon: <SparkIcon />,
    },
  ];

  return (
    <section>
      <div className="relative overflow-hidden rounded-[22px] border border-[var(--color-border-soft)] bg-[var(--color-surface-inverse)] px-4 pb-16 pt-7 shadow-[var(--ui-shadow-md)] sm:px-7 sm:pb-20 sm:pt-9">
        <span
          aria-hidden="true"
          className="absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[var(--color-action-primary-bg)]/15 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="absolute right-5 top-5 h-px w-14 bg-[var(--color-accent-primary)]/60"
        />

        <div className="relative">
          <p className="text-label uppercase text-[var(--color-accent-primary)]">
            {t("results.compareChooserEyebrow", locale)}
          </p>
          <h2 className="mt-2 font-fraunces text-title leading-tight text-[var(--color-text-on-inverse)] sm:text-display">
            {t("results.compareChooserTitle", locale)}
          </h2>
          <p className="mt-2 max-w-xl text-caption leading-relaxed text-[var(--color-text-on-inverse-muted)]">
            {t("results.compareChooserBody", locale)}
          </p>
        </div>

        <div
          role="group"
          aria-label={t("results.compareChooserTitle", locale)}
          className="relative mt-6 grid gap-3 sm:grid-cols-2"
        >
          {choices.map((choice) => {
            const selected = route === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setRoute(choice.id)}
                className={`grid min-h-[112px] grid-cols-[44px_minmax(0,1fr)_28px] items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  selected
                    ? "border-[var(--color-border-default)] bg-surface-card text-[var(--color-text-primary)] shadow-[var(--ui-shadow-sm)]"
                    : "border-[var(--color-text-on-inverse-muted)]/25 bg-[var(--color-text-on-inverse)]/[0.05] text-[var(--color-text-on-inverse)] hover:bg-[var(--color-text-on-inverse)]/[0.09]"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    selected
                      ? "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]"
                      : "bg-[var(--color-text-on-inverse)]/[0.08] text-[var(--color-accent-primary)]"
                  }`}
                >
                  {choice.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-fraunces text-heading leading-snug sm:text-heading">
                    {choice.title}
                  </span>
                  <span
                    className={`mt-1 block text-micro leading-relaxed ${
                      selected
                        ? "text-[var(--color-text-secondary)]"
                        : "text-[var(--color-text-on-inverse-muted)]"
                    }`}
                  >
                    {choice.body}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-caption ${
                    selected
                      ? "border-[var(--color-accent-primary-strong)] bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]"
                      : "border-[var(--color-text-on-inverse-muted)]/30 text-[var(--color-accent-primary)]"
                  }`}
                >
                  {selected ? "✓" : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mx-3 -mt-10 rounded-[22px] border border-[var(--color-border-default)] bg-surface-card p-4 shadow-[var(--ui-shadow-md)] sm:mx-8 sm:-mt-12 sm:p-6">
        {route === "real" ? (
          <CompareInviteCard invites={invites} />
        ) : (
          <div>
            <div className="mb-5">
              <h2 className="font-fraunces text-title leading-tight text-[var(--color-text-primary)] sm:text-title">
                {t("results.compareTypePickerTitle", locale)}
              </h2>
              <p className="mt-1 text-caption text-[var(--color-text-muted)]">
                {t("results.compareTypePickerBody", locale)}
              </p>
            </div>
            <InteractionSection
              simulations={simulations}
              selfLabel={selfLabel}
              selfGlyph={selfGlyph}
              hideHeader
            />
          </div>
        )}
      </div>
    </section>
  );
}
