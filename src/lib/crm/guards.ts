import { OPEN_DEAL_STAGES, type QuoteStatus } from "@/lib/crm/constants";

// ─────────────────────────────────────────────────────────────────────
// CRM guardok — PURE függvények (DB/IO nélkül), unit-tesztelve.
//
// A nap-határok UTC szerint értendők: a sweep is UTC-ütemezésű (napi
// cron), így a „ma esedékes” halmaz determinisztikus és óraátállítás-
// független. Admin-only belső eszköznél ez elfogadott pontosság.
// ─────────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

/** Nyitott (pipeline-ban élő) stage-e? WON/LOST nem az. */
export function isOpenStage(stage: string): boolean {
  return (OPEN_DEAL_STAGES as readonly string[]).includes(stage);
}

/**
 * Quote-életciklus őr: DRAFT→SENT; SENT→ACCEPTED|DECLINED|EXPIRED.
 * Minden más átmenet tiltott — a SENT-től az ajánlat immutábilis,
 * a döntött állapotokból nincs visszaút (módosítás = másolat új DRAFT-ként).
 */
export function canTransitionQuote(from: QuoteStatus | string, to: QuoteStatus | string): boolean {
  if (from === "DRAFT") return to === "SENT";
  if (from === "SENT") return to === "ACCEPTED" || to === "DECLINED" || to === "EXPIRED";
  return false;
}

// ── Esedékesség ─────────────────────────────────────────────────────────────

export type DueBucket = "overdue" | "today" | "upcoming" | "none";

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** A next action esedékességi kosara a „Ma” panelhez (UTC nap-határokkal). */
export function resolveDueBucket(nextActionAt: Date | null | undefined, now: Date): DueBucket {
  if (!nextActionAt) return "none";
  const todayStart = startOfUtcDay(now);
  const ts = nextActionAt.getTime();
  if (ts < todayStart) return "overdue";
  if (ts < todayStart + DAY_MS) return "today";
  return "upcoming";
}

export interface CrmDueWindow {
  /** Ez ELŐTT esedékes next actionök számítanak (lejárt + mai): holnap 0:00 UTC. */
  dueBefore: Date;
  /** A mai nap ISO-dátuma (YYYY-MM-DD, UTC) — a napi dedupe-kulcs része. */
  isoDay: string;
}

/**
 * A napi CRM-sweep ablaka (a reflection-sweep ablak-minta szerint pure
 * exportként): mi számít ma esedékesnek, és melyik napra dedupe-olunk.
 */
export function resolveCrmDueWindow(now: Date = new Date()): CrmDueWindow {
  const todayStart = startOfUtcDay(now);
  return {
    dueBefore: new Date(todayStart + DAY_MS),
    isoDay: new Date(todayStart).toISOString().slice(0, 10),
  };
}

// ── Dedupe-kulcsok (notification hub) ───────────────────────────────────────

/** Naponta legfeljebb egyszer szól dealenként, amíg a lépés nincs elintézve. */
export function buildNextActionDueDedupeKey(dealId: string, isoDay: string): string {
  return `CRM_NEXT_ACTION_DUE:${dealId}:${isoDay}`;
}

/** Ajánlatonként egyszer szól – a lejárat közeledte nem ismétlődő hír. */
export function buildQuoteExpiringDedupeKey(quoteId: string): string {
  return `CRM_QUOTE_EXPIRING:${quoteId}`;
}

// ── Cím- és sorszám-formázók ────────────────────────────────────────────────

/**
 * Deal-cím javaslat inquiry-ből: "{cég ?? név} – {téma-címke}".
 * A topicLabel a hívótól jön (INQUIRY_TOPIC_LABELS), hogy a guard pure maradjon.
 */
export function buildDealTitleFromInquiry(inquiry: {
  name: string;
  company?: string | null;
  topicLabel?: string | null;
}): string {
  const base = inquiry.company?.trim() || inquiry.name.trim();
  const topic = inquiry.topicLabel?.trim();
  return topic ? `${base} – ${topic}` : base;
}

/**
 * Ajánlat-sorszám megjelenítése: "TRT-2026-0007". A sorszám globálisan
 * folyamatos (autoincrement) – az évszám csak megjelenítés (a létrejövés
 * UTC-éve), nem évente újrainduló számláló.
 */
export function formatQuoteNo(no: number, createdAt: Date): string {
  const padded = String(no).padStart(4, "0");
  return `TRT-${createdAt.getUTCFullYear()}-${padded}`;
}
