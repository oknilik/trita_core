// ─────────────────────────────────────────────────────────────────────
// CRM konstansok — admin-only belső eszköz (HU-only, ld. crm-plan-2026-08).
//
// A stage/kind/státusz értékek sima Stringek a DB-ben (a szerep-mintát
// követve — nem enum); az ITT definiált értékkészletek a forrás-igazságok.
// Új felületen ne vezess be saját címkét — ebből a modulból dolgozz.
// ─────────────────────────────────────────────────────────────────────

/** Chip-tone a meglévő state-token rendszerhez (DashboardPrimitives). */
export type CrmTone = "neutral" | "info" | "success" | "warning" | "error" | "muted";

// ── Deal stage ──────────────────────────────────────────────────────────────

export const DEAL_STAGES = ["NEW", "DISCOVERY", "QUOTED", "WON", "LOST", "DORMANT"] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

/** Nyitott (pipeline-ban élő) stage-ek — a „Ma” nézet és a warningok alapja. */
export const OPEN_DEAL_STAGES = ["NEW", "DISCOVERY", "QUOTED", "DORMANT"] as const;
export type OpenDealStage = (typeof OPEN_DEAL_STAGES)[number];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  NEW: "Új",
  DISCOVERY: "Felderítés",
  QUOTED: "Ajánlat kint",
  WON: "Megnyert",
  LOST: "Elveszett",
  DORMANT: "Parkolt",
};

export const DEAL_STAGE_TONES: Record<DealStage, CrmTone> = {
  NEW: "info",
  DISCOVERY: "neutral",
  QUOTED: "warning",
  WON: "success",
  LOST: "error",
  DORMANT: "muted",
};

// ── Activity kind ───────────────────────────────────────────────────────────

export const ACTIVITY_KINDS = ["CALL", "EMAIL_OUT", "EMAIL_IN", "MEETING", "NOTE", "SYSTEM"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** Kézzel naplózható kindek — a SYSTEM-et csak a rendszer írja. */
export const MANUAL_ACTIVITY_KINDS = ["CALL", "EMAIL_OUT", "EMAIL_IN", "MEETING", "NOTE"] as const;
export type ManualActivityKind = (typeof MANUAL_ACTIVITY_KINDS)[number];

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  CALL: "Hívás",
  EMAIL_OUT: "Kimenő email",
  EMAIL_IN: "Bejövő email",
  MEETING: "Találkozó",
  NOTE: "Jegyzet",
  SYSTEM: "Rendszer",
};

// ── Quote státusz ───────────────────────────────────────────────────────────

export const QUOTE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Piszkozat",
  SENT: "Kiküldve",
  ACCEPTED: "Elfogadva",
  DECLINED: "Elutasítva",
  EXPIRED: "Lejárt",
};

export const QUOTE_STATUS_TONES: Record<QuoteStatus, CrmTone> = {
  DRAFT: "neutral",
  SENT: "warning",
  ACCEPTED: "success",
  DECLINED: "error",
  EXPIRED: "muted",
};

// ── Deal forrás ─────────────────────────────────────────────────────────────

export const DEAL_SOURCES = ["inquiry", "referral", "outbound", "event", "other"] as const;
export type DealSource = (typeof DEAL_SOURCES)[number];

export const DEAL_SOURCE_LABELS: Record<DealSource, string> = {
  inquiry: "Beérkező megkeresés",
  referral: "Ajánlás",
  outbound: "Kimenő megkeresés",
  event: "Esemény",
  other: "Egyéb",
};

// ── Win/loss tanulság (outcomeKind) ─────────────────────────────────────────

export const OUTCOME_KINDS = ["price", "timing", "no_response", "competitor", "budget", "other"] as const;
export type OutcomeKind = (typeof OUTCOME_KINDS)[number];

export const OUTCOME_KIND_LABELS: Record<OutcomeKind, string> = {
  price: "Ár",
  timing: "Időzítés",
  no_response: "Nem válaszolt",
  competitor: "Versenytárs",
  budget: "Nincs keret",
  other: "Egyéb",
};

// ── Napi hurok / ajánlat-életciklus paraméterek ─────────────────────────────

/** Halasztó chipek a „Ma” panelen és a deal-részletnézeten (nap). */
export const POSTPONE_PRESETS = [1, 3, 7, 14] as const;

/** mark_sent default érvényesség, ha nincs megadva (nap). */
export const QUOTE_DEFAULT_VALIDITY_DAYS = 30;

/** Ennyi nappal a validUntil előtt szól a sweep (CRM_QUOTE_EXPIRING). */
export const QUOTE_EXPIRING_WINDOW_DAYS = 3;
