import { t, type Locale } from "@/lib/i18n";
import { AXES } from "./questions";
import { operatingIdentity } from "./identity";
import { OPERATING_PATTERNS } from "./patterns";
import { compareTeamPatterns, COMPOSITION_AXES, type TeamStyleSnapshot } from "./comparison";

export interface StyleSection {
  title: string; heading?: string; notes: string[];
  rows: Array<{ label: string; detail: string }>;
  prompts: Array<{ title: string; context: string; support: string; tension: string }>;
}
/** Shared by web/member/PDF: one ordering, one uncertainty and evidence contract. */
export function presentTeamStyle(snapshot: TeamStyleSnapshot | null | undefined, locale: Locale,
  legacyPattern?: string | null): StyleSection[] {
  void legacyPattern; // Historical names remain stored but are never displayed.
  const tr = (key: string) => t(`tos.report.${key}`, locale);
  const num = (v: number) => v.toLocaleString(locale === "hu" ? "hu-HU" : "en-GB", { maximumFractionDigits: 1 });
  const op = snapshot?.operating;
  const comp = snapshot?.composition;
  const operating: StyleSection = { title: tr("operating"), heading: operatingIdentity(snapshot, locale).label, notes: [tr("experimental")], rows: [], prompts: [] };
  if (!op) operating.notes.push(tr("noOperating"));
  else {
    const allMixed = AXES.every((axis) => op.axes[axis].pole === "mixed");
    const date = (v: string) => new Date(v).toLocaleDateString(locale === "hu" ? "hu-HU" : "en-GB", { timeZone: "UTC" });
    operating.notes.push(`${t("tos.window", locale)}: ${date(op.referenceStart)} – ${date(op.referenceEnd)}`);
    if (op.pattern?.status === "tentative") operating.notes.push(tr("tentative"));
    if (op.patternUnavailableReason) operating.notes.push(tr(`reasons.${op.patternUnavailableReason}`));
    if (op.pattern?.alternativeCodes.length && !allMixed) operating.notes.push(`${tr("alternatives")}: ${op.pattern.alternativeCodes.map((c) => OPERATING_PATTERNS[c][locale]).join(", ")}`);
    operating.rows = AXES.map((axis) => {
      const a = op.axes[axis];
      return { label: `${t(`tos.axes.${axis}.name`, locale)}: ${t(`tos.axes.${axis}.left`, locale)} ↔ ${t(`tos.axes.${axis}.right`, locale)}`,
        detail: [a.mean === null ? tr("insufficient") : `${tr("mean")}: ${num(a.mean)}/100 · ${tr("sd")}: ${num(a.sd!)}`,
          `${tr("coverage")}: ${a.n}/${op.eligibleCount} (${num(a.coverage * 100)}%)`,
          ...(a.leftFrequency === null ? [] : [`${tr("frequencies")}: ${num(a.leftFrequency)} / ${num(a.rightFrequency!)}`]),
          ...a.flags.map((f) => tr(`flags.${f}`)),
        ].join(" · ") };
    });
  }
  const composition: StyleSection = { title: tr("composition"), heading: undefined,
    notes: [tr("compositionSource")], rows: [], prompts: [] };
  if (!comp) composition.notes.push(tr("noComposition"));
  if (comp) {
    if (comp.stability !== "stabil") composition.notes.push(tr("compositionTentative"));
    composition.rows = COMPOSITION_AXES.map((axis) => ({ label: tr(axis),
      detail: `${tr("mean")}: ${num(comp.axes[axis].mean)}/100 · ${tr("sd")}: ${num(comp.axes[axis].sd)} · n=${comp.memberCount}` }));
  }
  const comparison: StyleSection = { title: tr("comparison"), notes: [tr("comparisonNote")], rows: [], prompts: [] };
  if (snapshot?.sameRespondents === false) comparison.notes.push(tr("cohort"));
  // Rebuild display prompts from frozen aggregates, also for older snapshots whose
  // comparison was null solely because no single operating type could be assigned.
  const prompts = compareTeamPatterns(op ?? null, comp ?? null);
  if (prompts && op && comp) {
    if (!op.pattern) comparison.notes.push(tr("dimensionComparison"));
    comparison.heading = undefined;
    comparison.prompts = prompts.prompts.map((p) => ({
      title: `${t(`tos.axes.${p.operatingAxis}.name`, locale)} × ${tr(p.compositionAxis)}`,
      context: `${tr("mean")}: ${num(op.axes[p.operatingAxis].mean!)}/100 · ${tr(p.compositionAxis)}: ${num(comp.axes[p.compositionAxis].mean)}/100. ${t(`tos.report.grades.${comp.axes[p.compositionAxis].grade}`, locale)}`,
      support: p.support[locale], tension: p.tension[locale],
    }));
  } else {
    comparison.notes.push(!op ? tr("noOperating") : !comp ? tr("noComposition") :
      op.patternUnavailableReason ? tr(`reasons.${op.patternUnavailableReason}`) : tr("noComparison"));
  }
  return [operating, composition, comparison];
}
