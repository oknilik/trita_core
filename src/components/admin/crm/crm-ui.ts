import type { CrmTone } from "@/lib/crm/constants";
import type { StatusChipVariant } from "@/components/ui/primitives/StatusChip";

// ─────────────────────────────────────────────────────────────────────
// CRM admin-UI — kliens-oldali PURE segédek (formázás, dátum-számítás,
// hibakód → HU szöveg). DB/IO nélkül, hogy komponens-tesztből és unit-
// tesztből is hívható legyen. Az üzleti guardok a lib/crm/guards-ban élnek.
// ─────────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

/** A halasztott/kitűzött next action napközi UTC-órája (bucket-semleges). */
const NEXT_ACTION_UTC_HOUR = 9;

// A sűrű CRM-felület közös vizuális primitívjei. Ezek ugyanazokat a
// felület- és fókusztokeneket használják, mint a termék többi űrlapja, de
// megtartják az admin munkanézet kompakt ritmusát.
export const CRM_INPUT_CLASS =
  "min-h-[44px] w-full rounded-[10px] border border-border-default bg-surface-card px-3 text-sm text-ink outline-none transition focus:border-bronze focus-visible:ring-2 focus-visible:ring-sage-ring/40";

export const CRM_TEXTAREA_CLASS =
  "w-full rounded-[10px] border border-border-default bg-surface-card px-3 py-2 text-sm text-ink-body outline-none transition focus:border-bronze focus-visible:ring-2 focus-visible:ring-sage-ring/40";

export const CRM_FIELD_LABEL_CLASS = "text-note font-semibold text-ink-body";

export const huf = (value: number): string =>
  new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(value);

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Relatív kor UTC nap-határokkal: "ma" / "tegnap" / "N napja". */
export function relativeDayLabel(iso: string, now: Date = new Date()): string {
  const startOf = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const days = Math.round((startOf(now) - startOf(new Date(iso))) / DAY_MS);
  if (days <= 0) return "ma";
  if (days === 1) return "tegnap";
  return `${days} napja`;
}

/**
 * Halasztó chip cél-időpontja: a MAI naptól számított +N nap (UTC nap-
 * határokkal, napközi órával) — nem a régi esedékességtől, hogy a lejárt
 * lépés is előre kerüljön. A guards.resolveDueBucket ablakaival konzisztens.
 */
export function computePostponeAt(days: number, now: Date = new Date()): string {
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(todayStart + days * DAY_MS + NEXT_ACTION_UTC_HOUR * 60 * 60 * 1000).toISOString();
}

/** `<input type="date">` érték (YYYY-MM-DD) → ISO, napközi UTC-órával. */
export function dayInputToIso(value: string): string {
  return `${value}T0${NEXT_ACTION_UTC_HOUR}:00:00.000Z`;
}

/** ISO → `<input type="date">` érték (UTC nap). */
export function isoToDayInput(iso: string): string {
  return iso.slice(0, 10);
}

/** A lib/crm CrmTone → StatusChip variáns (a muted neutralra képződik). */
export function toneToChipVariant(tone: CrmTone): StatusChipVariant {
  return tone === "muted" ? "neutral" : tone;
}

// ── Hibakód → HU szöveg (a szerver rövid kódot küld, a kliens lokalizál) ────

const CRM_ERROR_TEXT: Record<string, string> = {
  DEAL_NOT_FOUND: "A deal nem található — lehet, hogy időközben törölték.",
  INQUIRY_NOT_FOUND: "A megkeresés nem található.",
  QUOTE_NOT_FOUND: "Az ajánlat nem található.",
  ACTIVITY_NOT_FOUND: "A bejegyzés nem található.",
  ORG_NOT_FOUND: "A szervezet nem található.",
  USER_NOT_FOUND: "A felhasználó nem található.",
  INVALID_STAGE: "Érvénytelen stage.",
  INVALID_TRANSITION: "Ez az állapotváltás nem engedélyezett.",
  LOST_REASON_REQUIRED: "Elveszett lezáráshoz kötelező okot választani.",
  QUOTE_NOT_DRAFT: "Csak piszkozat állapotú ajánlat szerkeszthető.",
  ONLY_DRAFT_DELETABLE: "Csak piszkozat törölhető — kiment ajánlat nyom marad.",
  NOT_EDITABLE: "Rendszer-bejegyzés nem módosítható és nem törölhető.",
  INQUIRY_ALREADY_LINKED: "Ez a megkeresés már egy dealhez kapcsolódik.",
  VALIDATION_ERROR: "Érvénytelen adat — ellenőrizd a mezőket.",
  UNAUTHORIZED: "Nincs jogosultság a művelethez.",
};

export function crmErrorText(code: string | null | undefined): string {
  return (code && CRM_ERROR_TEXT[code]) || "A művelet nem sikerült — próbáld újra.";
}

/**
 * Közös fetch-burkoló a CRM-mutációkhoz: JSON-body, hibakód-kiolvasás.
 * Siker: { ok: true, data }; hiba: { ok: false, error: HU szöveg }.
 */
export async function crmRequest<T = unknown>(
  url: string,
  init: { method: "POST" | "PATCH" | "DELETE"; body?: unknown },
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method: init.method,
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const data = (await res.json().catch(() => null)) as
      | (T & { error?: string })
      | null;
    if (!res.ok) return { ok: false, error: crmErrorText(data?.error) };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: crmErrorText(null) };
  }
}
