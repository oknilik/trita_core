// ─────────────────────────────────────────────────────────────────────
// CRM admin-UI — szerializált sortípusok. A szerver-komponensek (CrmTab,
// deal-részletnézet) ezekre képezik le a Prisma-sorokat (Date → ISO
// string), a kliens-komponensek ezekből dolgoznak. Címkék/tone-ok: a
// forrás-igazság a lib/crm/constants — itt csak adatalak van.
// ─────────────────────────────────────────────────────────────────────

/**
 * CRM alnézetek. Itt él, nem az AdminCrmSection-ben: a `"use client"`
 * modul minden exportja kliens-referenciává válik, így a szerver-oldali
 * CrmTab nem tudná meghívni az isCrmView guardot.
 */
export type CrmView = "tasks" | "pipeline" | "closed";

/** A korábbi mélylinkeket is az összevont Teendők nézetre vezetjük. */
export function resolveCrmView(value: string | undefined): CrmView {
  if (value === "pipeline" || value === "closed") return value;
  return "tasks";
}

/** Ajánlat-kivonat a deal-listákhoz (a listDeals quote-select alakja). */
export interface CrmQuoteSummary {
  id: string;
  quoteNo: number;
  status: string;
  netTotal: number;
  validUntil: string | null;
  createdAt: string;
}

import type { NewsletterEngagementDto } from "@/lib/newsletter-engagement";

/** Deal-sor a Ma/Pipeline/Lezártak nézetekhez. */
export interface CrmDealRow {
  id: string;
  title: string;
  company: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  stage: string;
  source: string;
  expectedValue: number | null;
  nextActionAt: string | null;
  nextActionNote: string | null;
  lastActivityAt: string | null;
  closedAt: string | null;
  outcomeKind: string | null;
  outcomeNote: string | null;
  createdAt: string;
  quotes: CrmQuoteSummary[];
  inquiryCount: number;
  activityCount: number;
  /** Hírlevél-elköteleződés a kapcsolattartó címére (null, ha nem feliratkozó). */
  newsletter: NewsletterEngagementDto | null;
}

/** Beérkező (NEW, deal nélküli) inquiry a kvalifikációs kapuhoz. */
export interface CrmIntakeRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  topic: string;
  message: string;
  createdAt: string;
  /** Email-match nyitott dealre → „már pipeline-ban” jelzés + csatolás-ajánlat. */
  openDealMatch: { id: string; title: string } | null;
  /** Hírlevél-elköteleződés a beküldő címére (null, ha nem feliratkozó). */
  newsletter: NewsletterEngagementDto | null;
}

export interface CrmStageGroup {
  stage: string;
  count: number;
  valueTotal: number;
  deals: CrmDealRow[];
}

export interface CrmPipelineMetrics {
  openValueTotal: number;
  outstandingSentTotal: number;
  /** 30 napos win-rate százalékban; null, ha nem zárult deal az ablakban. */
  winRate30d: number | null;
}

/** Nyitott deal a Beérkező „Csatolás meglévőhöz” választójához. */
export interface CrmOpenDealOption {
  id: string;
  title: string;
}

// ── Deal-részletnézet ───────────────────────────────────────────────────────

export interface CrmActivityRow {
  id: string;
  kind: string;
  summary: string;
  body: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface CrmDetailQuoteRow extends CrmQuoteSummary {
  title: string | null;
  discountPct: number;
  sentAt: string | null;
  decidedAt: string | null;
  declineReason: string | null;
  /** result.effectiveHourlyRate kiemelve — belső szám, admin-only felület. */
  effectiveHourlyRate: number | null;
}

export interface CrmDetailInquiryRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  topic: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface CrmDealDetailData {
  id: string;
  title: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  company: string | null;
  stage: string;
  source: string;
  expectedValue: number | null;
  nextActionAt: string | null;
  nextActionNote: string | null;
  adminNote: string | null;
  outcomeKind: string | null;
  outcomeNote: string | null;
  closedAt: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  organization: { id: string; name: string } | null;
  userProfile: { id: string; email: string | null; username: string | null } | null;
  activities: CrmActivityRow[];
  quotes: CrmDetailQuoteRow[];
  inquiries: CrmDetailInquiryRow[];
  /** Hírlevél-elköteleződés a kapcsolattartó címére (null, ha nem feliratkozó). */
  newsletter: NewsletterEngagementDto | null;
}
