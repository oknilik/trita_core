"use client";

import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import type { PairFacetNuanceView } from "@/lib/interaction-view";

interface PairFacetNuancesProps {
  rows: PairFacetNuanceView[];
}

/**
 * Facet-szintű rétegek a valódi páros nézetben — KÉT, episztemikusan
 * különböző blokkban.
 *
 * · „Hol fut az eltérés" (`driver`): a fölötte álló sáv már megállapította,
 *   hogy a dimenzión eltértek; ez a sor csak megmondja, melyik alskálára
 *   sűrűsödik. NEM új állítás, hanem attribúció — ezért nem növeli a
 *   hipotézis-tesztek számát.
 *
 * · „Azonos címke, más működés" (`nuance`): a dimenzió-szint EGYEZIK, mégis
 *   elválik, melyik alskála viszi. Ez ÖNÁLLÓ állítás, saját kapuval. Azt az
 *   egy kérdést válaszolja meg, amit a dimenzió-szint nem tud: miért
 *   súrlódik két, papíron egyforma ember.
 *
 * MIÉRT NEM MEGY EZ TOVÁBB 24 ÖNÁLLÓ FACET-ÁLLÍTÁSRA: a rövid formán egy
 * alskála α ≈ 0,47 (a variancia több mint fele zaj), és 24 egyidejű,
 * független vizsgálat két AZONOS profilú ember között is ~7 hamis
 * „eltérés"-jelzést adna. Mérés: docs/audits/interaction-pair-coverage-
 * 2026-08-18.md §8.
 *
 * ADATVÉDELEM: pontszám itt sem jelenik meg, csak az irány.
 */
export function PairFacetNuances({ rows }: PairFacetNuancesProps) {
  const { locale } = useLocale();
  if (rows.length === 0) return null;

  const groups = (
    [
      {
        kind: "driver" as const,
        title: t("results.pairDriverTitle", locale),
        body: () => t("results.pairDriverBody", locale),
      },
      {
        kind: "nuance" as const,
        title: t("results.pairNuanceTitle", locale),
        body: (row: PairFacetNuanceView) =>
          row.higher === "self"
            ? t("results.pairNuanceSelf", locale)
            : t("results.pairNuanceOther", locale),
      },
    ] satisfies Array<{
      kind: PairFacetNuanceView["kind"];
      title: string;
      body: (row: PairFacetNuanceView) => string;
    }>
  )
    .map((group) => ({
      ...group,
      rows: rows.filter((row) => row.kind === group.kind),
    }))
    .filter((group) => group.rows.length > 0);

  return (
    <section className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-5 md:p-6">
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.kind}>
            <h2 className="font-fraunces text-heading leading-snug text-[var(--color-text-primary)]">
              {group.title}
            </h2>
            <ul className="mt-4 flex flex-col gap-4">
              {group.rows.map((row) => (
                <li key={`${row.dim}-${row.facet}`} className="max-w-prose">
                  <p className="text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
                    {row.dimLabel}
                  </p>
                  <p className="mt-0.5 text-caption font-semibold text-[var(--color-text-primary)]">
                    {row.facetLabel}
                  </p>
                  <p className="mt-1 text-body leading-relaxed text-[var(--color-text-secondary)]">
                    {group.body(row)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Egy közös jegyzet a két blokk alatt: a bizonytalanság forrása
          ugyanaz (2–3 item visz egy alskálát), a kezelése is. */}
      <p className="mt-5 max-w-prose text-micro leading-relaxed text-[var(--color-text-muted)]">
        {t("results.pairNuanceNote", locale)}
      </p>
    </section>
  );
}
