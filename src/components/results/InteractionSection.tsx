"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";
import { TRITAN_ORDER, type TritanDimCode } from "@/lib/tritan";
import {
  personalityAdjective,
  personalityNoun,
} from "@/lib/personality-type";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import { ArchetypePicker } from "@/components/results/ArchetypePicker";
import {
  archetypeKey,
  type ArchetypeSimulationView,
  type InteractionTextLine,
} from "@/lib/interaction-view";

interface InteractionSectionProps {
  /** Mind a 30 archetípus, a SZERVEREN kiszámolva, a kért nyelven. */
  simulations: ArchetypeSimulationView[];
  /**
   * A felhasználó SAJÁT típuscímkéje („Módszeres hídépítő") — a páros-fejléchez.
   * Ugyanabból a forrásból jön, mint a profil fejléce (`personality-type.ts`),
   * így a két oldal garantáltan azonos szókincsű. Hiányában a fejléc csak a
   * választott típust mutatja.
   */
  selfLabel?: string;
  /**
   * A felhasználó SAJÁT ábra-párja (legerősebb + második dimenzió) és
   * intenzitása. Enélkül a bal oldali kártya ábra nélkül marad — a
   * névösszeállítás akkor is látszik.
   */
  selfGlyph?: { primaryCode: string; secondaryCode: string; intensity: number };
  /**
   * Önálló oldalon (`/interaction`) a lap saját címe és bevezetője áll a
   * szekció felett — ilyenkor a belső fejléc duplikáció lenne.
   */
  hideHeader?: boolean;
}

/**
 * Egy fél az összehasonlításban: ábra + típusnév + a névösszeállítás
 * kimondva („Energikus” + „újító”).
 *
 * Miért kell kimondani: a felhasználó a saját profilján egy KÉSZ nevet lát
 * („Módszeres újító”), itt viszont két dimenziót választ. Ha nem mutatjuk meg,
 * melyik választás melyik szótagot adja, úgy tűnik, mintha más nevezéktan
 * lenne a két felületen.
 */
function ComparisonSide({
  eyebrow,
  label,
  glyph,
  nounPart,
  adjectivePart,
  locale,
  highlight,
}: {
  eyebrow: string;
  label: string;
  glyph?: { primaryCode: string; secondaryCode: string; intensity: number };
  nounPart?: string | null;
  adjectivePart?: string | null;
  locale: "hu" | "en";
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 items-center gap-3.5 rounded-xl border-[1.5px] p-4 ${
        highlight
          ? "border-[var(--color-action-primary-bg)]/25 bg-[var(--color-surface-self-accent-soft)]"
          : "border-[var(--color-border-soft)] bg-white"
      }`}
    >
      {glyph && (
        <TypeGlyph
          primaryCode={glyph.primaryCode}
          secondaryCode={glyph.secondaryCode}
          typeLabel={label}
          locale={locale}
          intensity={glyph.intensity}
          variant="badge"
          className="h-14 w-14 shrink-0 rounded-xl border border-[var(--color-border-soft)] bg-white md:h-16 md:w-16"
        />
      )}
      <div className="min-w-0">
        <p className="text-micro font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          {eyebrow}
        </p>
        <p className="mt-0.5 break-words font-fraunces text-[17px] leading-snug text-[var(--color-text-primary)] md:text-[19px]">
          {label}
        </p>
        {(adjectivePart || nounPart) && (
          <p className="mt-1 text-micro text-[var(--color-text-muted)]">
            {[adjectivePart, nounPart].filter(Boolean).join(" + ")}
          </p>
        )}
      </div>
    </div>
  );
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

export function InteractionSection({
  simulations,
  selfLabel,
  selfGlyph,
  hideHeader = false,
}: InteractionSectionProps) {
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

  const handleDominantChange = (next: TritanDimCode) => {
    setDominant(next);
    // A két dimenzió nem eshet egybe — ilyenkor a másodikat léptetjük.
    if (next === secondary) {
      setSecondary(TRITAN_ORDER.find((dim) => dim !== next) ?? secondary);
    }
  };

  const current = byKey.get(archetypeKey(dominant, secondary));

  return (
    <section>
      {!hideHeader && (
        <>
          <DashboardSectionHeader
            label={t("results.sectionInteraction", locale)}
            className="mb-4"
          />
          <p className="mb-5 max-w-prose text-body text-[var(--color-text-secondary)]">
            {t("results.interactionIntro", locale)}
          </p>
        </>
      )}

      <ArchetypePicker
        dominant={dominant}
        secondary={secondary}
        onDominantChange={handleDominantChange}
        onSecondaryChange={setSecondary}
      />

      {current && (
        <>
          {/* Páros-fejléc: két ábra egymás mellett. Az összehasonlítást a KÉP
              viszi, a név alatt pedig ott a összeállítás — így látszik, hogy a
              két oldal ugyanabból a szókincsből épül. */}
          <div className="mb-4 flex flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-3">
            {selfLabel && (
              <>
                <ComparisonSide
                  eyebrow={t("results.interactionPairYou", locale)}
                  label={selfLabel}
                  glyph={selfGlyph}
                  nounPart={
                    selfGlyph ? personalityNoun(selfGlyph.primaryCode, locale) : null
                  }
                  adjectivePart={
                    selfGlyph
                      ? personalityAdjective(selfGlyph.secondaryCode, locale)
                      : null
                  }
                  locale={locale === "hu" ? "hu" : "en"}
                  highlight
                />
                <span
                  aria-hidden="true"
                  className="self-center font-fraunces text-lg text-[var(--color-text-muted)]"
                >
                  ×
                </span>
              </>
            )}
            <ComparisonSide
              eyebrow={t("results.interactionPairOther", locale)}
              label={current.label}
              glyph={{
                primaryCode: dominant,
                secondaryCode: secondary,
                // A választott típusnak nincs pontszáma — közepes intenzitás,
                // hogy az ábra ne sugalljon mért erősséget.
                intensity: 3,
              }}
              nounPart={personalityNoun(dominant, locale)}
              adjectivePart={personalityAdjective(secondary, locale)}
              locale={locale === "hu" ? "hu" : "en"}
            />
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3">
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
