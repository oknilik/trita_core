import { TEAM_ROLES } from "@/lib/team-role-scoring";
import type { SerializedTeamReport } from "@/lib/team-report";
import { DashboardPanel, DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";

const DIM_LABELS: Record<string, { hu: string; en: string }> = {
  H: { hu: "Őszinteség", en: "Honesty" },
  E: { hu: "Érzelmesség", en: "Emotionality" },
  X: { hu: "Extraverzió", en: "Extraversion" },
  A: { hu: "Barátságosság", en: "Agreeableness" },
  C: { hu: "Lelkiismeretesség", en: "Conscientiousness" },
  O: { hu: "Nyitottság", en: "Openness" },
};

function NarrativeSection({
  label,
  text,
}: {
  label: string;
  text: string | null;
}) {
  if (!text || text.trim().length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-body">{text}</p>
    </div>
  );
}

export function TeamReportView({
  report,
  isHu,
}: {
  report: SerializedTeamReport;
  isHu: boolean;
}) {
  const agg = report.aggregates;
  const publishedDate = report.publishedAt
    ? new Date(report.publishedAt).toLocaleDateString(isHu ? "hu-HU" : "en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Fejléc */}
      <DashboardPanel className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-bronze">
              {isHu ? "// validált csapatkép" : "// validated team picture"}
            </p>
            <h2 className="mt-1 font-fraunces text-2xl text-ink">
              {report.title ?? (isHu ? "Csapatkép" : "Team picture")}
            </h2>
            {publishedDate && (
              <p className="mt-1 text-xs text-muted">
                {isHu ? "Tanácsadó által validálva · " : "Validated by consultant · "}
                {publishedDate}
              </p>
            )}
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {isHu ? "Publikált" : "Published"}
          </span>
        </div>
      </DashboardPanel>

      {/* Aggregátumok */}
      {agg && (
        <section>
          <DashboardSectionHeader
            label={isHu ? "Aggregált csapatprofil" : "Aggregate team profile"}
            className="mb-4"
          />
          <DashboardPanel className="p-6">
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {isHu ? "Tagok" : "Members"}
                </p>
                <p className="mt-1 font-fraunces text-2xl text-ink">{agg.memberCount}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {isHu ? "Kitöltöttség" : "Completion"}
                </p>
                <p className="mt-1 font-fraunces text-2xl text-ink">{agg.completionPct}%</p>
              </div>
              {agg.pattern && (
                <div className="col-span-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {isHu ? "Csapatmintázat" : "Team pattern"}
                  </p>
                  <p className="mt-1 font-fraunces text-lg leading-tight text-ink">
                    {agg.pattern.label}
                  </p>
                </div>
              )}
            </div>

            {agg.dimensionAverages && (
              <div className="flex flex-col gap-2 border-t border-sand pt-4">
                {Object.entries(agg.dimensionAverages).map(([dim, value]) => (
                  <div key={dim} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 text-xs text-ink-body">
                      {DIM_LABELS[dim] ? (isHu ? DIM_LABELS[dim].hu : DIM_LABELS[dim].en) : dim}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                      <div
                        className="h-full rounded-full bg-sage"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right font-mono text-xs text-ink">
                      {value}
                      {agg.dimensionSpread?.[dim] !== undefined && (
                        <span className="text-muted"> ±{agg.dimensionSpread[dim]}</span>
                      )}
                    </span>
                  </div>
                ))}
                <p className="mt-1 text-[10px] text-muted">
                  {isHu
                    ? "Csapatátlag ± szórás — egyéni értékek nem jelennek meg."
                    : "Team average ± spread — individual values are not shown."}
                </p>
              </div>
            )}

            {agg.roleDistribution && Object.keys(agg.roleDistribution.counts).length > 0 && (
              <div className="mt-4 border-t border-sand pt-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                  {isHu ? "Csapatszerep-eloszlás" : "Team role distribution"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(agg.roleDistribution.counts).map(([role, count]) => (
                    <span
                      key={role}
                      className="rounded-full border border-sand bg-cream px-2.5 py-1 text-xs text-ink-body"
                    >
                      {TEAM_ROLES[role as keyof typeof TEAM_ROLES]
                        ? isHu
                          ? TEAM_ROLES[role as keyof typeof TEAM_ROLES].hu
                          : TEAM_ROLES[role as keyof typeof TEAM_ROLES].en
                        : role}{" "}
                      · {count}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-muted">
                  {isHu
                    ? `${agg.roleDistribution.questionnaireCount} valódi kitöltés · ${agg.roleDistribution.estimateCount} becslés`
                    : `${agg.roleDistribution.questionnaireCount} real fill-out · ${agg.roleDistribution.estimateCount} estimated`}
                </p>
              </div>
            )}
          </DashboardPanel>
        </section>
      )}

      {/* Tanácsadói narratíva */}
      <section>
        <DashboardSectionHeader
          label={isHu ? "Tanácsadói értékelés" : "Consultant assessment"}
          className="mb-4"
        />
        <DashboardPanel className="flex flex-col gap-5 p-6">
          <NarrativeSection label={isHu ? "Összefoglaló" : "Summary"} text={report.summary} />
          <NarrativeSection label={isHu ? "Erősségek" : "Strengths"} text={report.strengths} />
          <NarrativeSection label={isHu ? "Kockázatok" : "Risks"} text={report.risks} />
          <NarrativeSection
            label={isHu ? "Ajánlások" : "Recommendations"}
            text={report.recommendations}
          />
          <NarrativeSection
            label={isHu ? "Interjúk tanulságai" : "Interview insights"}
            text={report.interviewFindings}
          />
          {!report.summary &&
            !report.strengths &&
            !report.risks &&
            !report.recommendations &&
            !report.interviewFindings && (
              <p className="text-sm text-muted">
                {isHu ? "Nincs narratív értékelés." : "No narrative assessment."}
              </p>
            )}
        </DashboardPanel>
      </section>
    </div>
  );
}
