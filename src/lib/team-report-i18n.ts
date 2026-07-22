// ─────────────────────────────────────────────────────────────────────
// Tanácsadói riport-narratíva fordítása (HU → EN).
//
// A tanácsadó szabad szövegeit (összefoglaló, erősségek, kockázatok,
// ajánlások, interjú-tanulságok, vezetési útmutató, akcióterv) gépi
// fordítás készíti elő (/api/team/[id]/report/translate), a tanácsadó
// átnézi/szerkeszti és JÓVÁHAGYJA — csak a jóváhagyott fordítás jelenik
// meg a felhasználónak, amikor angolul kéri le a riportot.
//
// A fordítás a TeamReport.translationsEn JSON-oszlopban él (külön a
// befagyasztott aggregátumtól, mert azt a preview/publish újraépíti).
// Prisma-mentes modul: kliens-oldalon is importálható.
// ─────────────────────────────────────────────────────────────────────

export interface TranslatedActionItem {
  title: string;
  description: string;
  timeframe: "30" | "60" | "90";
}

export interface ReportTranslationEn {
  /** draft = generált, még nem hagyta jóvá; approved = megjeleníthető. */
  status: "draft" | "approved";
  translatedAt: string;
  approvedAt?: string | null;
  summary?: string | null;
  strengths?: string | null;
  risks?: string | null;
  recommendations?: string | null;
  interviewFindings?: string | null;
  leadershipGuide?: string | null;
  actionItems?: TranslatedActionItem[] | null;
}

export interface ReportTranslations {
  en?: ReportTranslationEn | null;
}

export function parseReportTranslations(value: unknown): ReportTranslations | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const en = (value as { en?: unknown }).en;
  if (!en || typeof en !== "object") return null;
  const status = (en as { status?: unknown }).status;
  if (status !== "draft" && status !== "approved") return null;
  return value as ReportTranslations;
}

/** A lokalizáláshoz szükséges minimális riport-alak (SerializedTeamReport-kompatibilis). */
interface LocalizableReport {
  summary: string | null;
  strengths: string | null;
  risks: string | null;
  recommendations: string | null;
  interviewFindings: string | null;
  leadershipGuide: string | null;
  actionItems: TranslatedActionItem[] | null;
  translationsEn?: ReportTranslations | null;
}

/**
 * A riport narratív mezőit a kért nyelvre oldja fel: angol lekérésnél a
 * JÓVÁHAGYOTT fordítás mezői lépnek a magyar eredeti helyére (mezőnként,
 * fallback az eredetire), magyarnál / jóváhagyás híján az eredeti marad.
 */
export function localizeTeamReport<T extends LocalizableReport>(
  report: T,
  isHu: boolean,
): T {
  if (isHu) return report;
  const en = report.translationsEn?.en;
  if (!en || en.status !== "approved") return report;
  return {
    ...report,
    summary: en.summary ?? report.summary,
    strengths: en.strengths ?? report.strengths,
    risks: en.risks ?? report.risks,
    recommendations: en.recommendations ?? report.recommendations,
    interviewFindings: en.interviewFindings ?? report.interviewFindings,
    leadershipGuide: en.leadershipGuide ?? report.leadershipGuide,
    actionItems:
      en.actionItems && en.actionItems.length > 0
        ? en.actionItems
        : report.actionItems,
  };
}
