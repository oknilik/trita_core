"use client";

import { useState } from "react";

/**
 * Összevető tábla blogcikkekhez.
 *
 * A sorok SZÖVEGES attribútumban érkeznek, nem tömb-kifejezésben: a
 * next-mdx-remote v6 alapból kiszűr minden JS-kifejezést az MDX-ből
 * (blockJS), így a korábbi rows={[["a","b"],…]} némán elveszett, és a
 * tábla csak a fejlécet mutatta. Formátum: soronként egy sor, a két
 * cellát „|" választja el. Őrzi: tests/unit/blog/mdx-expression-guard.test.ts
 *
 * Kis kijelzőn a két hasáb nem fér el egymás mellett, egymás alá rakva
 * pedig szétesik a párosítás. Ezért ott kapcsolóval egy oldalt mutatunk
 * teljes szélességben; md:-től a valódi kétoszlopos tábla jön.
 */
export function parseCompareRows(rows: string): [string, string][] {
  return rows
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [left = "", right = ""] = line.split("|").map((cell) => cell.trim());
      return [left, right] as [string, string];
    });
}

export function CompareTable({
  leftLabel,
  rightLabel,
  rows = "",
}: {
  leftLabel: string;
  rightLabel: string;
  rows?: string;
}) {
  const [side, setSide] = useState<0 | 1>(0);
  const rowList = parseCompareRows(rows);
  const labels = [leftLabel, rightLabel] as const;

  return (
    <div className="my-8">
      {/* Mobil: kapcsoló + egy oldal teljes szélességben */}
      <div className="md:hidden">
        <div
          role="tablist"
          aria-label={`${leftLabel} / ${rightLabel}`}
          className="flex gap-1 rounded-full border border-[var(--color-border-default)] bg-surface-card p-1"
        >
          {labels.map((label, index) => {
            const active = side === index;
            return (
              <button
                key={label}
                role="tab"
                type="button"
                aria-selected={active}
                aria-controls={`compare-panel-${index}`}
                onClick={() => setSide(index as 0 | 1)}
                className={`min-h-[44px] flex-1 rounded-full px-3 text-caption font-semibold transition-colors ${
                  active
                    ? "bg-[var(--color-surface-inverse)] text-white"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <ul
          id={`compare-panel-${side}`}
          role="tabpanel"
          aria-label={labels[side]}
          className="mt-4 space-y-3"
        >
          {rowList.map((row, i) => (
            <li
              key={i}
              className="border-l-2 border-[var(--color-accent-primary)] pl-4 text-caption break-words text-[var(--color-text-secondary)]"
            >
              {row[side]}
            </li>
          ))}
        </ul>
      </div>

      {/* Asztali: valódi kétoszlopos tábla.
          A bal oszlop meleg homoktónust kap, hogy ne „üres oldal a
          sötét mellett" legyen; a fejlécet bronz sáv nyitja, a sorok
          pedig együtt világosodnak hoverre. */}
      <div className="hidden overflow-hidden rounded-[20px] border border-[var(--color-border-default)] shadow-[0_12px_32px_rgba(26,26,46,0.06)] md:block">
        <div className="h-[3px] bg-[var(--color-accent-primary)]" />
        <div className="grid grid-cols-2">
          <div className="bg-[var(--color-surface-highlight-warm)] px-5 py-3 text-micro font-semibold uppercase tracking-wider text-[var(--color-accent-primary-strong)]">
            {leftLabel}
          </div>
          <div className="bg-[var(--color-surface-inverse)] px-5 py-3 text-micro font-semibold uppercase tracking-wider text-[var(--color-accent-primary-soft)]">
            {rightLabel}
          </div>
        </div>
        {rowList.map(([left, right], i) => (
          <div
            key={i}
            className="group grid grid-cols-2 border-t border-[var(--color-border-default)]"
          >
            <div className="bg-[var(--color-surface-subtle)] px-5 py-3.5 text-caption break-words text-[var(--color-text-secondary)] transition-colors group-hover:bg-[var(--color-surface-card)]">
              {left}
            </div>
            <div className="bg-[var(--color-surface-inverse)] px-5 py-3.5 text-caption break-words text-[var(--color-text-on-inverse)] transition-colors group-hover:bg-[var(--color-surface-inverse-soft)]">
              {right}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
