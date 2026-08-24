import Link from "next/link";
import { t } from "@/lib/i18n";
import { DashboardPanel, DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { RadarLegendNote } from "@/components/dashboard/RadarLegendNote";
import type { SerializedTeamReport } from "@/lib/team-report";
import {
  hasApprovedEnTranslation,
  localizeTeamReport,
} from "@/lib/team-report-i18n";
import { NarrativeRich } from "@/components/team/TeamReportView";
import {
  buildMemberReportViewModel,
  type MemberViewerInput,
} from "@/lib/team-report-member";

// Tag-nézet: a sima csapattag (ORG_MEMBER) szűkebb, SAJÁT szemszögű nézete a
// publikált csapatképről. Kizárólag pozitív/építő metszet; más egyénről semmi.
// Terv: docs/product/feature-ideas.md #4. A menedzser/admin a teljes
// TeamReportView-t látja; a szerep-elágazás a team oldalon (report tab) dől el.

// Dimenzió-színek — a kanonikus HEXACO-paletta (color-system.ts), a team
// oldal / TeamReportView palettájával azonos forrásból (mark = base).
import { DIMENSION_BASE } from "@/lib/color-system";
import { ChevronRightIcon } from "@/components/ui/icons";

const DIM_COLORS: Record<string, string> = DIMENSION_BASE;

// A tipp-sorszámok akcentus-színei — sorban, nem ciklizálva. Brand-akcentek
// (zsálya/bronz/szilva): a sky/amber adat- és státusz-hue-k itt dekoratívan
// éltek — kivezetve (2026-08 szín-rendszer).
const TIP_ACCENTS = [
  "bg-sage",
  "bg-bronze",
  "bg-[var(--color-layer-team-accent)]",
] as const;
const TIP_BORDERS = [
  "border-l-sage/60",
  "border-l-bronze/60",
  "border-l-[var(--color-layer-team-bright)]/60",
] as const;

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function TeamReportMemberView({
  report: reportInput,
  viewer,
  isHu,
  teamName,
}: {
  report: SerializedTeamReport;
  viewer: MemberViewerInput | null;
  isHu: boolean;
  teamName?: string | null;
}) {
  const loc: "hu" | "en" = isHu ? "hu" : "en";
  // Angol lekérésnél a jóváhagyott tanácsadói fordítás (team-report-i18n).
  const report = localizeTeamReport(reportInput, isHu);
  const vm = buildMemberReportViewModel(report, viewer, loc);
  const title = teamName ?? report.title ?? (isHu ? "Csapat" : "Team");

  const radarDims = vm.dims.map((d) => ({
    code: d.code,
    color: DIM_COLORS[d.code] ?? "var(--color-sage)",
    score: d.self,
    observerScore: d.teamAvg,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Fejléc — gradiens sáv + avatár */}
      <DashboardPanel className="overflow-hidden p-0">
        <div className="bg-gradient-to-r from-sage/15 via-cream/70 to-[var(--color-surface-card)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-sage font-fraunces text-lg font-semibold text-[var(--color-action-primary-fg)] shadow-[0_6px_16px_rgba(107,138,99,0.35)]">
                {initialsOf(vm.memberName)}
              </div>
              <div>
                <SectionEyebrow>
                  {isHu ? "a te nézeted" : "your view"}
                </SectionEyebrow>
                <h2 className="mt-0.5 font-fraunces text-2xl text-ink">
                  {isHu ? `${title} — a te szemszögedből` : `${title} — from your perspective`}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {isHu
                    ? "A saját eredményed a csapat tanácsadó által jóváhagyott, összesített képéhez mérve. Másokról egyéni adatot nem mutatunk."
                    : "Your own result measured against the team's consultant-approved aggregate picture. We don't show individual data about others."}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[var(--color-surface-card)]/80 px-3 py-1 text-xs font-semibold text-sage-dark shadow-sm ring-1 ring-sage/25">
              {isHu ? "Tag-nézet" : "Member view"}
            </span>
          </div>
        </div>
      </DashboardPanel>

      {/* 1. Te a csapatban — radar-összevetés + színes sávok */}
      {vm.hasSelfComparison ? (
        <section>
          <DashboardSectionHeader
            label={isHu ? "Te a csapatban" : "You in the team"}
            className="mb-4"
          />
          <DashboardPanel className="p-6">
            <p className="mb-5 text-sm text-ink-body">
              {isHu
                ? "A te profilod a csapat összesített képéhez mérve. Itt csak a saját értékeid láthatók — másokéi nem."
                : "Your profile measured against the team's aggregate picture. Only your own values are shown here."}
            </p>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
              {radarDims.length >= 3 && (
                <div className="mx-auto w-full max-w-[300px]">
                  <RadarChart
                    dimensions={radarDims}
                    showObserver
                    uid={`member-${report.id}`}
                  />
                  <RadarLegendNote
                    selfLabel={isHu ? "Te" : "You"}
                    observerLabel={isHu ? "Csapatátlag" : "Team average"}
                  />
                </div>
              )}

              <div className="flex flex-col gap-3">
                {vm.dims.map((d) => {
                  const color = DIM_COLORS[d.code] ?? "var(--color-sage)";
                  const bandStart = Math.max(0, d.teamAvg - d.teamSpread);
                  const bandEnd = Math.min(100, d.teamAvg + d.teamSpread);
                  const delta = d.self - d.teamAvg;
                  return (
                    <div
                      key={d.code}
                      className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3"
                    >
                      <span className="flex items-center gap-1.5 text-xs text-ink-body md:w-32 md:shrink-0">
                        <span
                          className="h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {d.label}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
                        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-sand">
                          <div
                            className="absolute inset-y-0 rounded-full opacity-25"
                            style={{
                              left: `${bandStart}%`,
                              width: `${Math.max(0, bandEnd - bandStart)}%`,
                              backgroundColor: color,
                            }}
                          />
                          <div
                            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
                            style={{ left: `${d.self}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="w-20 shrink-0 text-right font-mono text-xs text-ink md:w-24">
                          <b>{d.self}</b>
                          <span className="text-muted"> · {d.teamAvg}</span>
                        </span>
                        <span className="w-10 shrink-0 text-right md:w-12">
                          {d.aboveTeam ? (
                            <span className="rounded-full bg-sage/15 px-1.5 py-0.5 font-mono text-micro font-semibold text-sage-dark">
                              +{delta}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {/* A sáv-magyarázat ±-jel nélkül (2026-08-11 termékdöntés:
                    ± jelölés nem kerül a felületre) — a sáv grafika marad. */}
                <p className="mt-1 text-micro text-muted">
                  {isHu
                    ? "Színes pont = a te értéked · halvány sáv = a csapat átlaga körüli jellemző tartomány."
                    : "Colored dot = your value · faint band = the team's typical range around the average."}
                </p>
              </div>
            </div>

            {vm.complementLabels.length > 0 && (
              <div className="mt-5 flex items-start gap-3 rounded-[14px] border border-sage/30 bg-sage/10 px-4 py-3.5">
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sage text-[var(--color-action-primary-fg)]">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2v5M8 2l3 3M8 2L5 5M3 10.5C3 12 5 14 8 14s5-2 5-3.5" />
                  </svg>
                </span>
                <p className="text-sm leading-relaxed text-ink-body">
                  <span className="font-semibold text-ink">
                    {isHu ? "Ahol a leginkább kiegészíted a csapatot: " : "Where you complement the team most: "}
                  </span>
                  {vm.complementLabels.join(isHu ? " és " : " and ")}
                  {isHu
                    ? " — ezekben te viszed előre a csapatot. A többi dimenzióban közel vagy a csapat átlagához."
                    : " — you lead the team here. In the other dimensions you're close to the team average."}
                </p>
              </div>
            )}
          </DashboardPanel>
        </section>
      ) : (
        <section>
          <DashboardSectionHeader
            label={isHu ? "Te a csapatban" : "You in the team"}
            className="mb-4"
          />
          <DashboardPanel tone="cream" className="p-6">
            <p className="text-sm text-ink-body">
              {isHu
                ? "Ahhoz, hogy magadat is lásd a csapat tükrében, töltsd ki a saját felmérésedet."
                : "To see yourself in the team's mirror too, complete your own assessment."}
            </p>
            <Link
              href="/assessment"
              className="mt-3 inline-flex min-h-[38px] items-center rounded-lg bg-sage px-4 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark"
            >
              {isHu ? "A felmérésem kitöltése" : "Complete my assessment"}
            </Link>
          </DashboardPanel>
        </section>
      )}

      {/* 2. A te szereped — medál + illeszkedés-kártya */}
      {vm.primaryRole && (
        <section>
          <DashboardSectionHeader
            label={isHu ? "A te szereped a csapatban" : "Your role in the team"}
            className="mb-4"
          />
          <DashboardPanel className="p-6">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex flex-shrink-0 flex-col items-center gap-1.5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sage to-sage-dark font-mono text-lg font-bold text-[var(--color-action-primary-fg)] shadow-[0_8px_20px_rgba(107,138,99,0.35)]">
                  {vm.primaryRole.code}
                </div>
                {vm.roleFit === "rare" ? (
                  <span className="rounded-full bg-state-warning-bg px-2 py-0.5 text-micro font-semibold uppercase tracking-wide text-state-warning-fg ring-1 ring-state-warning-border">
                    {isHu ? "kulcsszerep" : "key role"}
                  </span>
                ) : vm.roleFit === "shared" ? (
                  <span className="rounded-full bg-state-info-bg px-2 py-0.5 text-micro font-semibold uppercase tracking-wide text-layer-org-bright ring-1 ring-state-info-border">
                    {isHu ? "közös erő" : "shared strength"}
                  </span>
                ) : null}
              </div>

              <div className="min-w-[220px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-fraunces text-xl text-ink">{vm.primaryRole.label}</span>
                  {/* Forrás-badge (hitelességi alapelv): mért kitöltés vs
                      profil-alapú becslés — a TeamRoleSection sage/amber
                      konvenciójával. Becsült szerep jelöletlenül mértnek
                      látszana. */}
                  {vm.roleSource && (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-micro font-semibold ${
                        vm.roleSource === "questionnaire"
                          ? "bg-sage/15 text-sage-dark"
                          : "bg-state-warning-bg text-state-warning-fg"
                      }`}
                    >
                      {vm.roleSource === "questionnaire"
                        ? t("teamComp.sourceMeasuredBadge", loc)
                        : t("teamComp.sourceEstimateBadge", loc)}
                    </span>
                  )}
                  {vm.secondaryRole && (
                    <span className="rounded-full border border-sand bg-cream px-2.5 py-0.5 text-xs text-ink-body">
                      {isHu ? "másodlagos: " : "secondary: "}
                      {vm.secondaryRole.label}
                    </span>
                  )}
                </div>
                {vm.roleSource === "estimate" && (
                  <p className="mt-1 text-micro text-muted">
                    {isHu
                      ? "A személyiségprofilodból becsült szerep — a csapatszerep-kérdőív kitöltésével mért adatra cserélheted."
                      : "A role estimated from your personality profile — complete the team-role questionnaire to replace it with measured data."}
                  </p>
                )}
                {vm.roleFit === "rare" ? (
                  <p className="mt-2 text-sm leading-relaxed text-ink-body">
                    {isHu ? "Ez a szerep a csapatban ritka — " : "This role is rare in the team — "}
                    <span className="font-semibold text-sage-dark">
                      {isHu ? "rád ebben különösen számítanak" : "they especially rely on you here"}
                    </span>
                    {isHu
                      ? ": te vagy az, aki ezt behozza a közös munkába."
                      : ": you're the one bringing it into the shared work."}
                  </p>
                ) : vm.roleFit === "shared" ? (
                  <p className="mt-2 text-sm leading-relaxed text-ink-body">
                    {isHu
                      ? "Ezt a szerepet többen is viszitek — jó a lefedettség, oszthatjátok a terhet és támogathatjátok egymást."
                      : "Several of you carry this role — good coverage, you can share the load and support each other."}
                  </p>
                ) : null}
              </div>
            </div>
          </DashboardPanel>
        </section>
      )}

      {/* 3. Milyen a csapatotok — mintázat + erősségek */}
      {(vm.patternLabel || vm.strengths) && (
        <section>
          <DashboardSectionHeader
            label={isHu ? "Milyen a csapatotok" : "What your team is like"}
            className="mb-4"
          />
          <DashboardPanel className="p-6">
            {vm.patternLabel && (
              <div className="mb-5 rounded-[14px] bg-gradient-to-br from-cream to-sage/10 p-4 ring-1 ring-sand">
                <p className="font-mono text-micro uppercase tracking-widest text-muted">
                  {isHu ? "Csapatmintázat" : "Team pattern"}
                </p>
                <p className="mt-1 font-fraunces text-xl leading-tight text-ink">
                  {vm.patternLabel}
                </p>
                <p className="mt-3 text-micro leading-relaxed text-muted">
                  {t("teamComp.framingNote", loc)}
                </p>
              </div>
            )}
            {vm.strengths && (
              <div className="rounded-[14px] border-l-4 border-l-state-success-solid bg-state-success-bg/40 p-4">
                <p className="mb-1.5 flex items-center gap-1.5 font-mono text-micro uppercase tracking-widest text-state-success-fg">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8.5l3 3 7-7" />
                  </svg>
                  {isHu ? "A csapat erősségei" : "The team's strengths"}
                </p>
                {/* EN lekérés jóváhagyott fordítás nélkül: jelezzük, hogy az
                    eredeti magyar szöveg látszik. */}
                {!isHu && !hasApprovedEnTranslation(reportInput) ? (
                  <p className="mb-2 text-micro text-state-warning-fg">
                    Shown in the Hungarian original — English translation pending
                    consultant approval.
                  </p>
                ) : null}
                <NarrativeRich text={vm.strengths} tone="emerald" card={false} />
              </div>
            )}
          </DashboardPanel>
        </section>
      )}

      {/* 4. Hogyan hozd ki a legtöbbet magadból itt */}
      {vm.tips.length > 0 && (
        <section>
          <DashboardSectionHeader
            label={isHu ? "Hogyan hozd ki a legtöbbet magadból itt" : "How to get the most out of yourself here"}
            className="mb-4"
          />
          <DashboardPanel className="p-6">
            <ol className="flex flex-col gap-3">
              {vm.tips.map((tip, i) => (
                <li
                  key={i}
                  className={`relative rounded-[12px] border border-sand border-l-4 bg-surface-card py-3.5 pl-14 pr-4 text-sm leading-relaxed text-ink-body shadow-[0_4px_12px_rgba(26,26,46,0.03)] ${TIP_BORDERS[i] ?? TIP_BORDERS[0]}`}
                >
                  <span
                    className={`absolute left-4 top-3 flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold text-white ${TIP_ACCENTS[i] ?? TIP_ACCENTS[0]}`}
                  >
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ol>
          </DashboardPanel>
        </section>
      )}

      {/* Lábléc — módszertan + átláthatóság */}
      <DashboardPanel tone="cream" className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-body">
          <span className="rounded-full bg-surface-card px-2.5 py-1 font-mono text-note text-muted ring-1 ring-sand">
            {isHu ? "min. 3 kitöltés" : "min. 3 responses"}
          </span>
          <span>
            {isHu ? "Ez a csapat tanácsadó által jóváhagyott, összesített képe. A részletes egyéni eredményed: " : "This is the team's consultant-approved aggregate picture. Your detailed individual result: "}
            <Link href="/profile/results" className="font-semibold text-sage-dark hover:underline">
              {isHu ? "Profil › Eredmények" : "Profile › Results"}
              <ChevronRightIcon className="ml-1 inline h-3.5 w-3.5" />
            </Link>
          </span>
        </div>
        <p className="mt-2 text-micro text-muted">
          {isHu
            ? "A menedzsered egy bővebb, vezetői nézetet lát ugyanerről a csapatképről. Egyéni adatot másokról sehol nem mutatunk."
            : "Your manager sees a fuller, leadership view of the same team picture. We never show individual data about others anywhere."}
        </p>
      </DashboardPanel>
    </div>
  );
}
