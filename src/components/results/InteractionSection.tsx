"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import { DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";
import { HEXACO_DIMENSIONS, HEXACO_ORDER, type HexacoCode } from "@/lib/hexaco";
import {
  personalityAdjective,
  personalityNoun,
} from "@/lib/personality-type";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import { ArchetypePicker } from "@/components/results/ArchetypePicker";
import { InteractionDynamicPanels } from "@/components/results/InteractionDynamicPanels";
import { InteractionLeaderNotes } from "@/components/results/InteractionLeaderNotes";
import {
  RelationshipModeSelect,
  type RelationshipMode,
} from "@/components/results/RelationshipModeSelect";
import {
  archetypeKey,
  type ArchetypeSimulationView,
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
          : "border-[var(--color-border-soft)] bg-surface-card"
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
          className="h-14 w-14 shrink-0 rounded-xl border border-[var(--color-border-soft)] bg-surface-card md:h-16 md:w-16"
        />
      )}
      <div className="min-w-0">
        <p className="text-micro font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          {eyebrow}
        </p>
        <p className="mt-0.5 break-words font-fraunces text-heading leading-snug text-[var(--color-text-primary)] md:text-heading">
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

  // A belső kezdőérték csak technikai fallback. A felület nem jelöli ki és
  // nem értelmezi addig, amíg a felhasználó mindkét réteget ki nem választja.
  const initial = useMemo(
    () => simulations.find((sim) => !sim.sparse) ?? simulations[0],
    [simulations],
  );

  const [dominant, setDominant] = useState<HexacoCode>(
    initial?.dominant ?? "O",
  );
  const [secondary, setSecondary] = useState<HexacoCode>(
    initial?.secondary ?? "X",
  );
  const [dominantSelected, setDominantSelected] = useState(false);
  const [secondarySelected, setSecondarySelected] = useState(false);
  const [mode, setMode] = useState<RelationshipMode>("peer");

  if (simulations.length === 0) return null;

  const handleDominantChange = (next: HexacoCode) => {
    setDominant(next);
    setDominantSelected(true);
    setSecondarySelected(false);
    // A két dimenzió nem eshet egybe – ilyenkor a másodikat léptetjük.
    if (next === secondary) {
      setSecondary(HEXACO_ORDER.find((dim) => dim !== next) ?? secondary);
    }
  };

  const handleSecondaryChange = (next: HexacoCode) => {
    setSecondary(next);
    setSecondarySelected(true);
  };

  const current = dominantSelected && secondarySelected
    ? byKey.get(archetypeKey(dominant, secondary))
    : undefined;

  // A kapcsolat-választó szövege ugyanaz, mint a valódi páros nézetben –
  // ott a partner neve, itt a karakter neve kerül a helyére.
  const characterName = current?.label ?? "";
  const modeOptions: Array<{ value: RelationshipMode; label: string }> = [
    { value: "peer", label: t("results.compareRelationPeer", locale) },
    {
      value: "other-leads",
      label: tf("results.compareRelationOtherLeads", locale, {
        name: characterName,
      }),
    },
    {
      value: "self-leads",
      label: tf("results.compareRelationSelfLeadsNamed", locale, {
        name: characterName,
      }),
    },
  ];
  const leaderNotes =
    mode === "other-leads"
      ? (current?.leaderNotesOther ?? [])
      : mode === "self-leads"
        ? (current?.leaderNotesSelf ?? [])
        : [];

  // Ugyanaz az archetípus, mint a sajátod. Ez a leggyakoribb választás (a
  // felhasználó először magát nézi meg), és a legfélrevezethetőbb: a
  // hasonlóság gyors megértést ad, de a vakfoltok is közösek – erre külön
  // ki kell térni, mert az atomok maguktól csak az egyezést dicsérnék.
  const isSameArchetype =
    Boolean(selfGlyph) &&
    selfGlyph?.primaryCode === dominant &&
    selfGlyph?.secondaryCode === secondary;

  // S3-hedge (motor-audit v4, FIX 5): ha a saját címke főnév-only (a
  // personality-type resolver a mérési hibán belüli top-2/2-3. sorrendnél
  // nem ad melléknevet), a „Melléknév + Főnév" összeállítás-sor sem
  // állíthatja a második dimenziót – csak a főnév megy ki. A jelet magából
  // a címkéből olvassuk, így a szekció nem mondhat ellent a fejlécnek.
  const selfNoun = selfGlyph
    ? personalityNoun(selfGlyph.primaryCode, locale)
    : null;
  const selfLabelIsNounOnly = Boolean(
    selfLabel && selfNoun && selfLabel === selfNoun,
  );

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
        dominantSelected={dominantSelected}
        secondarySelected={secondarySelected}
        onDominantChange={handleDominantChange}
        onSecondaryChange={handleSecondaryChange}
      />

      {current && (
        <>
          {/* Páros-fejléc: két ábra egymás mellett. Az összehasonlítást a KÉP
              viszi, a név alatt pedig ott a összeállítás – így látszik, hogy a
              két oldal ugyanabból a szókincsből épül. */}
          <div className="mb-4 flex flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-3">
            {selfLabel && (
              <>
                <ComparisonSide
                  eyebrow={t("results.interactionPairYou", locale)}
                  label={selfLabel}
                  glyph={selfGlyph}
                  // Főnév-only címkénél a teljes összeállítás-sor elmarad –
                  // a puszta főnév a fenti címkét ismételné.
                  nounPart={selfLabelIsNounOnly ? null : selfNoun}
                  adjectivePart={
                    selfGlyph && !selfLabelIsNounOnly
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
                // A választott típusnak nincs pontszáma – közepes intenzitás,
                // hogy az ábra ne sugalljon mért erősséget.
                intensity: 3,
              }}
              nounPart={personalityNoun(dominant, locale)}
              adjectivePart={personalityAdjective(secondary, locale)}
              locale={locale === "hu" ? "hu" : "en"}
            />
          </div>

          {isSameArchetype && (
            <div className="mb-4 rounded-xl border-[1.5px] border-[var(--color-accent-primary)]/25 bg-[var(--color-surface-highlight-warm)] p-[18px]">
              <p className="mb-1 text-micro font-bold uppercase tracking-wide text-[var(--color-accent-primary-strong)]">
                {t("results.interactionSameTitle", locale)}
              </p>
              <p className="max-w-prose text-body text-[var(--color-text-secondary)]">
                {t("results.interactionSameBody", locale)}
              </p>
            </div>
          )}

          {/* A kapcsolat-választó ugyanaz a kontroll, mint a valódi páros
              nézetben – és most három állapotú: az „én vezetem őt" irány
              korábban itt egyáltalán nem volt elérhető. */}
          <RelationshipModeSelect
            label={t("results.compareRelationLabel", locale)}
            value={mode}
            options={modeOptions}
            onChange={setMode}
            className="mb-5"
          />

          <InteractionLeaderNotes notes={leaderNotes} />

          {/* A karakter-út tartalmi HATÁRA, a tartalom ELŐTT: a prototípus a
              hat dimenzióból kettőt állít pólusosra, a másik négyet a
              középvonalra – azokról tehát nem mondhat semmit. Enélkül a
              valódi úthoz képesti eltérés hibának látszik, nem korlátnak.
              A módszertani rész a lap alján van, ez csak a konkrét keret. */}
          <p className="mb-5 max-w-prose text-caption leading-relaxed text-[var(--color-text-muted)]">
            {tf("results.interactionTypeScopeNote", locale, {
              dims: [dominant, secondary]
                .map((dim) =>
                  locale === "hu"
                    ? HEXACO_DIMENSIONS[dim].hu
                    : HEXACO_DIMENSIONS[dim].en,
                )
                .join(" · "),
            })}
          </p>

          <InteractionDynamicPanels
            easy={current.easy}
            friction={current.friction}
            discuss={current.discuss}
            sparse={current.sparse}
          />
        </>
      )}

      {/* Módszertani jegyzet – a valódi páros nézettel azonos kezelésben,
          hogy a két felület egy rendszerként olvasson. */}
      <div className="mt-7 flex items-start gap-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-4">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-accent-primary-strong)] text-caption text-[var(--color-accent-primary-strong)]">
          i
        </span>
        <p className="text-caption leading-relaxed text-[var(--color-text-muted)]">
          {t("results.interactionSourceNote", locale)}
        </p>
      </div>
    </section>
  );
}
