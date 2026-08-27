import type { SerializedTeamReport } from "@/lib/team-report";
import { localizeTeamReport } from "@/lib/team-report-i18n";
import { extractNarrativeHighlights } from "@/lib/team-report-presentation";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

export function TeamWorkshopFacilitatorView({ report, isHu }: { report: SerializedTeamReport; isHu: boolean }) {
  const localized = localizeTeamReport(report, isHu);
  const strengths = extractNarrativeHighlights(localized.strengths);
  const risks = extractNarrativeHighlights(localized.risks);

  return (
    <details className="rounded-[18px] border border-sand bg-surface-card shadow-[0_10px_28px_rgba(26,26,46,0.04)]">
      <summary className="min-h-[52px] cursor-pointer list-none px-5 py-4 [&::-webkit-details-marker]:hidden">
        <SectionEyebrow>{isHu ? "facilitátori nézet" : "facilitator view"}</SectionEyebrow>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-fraunces text-xl text-ink">{isHu ? "90 perces csapatworkshop" : "90-minute team workshop"}</h2>
          <span className="text-xs font-semibold text-sage-dark">{isHu ? "Menetrend megnyitása ↓" : "Open agenda ↓"}</span>
        </div>
      </summary>
      <div className="border-t border-sand p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {[
            ["00–10", isHu ? "Keret és biztonság" : "Frame and safety"],
            ["10–30", isHu ? "Erősségek" : "Strengths"],
            ["30–50", isHu ? "Kockázatok" : "Risks"],
            ["50–75", isHu ? "Akciók" : "Actions"],
            ["75–90", isHu ? "Elköteleződés" : "Commitment"],
          ].map(([time, label]) => (
            <div key={time} className="rounded-xl border border-sand bg-cream/50 p-3">
              <p className="font-mono text-micro text-muted">{time}</p>
              <p className="mt-1 text-xs font-semibold text-ink">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <DashboardPanel className="p-4">
            <p className="text-xs font-semibold text-ink">{isHu ? "Indító kérdés" : "Opening question"}</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-body">{isHu ? "Melyik állítás írja le legjobban azt, ahogyan most együtt dolgozunk?" : "Which statement best describes how we work together today?"}</p>
          </DashboardPanel>
          <DashboardPanel className="p-4">
            <p className="text-xs font-semibold text-ink">{isHu ? "Megvitatandó jelek" : "Signals to discuss"}</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-body">{[...strengths.slice(0, 1), ...risks.slice(0, 1)].join(" · ") || "–"}</p>
          </DashboardPanel>
          <DashboardPanel className="p-4">
            <p className="text-xs font-semibold text-ink">{isHu ? "Kötelező kimenet" : "Required output"}</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-body">{isHu ? "Minden vállaláshoz felelős, határidő és első státusz; az elakadás definícióját is mondjátok ki." : "Every commitment gets an owner, due date and initial status; agree what counts as blocked."}</p>
          </DashboardPanel>
        </div>
        <p className="mt-4 rounded-xl bg-sage/5 px-3 py-2 text-xs leading-relaxed text-ink-body">
          {isHu ? "Facilitátori guardrail: a becsült jeleket hipotézisként, a mért jeleket forrással nevezd meg; egyéni adatot ne vezess vissza a csapat elé." : "Facilitator guardrail: frame estimated signals as hypotheses and name the source of measured signals; never expose individual data to the group."}
        </p>
      </div>
    </details>
  );
}
