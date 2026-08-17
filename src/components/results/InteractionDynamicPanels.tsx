"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import type { InteractionTextLine } from "@/lib/interaction-view";

type PanelId = "easy" | "friction" | "discuss";

interface InteractionDynamicPanelsProps {
  easy: InteractionTextLine[];
  friction: InteractionTextLine[];
  discuss: InteractionTextLine[];
  sparse: boolean;
  /**
   * Rövid magyarázat arra az esetre, ha a szimuláció EGYETLEN markáns pontot
   * talált. Ilyenkor a kép rövid, és a felhasználó ezt joggal hiszi hibának
   * („a karakter-út bővebb") — pedig mérési eredmény. Felületenként más a
   * mondat, ezért kívülről jön.
   */
  thinNote?: string;
}

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
 * A szimuláció-kimenet EGYETLEN prezentációja: „Közös kép" (az első
 * erősség- és súrlódásjelzés) + progresszíven megnyitható részletek.
 *
 * Miért közös komponens: ugyanez a motor-kimenet két felületen jelenik meg
 * (valódi páros és karakter-szimuláció). Amíg két külön prezentáció volt, a
 * user ugyanazt a mondatot két különböző címke alatt látta („Ami összeköt"
 * vs. „Ami magától megy"), és úgy tűnt, mintha két különböző állítás lenne.
 * A tartalmi eltérés a két út között így ott marad, ahol valódi — a motor
 * bemenetében (típus-prototípus: 2 pólusos dimenzió; valódi profil: 2–6) —,
 * nem a megjelenítésben.
 */
export function InteractionDynamicPanels({
  easy,
  friction,
  discuss,
  sparse,
  thinNote,
}: InteractionDynamicPanelsProps) {
  const { locale } = useLocale();

  const summaryEasy = easy[0] ?? null;
  const summaryFriction = friction[0] ?? null;
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
        lines: summaryEasy ? easy.slice(1) : easy,
      },
      {
        id: "friction",
        title: t("results.interactionFriction", locale),
        lines: summaryFriction ? friction.slice(1) : friction,
      },
      {
        id: "discuss",
        title: t("results.interactionDiscuss", locale),
        lines: discuss,
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

  // A progresszív feltárás a HOSSZ kezelésére van. Egyetlen blokknál nincs
  // mit fokozatosan feltárni: a sorszám („1"), a chevron és az összecsukás
  // ott már csak apparátus, ami kevesebbnek MUTATJA a tartalmat, mint
  // amennyi. Ilyenkor a blokk nyitva, cím szerint, keret nélkül áll.
  const useAccordion = panels.length >= 2;

  // Egy atom = a motor egyetlen markáns pontot talált. Nem hiba, de a
  // felhasználónak meg kell mondani, különben a rövid kép hibának látszik.
  const atomCount = new Set(
    [...easy, ...friction, ...discuss].map((line) => line.atomId),
  ).size;
  const isThin = atomCount <= 1;

  if (sparse) {
    return (
      <p className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-5 text-body leading-relaxed text-[var(--color-text-secondary)]">
        {t("results.interactionSparse", locale)}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {/* A részletek előtt egyetlen, azonnal használható közös kép. Ha csak
          az egyik oldal van meg, azt mutatjuk — nem tüntetjük el az egész
          blokkot a hiányzó másik fél miatt. */}
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

      {isThin && thinNote ? (
        <p className="max-w-prose text-caption leading-relaxed text-[var(--color-text-muted)]">
          {thinNote}
        </p>
      ) : null}

      {/* Progresszív feltárás: egyszerre csak az olvasott rész viszi el a
          képernyő magasságát. */}
      {useAccordion ? (
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
      ) : (
        panels.map((panel) => (
          <section key={panel.id}>
            <h2 className="mb-3 font-fraunces text-heading text-[var(--color-text-primary)]">
              {panel.title}
            </h2>
            <LineList lines={panel.lines} />
          </section>
        ))
      )}
    </div>
  );
}
