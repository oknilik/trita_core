"use client";

import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import type { PairFacetNuanceView } from "@/lib/interaction-view";

interface PairFacetNuancesProps {
  rows: PairFacetNuanceView[];
}

/**
 * „Azonos címke, más működés" — facet-szintű nüansz a valódi páros nézetben.
 *
 * MIT VÁLASZOL MEG: azt az egy kérdést, amit a dimenzió-szint nem tud —
 * miért súrlódik két, papíron egyforma ember. Ha a Lelkiismeretesség
 * mindkettőtöknél hasonló, de nálad a Szervezettség viszi, nála a Szorgalom,
 * akkor a közös címke mögött két különböző működés áll.
 *
 * MIÉRT ILYEN SZŰK: a rövid kérdőíven 2–3 item visz egy alskálát, így a
 * facet-szintű különbség-küszöb ~17 pont, és 24 facet egyidejű vizsgálata
 * többszörös-összehasonlítási problémát is jelent. A motor ezért csak
 * DIMENZIÓ-SZINTEN EGYEZŐ dimenzióban néz, dimenziónként a legnagyobb rést
 * veszi, és legfeljebb két sort ad — a bizonytalanságot pedig a záró jegyzet
 * kimondja, nem elrejti.
 *
 * ADATVÉDELEM: pontszám itt sem jelenik meg, csak az irány.
 */
export function PairFacetNuances({ rows }: PairFacetNuancesProps) {
  const { locale } = useLocale();
  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-5 md:p-6">
      <h2 className="font-fraunces text-heading leading-snug text-[var(--color-text-primary)]">
        {t("results.pairNuanceTitle", locale)}
      </h2>

      <ul className="mt-4 flex flex-col gap-4">
        {rows.map((row) => (
          <li key={`${row.dim}-${row.facet}`} className="max-w-prose">
            <p className="text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
              {row.dimLabel}
            </p>
            <p className="mt-0.5 text-caption font-semibold text-[var(--color-text-primary)]">
              {row.facetLabel}
            </p>
            <p className="mt-1 text-body leading-relaxed text-[var(--color-text-secondary)]">
              {row.higher === "self"
                ? t("results.pairNuanceSelf", locale)
                : t("results.pairNuanceOther", locale)}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-4 max-w-prose text-micro leading-relaxed text-[var(--color-text-muted)]">
        {t("results.pairNuanceNote", locale)}
      </p>
    </section>
  );
}
