// ─────────────────────────────────────────────────────────────────────
// Eredmény-nézet módja — az egyszerű és a részletes (mai) nézet közti
// váltás egyetlen igazságforrása.
//
// Döntés (2026-08-09): az ELSŐ megnyitáskor mindenki az egyszerű nézetet
// kapja, utána azt, amit utoljára használt. A választást a UserProfile
// `resultsViewMode` mezője őrzi (NULL = még nem választott), az URL
// `?view=` paramétere pedig felülírja — így megosztható a link, és a
// mélylinkelt nézet nem írja felül a tárolt preferenciát.
// ─────────────────────────────────────────────────────────────────────

export const RESULTS_VIEW_MODES = ["simple", "full"] as const;

export type ResultsViewMode = (typeof RESULTS_VIEW_MODES)[number];

/** A nézet, amit új felhasználó kap: a rövidített kép. */
export const DEFAULT_RESULTS_VIEW_MODE: ResultsViewMode = "simple";

export function isResultsViewMode(value: unknown): value is ResultsViewMode {
  return (
    typeof value === "string" &&
    (RESULTS_VIEW_MODES as readonly string[]).includes(value)
  );
}

/**
 * A megjelenítendő nézet feloldása.
 *
 * Sorrend: `?view=` → `?tab=` (mélylink) → tárolt preferencia →
 * alapértelmezés (egyszerű). Ismeretlen érték (elgépelt link, régi tárolt
 * string) nem hibázik, csak az alapértelmezésre esik vissza.
 *
 * A `?tab=` azért üti a tárolt preferenciát, mert az EGYSZERŰ nézetben nincs
 * fülsáv: a `?tab=comparison#invitations` alakú mélylinkek (értesítő e-mailek,
 * journey-CTA-k, súgó) különben zsákutcába futnának. Aki fület kér, fület kap.
 */
export function resolveResultsViewMode(input: {
  param?: string | string[] | null;
  /** `?tab=` — ha van, mélylinkelt fület kértek, tehát részletes nézet kell. */
  tab?: string | string[] | null;
  stored?: string | null;
}): ResultsViewMode {
  const param = Array.isArray(input.param) ? input.param[0] : input.param;
  if (isResultsViewMode(param)) return param;

  const tab = Array.isArray(input.tab) ? input.tab[0] : input.tab;
  if (tab) return "full";

  if (isResultsViewMode(input.stored)) return input.stored;
  return DEFAULT_RESULTS_VIEW_MODE;
}
