"use client";

import { useState, type CSSProperties } from "react";
import { t, tf } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import {
  RelationshipModeSelect,
  type RelationshipMode,
} from "@/components/results/RelationshipModeSelect";
import type {
  InteractionTextLine,
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

type PanelId = "easy" | "friction" | "discuss";

const HERO_GLYPH_TOKENS = {
  "--color-ink": "var(--color-text-on-inverse)",
  "--color-sage": "var(--color-sage-300)",
} as CSSProperties;

function LineList({ lines }: { lines: InteractionTextLine[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {lines.map((line) => (
        <li key={line.atomId} className="max-w-prose">
          <p className="text-body leading-relaxed text-[var(--color-text-secondary)]">
            {line.text}
          </p>
          <p className="mt-1.5 text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
            {line.dimLabels.join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 6 5 5 5-5" />
    </svg>
  );
}

function InsightPanel({
  id,
  number,
  title,
  lines,
  open,
  onToggle,
}: {
  id: PanelId;
  number: number;
  title: string;
  lines: InteractionTextLine[];
  open: boolean;
  onToggle: () => void;
}) {
  const markerClass = {
    easy: "bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)]",
    friction: "bg-[var(--color-accent-primary-strong)] text-[var(--color-text-on-accent-deep)]",
    discuss: "bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]",
  }[id];

  if (lines.length === 0) return null;

  return (
    <article className="relative border-b border-[var(--color-border-soft)] last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-h-[60px] w-full items-center gap-3 py-2 text-left text-[var(--color-text-primary)]"
      >
        <span
          className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-fraunces text-[17px] ${markerClass}`}
        >
          {number}
        </span>
        <span className="min-w-0 flex-1 font-fraunces text-[18px] leading-snug">
          {title}
        </span>
        <Chevron open={open} />
      </button>
      {open ? (
        <div className="pb-5 pl-12 pr-1 pt-1">
          <LineList lines={lines} />
        </div>
      ) : null}
    </article>
  );
}

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

  const summaryEasy = sim.easy[0] ?? null;
  const summaryFriction = sim.friction[0] ?? null;
  const hasSummary = Boolean(summaryEasy || summaryFriction);

  // A motor összesen max 3 atomot választ, és a „Közös kép" már kimondja az
  // első erősség- és súrlódásjelzést. A panelek ezért csak azt hozzák, ami
  // AZON TÚL van — különben a nyitott első panel szó szerint megismételné a
  // fentebb olvasott mondatot. A `discuss` külön szövegblokk, az egészben jön.
  const panels = (
    [
      {
        id: "easy",
        title: t("results.interactionEasy", locale),
        lines: summaryEasy ? sim.easy.slice(1) : sim.easy,
      },
      {
        id: "friction",
        title: t("results.interactionFriction", locale),
        lines: summaryFriction ? sim.friction.slice(1) : sim.friction,
      },
      {
        id: "discuss",
        title: t("results.interactionDiscuss", locale),
        lines: sim.discuss,
      },
    ] satisfies Array<{ id: PanelId; title: string; lines: InteractionTextLine[] }>
  )
    // A sorszám a LÁTHATÓ panelekhez igazodik: kiürült blokk nem hagy lyukat
    // a számozásban.
    .filter((panel) => panel.lines.length > 0)
    .map((panel, index) => ({ ...panel, number: index + 1 }));

  const [openPanel, setOpenPanel] = useState<PanelId | null>(
    () => panels[0]?.id ?? null,
  );

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

        {/* Saját listbox: mobilon sem a böngésző natív választóját nyitja meg. */}
        <RelationshipModeSelect
          label={t("results.compareRelationLabel", locale)}
          value={mode}
          options={modeOptions}
          onChange={setMode}
        />
      </div>

      {/* A vezetői jegyzetek az EGYETLEN tartalom, ami a fenti választótól
          függ — ezért közvetlenül alatta állnak. Az oldal alján a user
          átállította a kapcsolatot, és a képernyőn semmi nem változott.
          A wrapper akkor is a fában marad, ha üres (sr-only: nincs
          layout-hatása), hogy a live-region be tudja mondani a megjelenést. */}
      <div
        aria-live="polite"
        className={leaderNotes.length > 0 ? undefined : "sr-only"}
      >
        {leaderNotes.length > 0 ? (
          <section className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-highlight-warm)] p-5">
            <p className="mb-3 text-label uppercase text-[var(--color-accent-primary-strong)]">
              {t("results.interactionLeaderTitle", locale)}
            </p>
            <ul className="flex flex-col gap-3">
              {leaderNotes.map((note) => (
                <li key={note.dim}>
                  <p className="text-body leading-relaxed text-[var(--color-text-secondary)]">
                    {note.text}
                  </p>
                  <p className="mt-1 text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
                    {note.dimLabel}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {sim.sparse ? (
        <p className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-5 text-body leading-relaxed text-[var(--color-text-secondary)]">
          {t("results.interactionSparse", locale)}
        </p>
      ) : (
        <>
          {/* A részletek előtt egyetlen, azonnal használható közös kép. Ha
              csak az egyik oldal van meg, azt mutatjuk — nem tüntetjük el az
              egész blokkot a hiányzó másik fél miatt. */}
          {hasSummary ? (
            <section>
              <h2 className="mb-3 font-fraunces text-heading text-[var(--color-text-primary)]">
                {t("results.compareCommonPicture", locale)}
              </h2>
              <div
                className={`relative grid overflow-hidden rounded-2xl border border-[var(--color-border-soft)] ${
                  summaryEasy && summaryFriction ? "md:grid-cols-2" : ""
                }`}
              >
                {summaryEasy ? (
                  <div className="bg-[var(--color-surface-self-accent-soft)] p-5 md:pr-7">
                    <p className="text-label uppercase text-[var(--color-accent-self-deep)]">
                      {t("results.compareConnects", locale)}
                    </p>
                    <p className="mt-2 text-body leading-relaxed text-[var(--color-accent-self-deep)]">
                      {summaryEasy.text}
                    </p>
                  </div>
                ) : null}
                {summaryFriction ? (
                  <div
                    className={`bg-[var(--color-surface-highlight-warm)] p-5 ${
                      summaryEasy
                        ? "border-t border-[var(--color-border-soft)] md:border-l md:border-t-0 md:pl-7"
                        : ""
                    }`}
                  >
                    <p className="text-label uppercase text-[var(--color-accent-primary-strong)]">
                      {t("results.compareAttention", locale)}
                    </p>
                    <p className="mt-2 text-body leading-relaxed text-[var(--color-text-secondary)]">
                      {summaryFriction.text}
                    </p>
                  </div>
                ) : null}
                {summaryEasy && summaryFriction ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-surface-card font-fraunces text-[var(--color-accent-primary-strong)] shadow-sm md:flex"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    >
                      <path d="M10 2v16M2 10h16M4.35 4.35l11.3 11.3M15.65 4.35l-11.3 11.3" />
                    </svg>
                  </span>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Progresszív feltárás: egyszerre csak az olvasott rész viszi el a
              képernyő magasságát. */}
          {panels.length > 0 ? (
            <section className="relative">
              <span
                aria-hidden="true"
                className="absolute bottom-7 left-[17px] top-7 w-px bg-[var(--color-border-default)]"
              />
              <div className="relative">
                {panels.map((panel) => (
                  <InsightPanel
                    key={panel.id}
                    {...panel}
                    open={openPanel === panel.id}
                    onToggle={() =>
                      setOpenPanel((current) => (current === panel.id ? null : panel.id))
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

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
