"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { SelectField } from "@/components/ui/primitives/SelectField";
import { DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";
import { TRITAN_DIMENSIONS, TRITAN_ORDER, type TritanDimCode } from "@/lib/tritan";
import {
  archetypeKey,
  type ArchetypeSimulationView,
  type InteractionTextLine,
} from "@/lib/interaction-view";

interface InteractionSectionProps {
  /** Mind a 30 archetípus, a SZERVEREN kiszámolva, a kért nyelven. */
  simulations: ArchetypeSimulationView[];
}

/** Blokk-kártya — a HowYouWorkSection kártya-nyelvét követi. */
function Block({
  title,
  lines,
  tone,
}: {
  title: string;
  lines: InteractionTextLine[];
  tone: "easy" | "friction" | "discuss";
}) {
  if (lines.length === 0) return null;

  const styles = {
    easy: {
      wrapper:
        "border-[var(--color-action-primary-bg)]/20 bg-[var(--color-surface-self-accent-soft)]",
      label: "text-[var(--color-accent-self-deep)]",
      body: "text-[var(--color-accent-self-deep)]",
    },
    friction: {
      wrapper:
        "border-[var(--color-accent-primary)]/20 bg-[var(--color-surface-highlight-warm)]",
      label: "text-[var(--color-accent-primary-strong)]",
      body: "text-[var(--color-text-secondary)]",
    },
    discuss: {
      wrapper: "border-[var(--color-border-soft)] bg-white",
      label: "text-[var(--color-text-muted)]",
      body: "text-[var(--color-text-secondary)]",
    },
  }[tone];

  return (
    <div className={`rounded-xl border-[1.5px] p-[18px] ${styles.wrapper}`}>
      <p
        className={`mb-2 text-micro font-bold uppercase tracking-wide ${styles.label}`}
      >
        {title}
      </p>
      <ul className="flex flex-col gap-2.5">
        {lines.map((line) => (
          <li key={line.atomId} className="max-w-prose">
            <p className={`text-body ${styles.body}`}>{line.text}</p>
            <p className="mt-1 text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
              {line.dimLabels.join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InteractionSection({ simulations }: InteractionSectionProps) {
  const { locale } = useLocale();

  const byKey = useMemo(
    () => new Map(simulations.map((sim) => [sim.key, sim])),
    [simulations],
  );

  // Alapértelmezés: az első olyan archetípus, amelyik tényleg mond valamit.
  // Üres állapottal indulni azt sugallná, hogy a funkció nem működik.
  const initial = useMemo(
    () => simulations.find((sim) => !sim.sparse) ?? simulations[0],
    [simulations],
  );

  const [dominant, setDominant] = useState<TritanDimCode>(
    initial?.dominant ?? "OPEN",
  );
  const [secondary, setSecondary] = useState<TritanDimCode>(
    initial?.secondary ?? "TEMP",
  );
  const [leaderMode, setLeaderMode] = useState(false);

  if (simulations.length === 0) return null;

  const secondaryOptions = TRITAN_ORDER.filter((dim) => dim !== dominant);

  const handleDominantChange = (next: TritanDimCode) => {
    setDominant(next);
    // A két dimenzió nem eshet egybe — ilyenkor a másodikat léptetjük.
    if (next === secondary) {
      setSecondary(TRITAN_ORDER.find((dim) => dim !== next) ?? secondary);
    }
  };

  const current = byKey.get(archetypeKey(dominant, secondary));
  const dimName = (dim: TritanDimCode) =>
    locale === "hu" ? TRITAN_DIMENSIONS[dim].hu : TRITAN_DIMENSIONS[dim].en;

  return (
    <section>
      <DashboardSectionHeader
        label={t("results.sectionInteraction", locale)}
        className="mb-4"
      />
      <p className="mb-5 max-w-prose text-body text-[var(--color-text-secondary)]">
        {t("results.interactionIntro", locale)}
      </p>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <SelectField
          label={t("results.interactionPickDominant", locale)}
          value={dominant}
          onChange={(event) =>
            handleDominantChange(event.target.value as TritanDimCode)
          }
        >
          {TRITAN_ORDER.map((dim) => (
            <option key={dim} value={dim}>
              {dimName(dim)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t("results.interactionPickSecondary", locale)}
          value={secondary}
          onChange={(event) =>
            setSecondary(event.target.value as TritanDimCode)
          }
        >
          {secondaryOptions.map((dim) => (
            <option key={dim} value={dim}>
              {dimName(dim)}
            </option>
          ))}
        </SelectField>
      </div>

      {current && (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <p className="font-fraunces text-lg text-[var(--color-text-primary)]">
              {current.label}
            </p>
            <button
              type="button"
              onClick={() => setLeaderMode((value) => !value)}
              aria-pressed={leaderMode}
              className={`min-h-[44px] rounded-full border px-4 text-sm transition ${
                leaderMode
                  ? "border-[var(--color-action-primary-bg)] bg-[var(--color-surface-self-accent-soft)] text-[var(--color-accent-self-deep)]"
                  : "border-[var(--color-border-soft)] text-[var(--color-text-secondary)]"
              }`}
            >
              {t("results.interactionLeaderToggle", locale)}
            </button>
          </div>

          {current.sparse ? (
            <div className="rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-white p-[18px]">
              <p className="max-w-prose text-body text-[var(--color-text-secondary)]">
                {t("results.interactionSparse", locale)}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Block
                title={t("results.interactionEasy", locale)}
                lines={current.easy}
                tone="easy"
              />
              <Block
                title={t("results.interactionFriction", locale)}
                lines={current.friction}
                tone="friction"
              />
              <div className="md:col-span-2">
                <Block
                  title={t("results.interactionDiscuss", locale)}
                  lines={current.discuss}
                  tone="discuss"
                />
              </div>
            </div>
          )}

          {leaderMode && current.leaderNotes.length > 0 && (
            <div className="mt-3 rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-[var(--color-surface-highlight-warm)] p-[18px]">
              <p className="mb-2 text-micro font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                {t("results.interactionLeaderTitle", locale)}
              </p>
              <ul className="flex flex-col gap-2.5">
                {current.leaderNotes.map((note) => (
                  <li key={note.dim} className="max-w-prose">
                    <p className="text-body text-[var(--color-text-secondary)]">
                      {note.text}
                    </p>
                    <p className="mt-1 text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
                      {note.dimLabel}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <p className="mt-4 max-w-prose text-caption text-[var(--color-text-muted)]">
        {t("results.interactionSourceNote", locale)}
      </p>
    </section>
  );
}
