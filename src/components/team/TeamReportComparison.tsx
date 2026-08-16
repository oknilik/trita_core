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
  const significantDimensionChanges = comparison.dimensionChanges.filter(
    (item) => item.significant,
  );
  const withinErrorCount =
    comparison.dimensionChanges.length - significantDimensionChanges.length;
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
          {comparison.psychSafetyDelta === null ? (
            <p className="mt-1 font-fraunces text-2xl text-ink">—</p>
          ) : comparison.psychSafetySignificant ? (
            <p className="mt-1 font-fraunces text-2xl text-ink">
              {deltaLabel(comparison.psychSafetyDelta)}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              {isHu ? "A mérési hibán belül maradt" : "Within measurement error"}
            </p>
          )}
        </DashboardPanel>
        <DashboardPanel className="p-4">
          <p className="text-micro uppercase tracking-widest text-muted">{isHu ? "Mérési hibán túli profilmozgások" : "Profile shifts beyond measurement error"}</p>
          {significantDimensionChanges.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {significantDimensionChanges.slice(0, 3).map((item) => (
                <li key={item.code} className="flex justify-between gap-3 text-xs text-ink-body">
                  <span>{DIMENSION_LABELS[item.code]?.[isHu ? "hu" : "en"] ?? (isHu ? "Dimenzió" : "Dimension")}</span>
                  <span className="font-semibold text-ink">{deltaLabel(item.delta)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-xs text-muted">—</p>}
        </DashboardPanel>
      </div>
      {withinErrorCount > 0 ? (
        <p className="mt-2 text-micro text-muted">
          {isHu
            ? `${withinErrorCount} további dimenzióeltérés a mérési hibán belül maradt, ezért nem rangsoroljuk.`
            : `${withinErrorCount} additional dimension difference${withinErrorCount === 1 ? "" : "s"} remained within measurement error and is not ranked.`}
        </p>
      ) : null}
      <p className="mt-2 text-micro text-muted">
        {isHu ? "Csak a mérési hibán túli eltérést mutatjuk változásként. Ez leíró jelzés, nem oksági bizonyíték; az eltérő részvételi arányt a debriefen külön értelmezni kell." : "Only differences beyond measurement error are shown as change. This is descriptive, not causal evidence; differences in participation should be interpreted during the debrief."}
      </p>
    </section>
  );
}
