import { ProgramTrustCoverage } from "./ProgramTrustCoverage";
import { ProgramComparison } from "./ProgramComparison";
import { personalitySourceLabel } from "@/lib/programs/report";
import type { SerializedTeamReport } from "@/lib/team-report";
import { hasApprovedEnTranslation, localizeTeamReport } from "@/lib/team-report-i18n";
import { reportAttentionSignals, reportNextStep } from "@/lib/team-report-reader";
import { TeamOperatingStyleReport, TeamStyleMeasurements } from "./TeamOperatingStyleReport";
import { TeamReportMeasurements } from "./TeamReportMeasurements";
import { TeamReportTabs } from "./TeamReportTabs";
import { TeamReportPdfButton } from "./TeamReportPdfButton";
import { TeamActionTracker } from "./TeamActionTracker";
import { NarrativeRich } from "./TeamReportNarrative";
export { NarrativeRich } from "./TeamReportNarrative";

export function TeamReportView({ report: reportInput, isHu, canManageActions = false }: {
  report: SerializedTeamReport; isHu: boolean; canManageActions?: boolean;
}) {
  const report = localizeTeamReport(reportInput, isHu);
  const agg = report.aggregates;
  const locale = isHu ? "hu" : "en";
  const signals = reportAttentionSignals(agg, isHu);
  const next = reportNextStep(report, isHu);
  const narratives = [
    { label: isHu ? "Összegzés" : "Summary", text: report.summary, tone: "sage" as const },
    { label: isHu ? "Amire építhettek" : "What you can build on", text: report.strengths, tone: "emerald" as const },
    { label: isHu ? "Amit érdemes tisztázni" : "What needs attention", text: report.risks, tone: "amber" as const },
    { label: isHu ? "Ajánlások" : "Recommendations", text: report.recommendations, tone: "sage" as const },
    { label: isHu ? "Interjúk tanulságai" : "Interview insights", text: report.interviewFindings, tone: "bronze" as const },
    { label: isHu ? "Vezetői iránytű" : "Leadership guide", text: report.leadershipGuide, tone: "sky" as const },
  ].filter((section) => section.text?.trim());
  const date = report.publishedAt ? new Date(report.publishedAt).toLocaleDateString(isHu ? "hu-HU" : "en-GB", { timeZone: "UTC" }) : null;

  return <div className="mx-auto w-full max-w-5xl space-y-6">
    <header className="flex flex-col items-start justify-between gap-5 py-2 sm:flex-row sm:py-4">
      <div className="w-full min-w-0 flex-1 sm:w-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-bronze">{isHu ? "Csapatkép" : "Team picture"}</p>
        <h2 className="mt-2 break-words font-fraunces text-3xl leading-tight text-ink sm:text-4xl">{report.title || (isHu ? "Értsétek meg. Alakítsátok együtt." : "Understand it. Shape it together.")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {agg ? (isHu ? `${agg.memberCount} fős csapat` : `${agg.memberCount} team members`) : ""}
          {date ? ` · ${isHu ? "Jóváhagyva" : "Approved"}: ${date}` : ""}
        </p>
      </div>
      {report.status === "PUBLISHED" ? <TeamReportPdfButton report={report} isHu={isHu} /> :
        <span className="rounded-full bg-state-warning-bg px-3 py-1.5 text-xs font-medium text-state-warning-fg">{isHu ? "Vázlat-előnézet" : "Draft preview"}</span>}
    </header>
    <ProgramComparison program={agg?.program} isHu={isHu} />
    <ProgramTrustCoverage program={agg?.program} isHu={isHu} />
    <TeamReportTabs isHu={isHu}
      overview={<>
        <div className="overflow-hidden rounded-2xl border border-sand bg-surface-card px-5 sm:px-8">
          <TeamOperatingStyleReport personalitySource={personalitySourceLabel(agg?.program, isHu)} snapshot={agg?.teamStyle} locale={locale} mode="overview" averages={agg?.dimensionAverages} spread={agg?.dimensionSpread} personalityCount={agg?.completedCount} />
          {signals.length > 0 && <section className="border-t border-sand py-6">
            <h2 className="font-fraunces text-xl text-ink">{isHu ? "Ami most külön figyelmet kér" : "What needs attention now"}</h2>
            <ul className="mt-4 space-y-3">{signals.map((signal) => <li key={signal} className="rounded-xl border border-state-warning-border bg-state-warning-bg px-4 py-3 text-sm leading-relaxed text-state-warning-fg">{signal}</li>)}</ul>
          </section>}
          {narratives.length > 0 && <section className="border-t border-sand py-6">
            <h2 className="font-fraunces text-xl text-ink">{isHu ? "Mit érdemes ebből továbbvinni?" : "What should you take forward?"}</h2>
            {!isHu && !hasApprovedEnTranslation(reportInput) && <p className="mt-3 text-sm text-state-warning-fg">The consultant&apos;s text is shown in the Hungarian original. English translation is awaiting approval.</p>}
            <div className="mt-5 space-y-5">{narratives.map((section) => <NarrativeRich key={section.label} {...section} card={false} />)}</div>
          </section>}
          <section className="border-t border-sand py-6">
            <h2 className="font-fraunces text-xl text-ink">{isHu ? "Mi legyen a következő lépés?" : "What is the next step?"}</h2>
            <div className="mt-4 rounded-xl bg-sage/10 p-5 sm:p-6">
              <p className="text-xs font-semibold text-sage-dark">{next.kind === "recorded" ? isHu ? "Rögzített akció" : "Recorded action" : next.kind === "review" ? isHu ? "Javasolt visszatekintés" : "Suggested review" : isHu ? "Javasolt műhelylépés · még nem közös vállalás" : "Suggested workshop step · not yet a commitment"}</p>
              <h3 className="mt-2 font-fraunces text-2xl leading-snug text-ink">{next.title}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-body">{next.description}</p>
              <dl className="mt-5 grid gap-4 border-t border-sage/20 pt-4 sm:grid-cols-2">
                <div><dt className="text-xs text-muted">{isHu ? "Ki hozza össze?" : "Who brings it together?"}</dt><dd className="mt-1 text-sm text-ink">{next.owner}</dd></div>
                <div><dt className="text-xs text-muted">{isHu ? "Mikor?" : "When?"}</dt><dd className="mt-1 text-sm text-ink">{next.when}</dd></div>
              </dl>
            </div>
          </section>
        </div>
      </>}
      measurements={<div className="space-y-6">
        <div><h2 className="font-fraunces text-2xl text-ink">{isHu ? "A számok és a forrásuk." : "The data and its sources."}</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{isHu ? "Itt találjátok az átlagokat, a szórást, a lefedettséget és a további mérések részletes eredményeit." : "Explore means, spread, coverage and the detailed results of additional measurements here."}</p></div>
        <p className="text-xs text-muted">{personalitySourceLabel(agg?.program, isHu)}</p>
        <TeamStyleMeasurements snapshot={agg?.teamStyle} locale={locale} />
        <TeamReportMeasurements report={report} isHu={isHu} />
      </div>}
      followUp={<div className="space-y-5">
        <div><h2 className="font-fraunces text-2xl text-ink">{isHu ? "Mit próbálunk ki, és mi vált be?" : "What will we try, and what worked?"}</h2><p className="mt-2 text-sm leading-relaxed text-muted">{isHu ? "A rögzített lépések, a felelősök és az ellenőrzési időpontok egy helyen." : "Recorded steps, owners and review dates in one place."}</p></div>
        {report.actionItems?.length ? <TeamActionTracker key={`${report.id}-${report.updatedAt}`} teamId={report.teamId} reportId={report.id} initialItems={report.actionItems} isHu={isHu} canManage={canManageActions && report.status === "PUBLISHED"} /> :
          <div className="rounded-2xl border border-sand bg-surface-card p-6"><h3 className="font-fraunces text-xl text-ink">{isHu ? "Még nincs rögzített vállalás." : "No commitments recorded yet."}</h3><p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-body">{isHu ? "A közös értelmezés után a tanácsadó a riport akciótervében rögzítheti, mit próbáltok ki. Ezután itt követhetitek a felelőst, a határidőt és az állapotot." : "After the debrief, the consultant can record what you will try in the report's action plan. You can then track owners, due dates and status here."}</p></div>}
        <div className="border-t border-sand pt-4"><p className="text-sm font-semibold text-ink">{isHu ? "A visszatekintés három kérdése" : "Three questions for your review"}</p><p className="mt-2 text-sm leading-relaxed text-muted">{isHu ? "Mi történt a gyakorlatban? Mi segített? Mit tartunk meg, módosítunk vagy engedünk el?" : "What happened in practice? What helped? What will we keep, change or stop?"}</p></div>
      </div>}
    />
  </div>;
}
