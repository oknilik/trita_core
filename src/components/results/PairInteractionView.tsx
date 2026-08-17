"use client";

import { useState, type CSSProperties } from "react";
import { t, tf } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import {
  RelationshipModeSelect,
  type RelationshipMode,
} from "@/components/results/RelationshipModeSelect";
import { InteractionDynamicPanels } from "@/components/results/InteractionDynamicPanels";
import { InteractionLeaderNotes } from "@/components/results/InteractionLeaderNotes";
import type {
  InteractionLeaderNote,
  PairSimulationView,
} from "@/lib/interaction-view";

export interface PairGlyphInfo {
  primaryCode: string;
  secondaryCode: string;
  intensity: number;
  label: string;
}

interface PairInteractionViewProps {
  self: PairGlyphInfo;
  other: PairGlyphInfo;
  otherName: string;
  sim: PairSimulationView;
}

/** A sötét hero-vásznon a glyph a világos tokeneket használja. */
const HERO_GLYPH_TOKENS = {
  "--color-ink": "var(--color-text-on-inverse)",
  "--color-sage": "var(--color-sage-300)",
} as CSSProperties;

/**
 * Két valós, kölcsönösen megosztott profil közös működési képe.
 *
 * A partner számszerű pontszámai nem kerülnek a kliensre: a felület csak a
 * két karakter-ábrát, a szerveren előállított szöveges dinamikát és a
 * felhasználó által választott munkakapcsolatot mutatja.
 */
export function PairInteractionView({
  self,
  other,
  otherName,
  sim,
}: PairInteractionViewProps) {
  const { locale } = useLocale();
  const [mode, setMode] = useState<RelationshipMode>("peer");

  const leaderNotes: InteractionLeaderNote[] =
    mode === "other-leads"
      ? sim.leaderNotesOther
      : mode === "self-leads"
        ? sim.leaderNotesSelf
        : [];

  const modeOptions: Array<{ value: RelationshipMode; label: string }> = [
    { value: "peer", label: t("results.compareRelationPeer", locale) },
    {
      value: "other-leads",
      label: tf("results.compareRelationOtherLeads", locale, { name: otherName }),
    },
    {
      value: "self-leads",
      label: tf("results.compareRelationSelfLeadsNamed", locale, { name: otherName }),
    },
  ];

  return (
    <section className="flex flex-col gap-7">
      {/* Egyetlen közös vászon: mobilon is egymás mellett marad a két profil. */}
      <div>
        <div className="relative overflow-hidden rounded-[22px] border border-[var(--color-border-soft)] bg-[var(--color-surface-inverse)] px-3 pb-11 pt-6 shadow-[var(--ui-shadow-md)] sm:px-7 sm:pt-8">
          <span
            aria-hidden="true"
            className="absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[var(--color-action-primary-bg)]/15 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-[var(--color-accent-primary)]/15 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="absolute right-5 top-5 h-px w-14 bg-[var(--color-accent-primary)]/60"
          />

          <div className="relative grid grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] items-center gap-1">
            {[
              {
                info: self,
                eyebrow: t("results.interactionPairYou", locale),
              },
              {
                info: other,
                eyebrow: otherName,
              },
            ].map(({ info, eyebrow }, index) => (
              <div
                key={`${eyebrow}-${info.primaryCode}-${info.secondaryCode}`}
                className={index === 0 ? "col-start-1" : "col-start-3"}
              >
                <div
                  className="mx-auto flex h-28 max-w-40 items-center justify-center sm:h-36"
                  style={HERO_GLYPH_TOKENS}
                >
                  <TypeGlyph
                    primaryCode={info.primaryCode}
                    secondaryCode={info.secondaryCode}
                    typeLabel={info.label}
                    locale={locale === "hu" ? "hu" : "en"}
                    intensity={info.intensity}
                    variant="card"
                    canvas={false}
                    className="h-full w-full"
                  />
                </div>
                {/* A név azonosít — nem címke: ezért nem 10px-es, nem
                    verzálos (a „KATALIN" felirat úgy olvas, mint egy tag). */}
                <p className="mx-auto mt-1.5 max-w-[12rem] break-words text-center text-caption font-semibold text-[var(--color-accent-primary)]">
                  {eyebrow}
                </p>
                <p className="mx-auto mt-1 max-w-[12rem] text-center font-fraunces text-[15px] leading-snug text-[var(--color-text-on-inverse)] sm:text-[18px]">
                  {info.label}
                </p>
              </div>
            ))}

            <div className="relative col-start-2 row-start-1 self-center">
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-px w-[72px] -translate-x-1/2 -translate-y-1/2 bg-[var(--color-text-on-inverse-muted)]/35 sm:w-28"
              />
              <span className="relative mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-accent-primary)]/50 bg-[var(--color-surface-inverse)] font-fraunces text-lg text-[var(--color-accent-primary)]">
                ×
              </span>
            </div>
          </div>

          <div className="relative mt-5 flex justify-center">
            <span className="rounded-full border border-[var(--color-text-on-inverse-muted)]/35 px-3 py-1 text-micro text-[var(--color-text-on-inverse-muted)]">
              {t("results.comparePairRealProfiles", locale)}
            </span>
          </div>
        </div>

        {/* Saját listbox: mobilon sem a böngésző natív választóját nyitja meg.
            A negatív margó a sötét hero alá lógatja be. */}
        <RelationshipModeSelect
          label={t("results.compareRelationLabel", locale)}
          value={mode}
          options={modeOptions}
          onChange={setMode}
          className="mx-3 -mt-6 sm:mx-8"
        />
      </div>

      <InteractionLeaderNotes notes={leaderNotes} />

      <InteractionDynamicPanels
        easy={sim.easy}
        friction={sim.friction}
        discuss={sim.discuss}
        sparse={sim.sparse}
      />

      <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-4">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-accent-primary-strong)] text-caption text-[var(--color-accent-primary-strong)]">
          i
        </span>
        <p className="text-caption leading-relaxed text-[var(--color-text-muted)]">
          {t("results.comparePairSourceNote", locale)}
        </p>
      </div>
    </section>
  );
}
