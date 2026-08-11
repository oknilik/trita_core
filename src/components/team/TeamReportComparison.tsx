import type { SerializedTeamReport } from "@/lib/team-report";
import { compareTeamReports } from "@/lib/team-report-comparison";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

const DIMENSION_LABELS: Record<string, { hu: string; en: string }> = {
  H: { hu: "Becsületesség-Alázat", en: "Honesty-Humility" },
  E: { hu: "Emocionalitás", en: "Emotionality" },
  X: { hu: "Extraverzió", en: "Extraversion" },
  A: { hu: "Barátságosság", en: "Agreeableness" },
  C: { hu: "Lelkiismeretesség", en: "Conscientiousness" },
  O: { hu: "Nyitottság", en: "Openness" },
};

function deltaLabel(value: number): string {
  return `${value > 0 ? "+" : ""}${value}`;
}

export function TeamReportComparison({
  current,
  previous,
  isHu,
}: {
  current: SerializedTeamReport;
  previous: SerializedTeamReport;
  isHu: boolean;
}) {
  const comparison = compareTeamReports(current, previous);
  const currentDate = current.publishedAt ? new Date(current.publishedAt).toLocaleDateString(isHu ? "hu-HU" : "en-GB") : "—";
  const previousDate = previous.publishedAt ? new Date(previous.publishedAt).toLocaleDateString(isHu ? "hu-HU" : "en-GB") : "—";

  return (
    <section aria-labelledby="round-comparison-title">
      <SectionEyebrow>{isHu ? "mérési körök" : "measurement rounds"}</SectionEyebrow>
      <h2 id="round-comparison-title" className="mt-1 font-fraunces text-xl text-ink">
        {isHu ? "Mi változott az előző kör óta?" : "What changed since the previous round?"}
      </h2>
      <p className="mt-1 text-xs text-muted">{previousDate} → {currentDate}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <DashboardPanel className="p-4">
          <p className="text-micro uppercase tracking-widest text-muted">{isHu ? "Kitöltöttség" : "Completion"}</p>
          <p className="mt-1 font-fraunces text-2xl text-ink">{comparison.completionDelta === null ? "—" : `${deltaLabel(comparison.completionDelta)} pp`}</p>
        </DashboardPanel>
        <DashboardPanel className="p-4">
          <p className="text-micro uppercase tracking-widest text-muted">{isHu ? "Pszichológiai biztonság" : "Psychological safety"}</p>
          <p className="mt-1 font-fraunces text-2xl text-ink">{comparison.psychSafetyDelta === null ? "—" : deltaLabel(comparison.psychSafetyDelta)}</p>
        </DashboardPanel>
        <DashboardPanel className="p-4">
          <p className="text-micro uppercase tracking-widest text-muted">{isHu ? "Legnagyobb profilmozgások" : "Largest profile shifts"}</p>
          {comparison.dimensionChanges.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {comparison.dimensionChanges.slice(0, 3).map((item) => (
                <li key={item.code} className="flex justify-between gap-3 text-xs text-ink-body">
                  <span>{DIMENSION_LABELS[item.code]?.[isHu ? "hu" : "en"] ?? (isHu ? "Dimenzió" : "Dimension")}</span>
                  <span className="font-semibold text-ink">{deltaLabel(item.delta)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-xs text-muted">—</p>}
        </DashboardPanel>
      </div>
      <p className="mt-2 text-micro text-muted">
        {isHu ? "A változás leíró jelzés, nem oksági bizonyíték; az eltérő részvételi arányt a debriefen külön értelmezni kell." : "Change is descriptive, not causal evidence; differences in participation should be interpreted during the debrief."}
      </p>
    </section>
  );
}
