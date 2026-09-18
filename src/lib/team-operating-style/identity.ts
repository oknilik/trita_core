import { t, type Locale } from "@/lib/i18n";
import { AXES } from "./questions";
import { cataloguePattern } from "./catalogue";
import type { TeamStyleSnapshot } from "./comparison";

/** The only public team-type identity comes from measured operating behavior. */
export function operatingIdentity(snapshot: TeamStyleSnapshot | null | undefined, locale: Locale) {
  const op = snapshot?.operating;
  const tr = (key: string) => t(`tos.report.${key}`, locale);
  if (!op) return { code: null, status: "missing" as const, label: locale === "hu" ? "Még nincs mért csapatminta" : "No measured team pattern yet", note: tr("noOperating") };
  const mixed = AXES.every(axis => op.axes[axis].pole === "mixed");
  const pattern = !mixed && op.pattern ? cataloguePattern(op.pattern.code) : null;
  if (!pattern || op.patternUnavailableReason) return { code: null, status: "unavailable" as const, label: mixed ? tr("mixed") : tr("insufficient"), note: op.patternUnavailableReason ? tr(`reasons.${op.patternUnavailableReason}`) : tr("nearMiddleHelp") };
  const tentative = op.pattern!.status === "tentative";
  return { code: pattern.code, status: tentative ? "tentative" as const : "descriptive" as const,
    label: tentative ? `${pattern.name[locale]} · ${tr("tentative")}` : pattern.name[locale],
    note: tentative ? tr("tentative") : pattern.description[locale] };
}
