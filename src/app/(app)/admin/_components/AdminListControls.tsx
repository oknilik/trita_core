"use client";

// ─────────────────────────────────────────────────────────────────────
// Admin-listák közös vezérlője: névre keresés + „csak az utolsó N" kapu.
// A szűrés kliens-oldali (admin-léptékű adat), a lista a szülőben marad.
// ─────────────────────────────────────────────────────────────────────

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  /** Szűrés utáni találatszám. */
  matched: number;
  /** Összes tétel (szűrés nélkül). */
  total: number;
  /** Alapesetben megjelenített tételek száma. */
  limit: number;
  showAll: boolean;
  onToggleShowAll: () => void;
  /** Egy soros címke a tételtípusra, pl. „szervezet". */
  noun: string;
}

export function AdminListControls({
  query,
  onQueryChange,
  placeholder,
  matched,
  total,
  limit,
  showAll,
  onToggleShowAll,
  noun,
}: Props) {
  const truncated = !showAll && matched > limit;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[200px] flex-1">
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-h-[40px] w-full rounded-lg border border-sand bg-white px-3 text-xs text-ink outline-none transition focus:border-sage"
        />
      </div>

      <p className="text-xs text-muted">
        {query.trim()
          ? `${matched} találat / ${total} ${noun}`
          : truncated
            ? `utolsó ${limit} · összesen ${total} ${noun}`
            : `${total} ${noun}`}
      </p>

      {matched > limit && (
        <button
          type="button"
          onClick={onToggleShowAll}
          className="min-h-[40px] rounded-lg border border-sand bg-white px-3 text-xs font-semibold text-ink-body transition hover:text-ink"
        >
          {showAll ? `Csak az első ${limit}` : `Mind a ${matched} megjelenítése`}
        </button>
      )}
    </div>
  );
}
