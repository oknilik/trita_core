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
  const significantDimensionChanges = comparison.stableCoreDimensionChanges.filter(
    (item) => item.significant,
  );
  const withinErrorCount =
    comparison.stableCoreDimensionChanges.length - significantDimensionChanges.length;
  const currentDate = current.publishedAt ? new Date(current.publishedAt).toLocaleDateString(isHu ? "hu-HU" : "en-GB") : "—";
  const previousDate = previous.publishedAt ? new Date(previous.publishedAt).toLocaleDateString(isHu ? "hu-HU" : "en-GB") : "—";

  return (
    <section aria-labelledby="round-comparison-title">
      <SectionEyebrow>{isHu ? "mérési körök" : "measurement rounds"}</SectionEyebrow>
      <h2 id="round-comparison-title" className="mt-1 font-fraunces text-xl text-ink">
        {isHu ? "Mi változott az előző kör óta?" : "What changed since the previous round?"}
      </h2>
      <p className="mt-1 text-xs text-muted">{previousDate} → {currentDate}</p>
      {comparison.composition.status === "unknown" ? (
        <div className="mt-3 rounded-xl border border-state-warning-border bg-state-warning-bg p-3 text-xs text-state-warning-fg" role="status">
          {isHu
            ? "A régebbi riport nem tartalmaz hozzájáruló-pillanatképet. A csapat összetétele nem ellenőrizhető, ezért a profildeltát nem állítjuk változásként."
            : "The older report has no contributor snapshot. Team composition cannot be verified, so profile deltas are not presented as change."}
        </div>
      ) : comparison.composition.status === "changed" ? (
        <div className="mt-3 rounded-xl border border-state-warning-border bg-state-warning-bg p-3 text-xs text-state-warning-fg" role="alert">
          <p className="font-semibold">
            {isHu
              ? "A két kör összetétele nem elég hasonló a profilváltozás állításához."
              : "Round composition is not similar enough to claim profile change."}
          </p>
          <p className="mt-1">
            {isHu
              ? `Közös kitöltők: ${comparison.composition.common} · új ebben a körben: ${comparison.composition.joined} · kimaradt: ${comparison.composition.left} · átfedés: ${comparison.composition.overlapPct}%`
              : `Common contributors: ${comparison.composition.common} · new this round: ${comparison.composition.joined} · absent this round: ${comparison.composition.left} · overlap: ${comparison.composition.overlapPct}%`}
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-sage/30 bg-sage/5 p-3 text-xs text-ink-body" role="status">
          {isHu
            ? `Stabil mag: ${comparison.composition.common} közös kitöltő · új ebben a körben: ${comparison.composition.joined} · kimaradt: ${comparison.composition.left}. A profilkontrollt csak a közös tagokból számoljuk.`
            : `Stable core: ${comparison.composition.common} common contributors · new this round: ${comparison.composition.joined} · absent: ${comparison.composition.left}. Profile control uses common members only.`}
        </div>
      )}
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
          <p className="text-micro uppercase tracking-widest text-muted">{isHu ? "Stabil mag profilkontrollja" : "Stable-core profile control"}</p>
          {comparison.composition.status !== "comparable" ? (
            <p className="mt-2 text-xs text-muted">
              {isHu ? "Nem értelmezhető" : "Not interpretable"}
            </p>
          ) : significantDimensionChanges.length > 0 ? (
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
        {isHu ? "A profilnál csak a stabil mag mérési hibán túli eltérését mutatjuk; a teljes csapat átlaga kompozíciós kontextus marad. A pulse ismételt anonim keresztmetszet, ezért leíró jelzés, nem oksági bizonyíték." : "For profiles, only stable-core differences beyond measurement error are shown; the full-team average remains composition context. The pulse is a repeated anonymous cross-section, so it is descriptive, not causal evidence."}
      </p>
    </section>
  );
}
