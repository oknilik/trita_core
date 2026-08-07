"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { TEAM_ROLES, getTopRoles } from "@/lib/team-role-scoring";
import { resolveDisplayRoleScores } from "@/lib/team-role-estimate";
import type {
  TeamIntelligenceEvidence,
  TeamIntelligenceSubTab,
} from "@/lib/team-intelligence";
import { DynamicsMap } from "./DynamicsMap";

export type SubTab = TeamIntelligenceSubTab;

export interface IntelligenceMember {
  id: string;
  name: string;
  initials: string;
  tritan: { INTE: number; RESO: number; TEMP: number; ADAP: number; THOR: number; OPEN: number };
  /** Kitöltött csapatszerep-kérdőív pontszámai — ha van, ez élvez elsőbbséget a becsléssel szemben. */
  measuredRoleScores: Record<string, number> | null;
  hasAssessmentData: boolean;
  skillLevel: 1 | 2 | 3;
  growthPotential: 1 | 2 | 3;
  /** 0-100 weighted composites from resolveContributionPlacement */
  deliveryScore: number;
  growthScore: number;
  placementConfidence: "low" | "medium" | "high";
  zone: string;
  color: string;
  textColor: string;
}

export interface DynamicsEdge {
  from: string;
  to: string;
  type: "aligned" | "complementary" | "friction";
  /** Az él adat-forrása — a "trust_round" MÉRT kapcsolati adat, a többi becslés. */
  source?: "observer" | "profile_estimate" | "trust_round";
}

interface TeamIntelligenceProps {
  members: IntelligenceMember[];
  edges: DynamicsEdge[];
  evidenceBySub?: Partial<Record<SubTab, TeamIntelligenceEvidence>>;
  presentation?: "tabs" | "blocks";
  isHu?: boolean;
  noDataCtaHref?: string;
  noDataCtaLabel?: string;
  deepDiveHref?: string;
  deepDiveLabel?: string;
}

const SOURCE_KEY: Record<TeamIntelligenceEvidence["source"], string> = {
  self: "teamComp.evidenceSourceSelf",
  self_plus_observer: "teamComp.evidenceSourceSelfObserver",
  inferred: "teamComp.evidenceSourceInferred",
};

const QUALITY_KEY: Record<TeamIntelligenceEvidence["quality"], string> = {
  none: "teamComp.evidenceQualityNone",
  partial: "teamComp.evidenceQualityPartial",
  sufficient: "teamComp.evidenceQualitySufficient",
};

const CONFIDENCE_KEY: Record<TeamIntelligenceEvidence["confidence"], string> = {
  low: "teamComp.evidenceConfidenceLow",
  medium: "teamComp.evidenceConfidenceMedium",
  high: "teamComp.evidenceConfidenceHigh",
};

const DEFAULT_EVIDENCE: Record<SubTab, TeamIntelligenceEvidence> = {
  map: {
    source: "self",
    quality: "partial",
    confidence: "medium",
  },
  dynamics: {
    source: "self_plus_observer",
    quality: "none",
    confidence: "low",
  },
  roles: {
    source: "inferred",
    quality: "partial",
    confidence: "low",
  },
};

function mergeEvidence(
  custom: Partial<Record<SubTab, TeamIntelligenceEvidence>> | undefined,
): Record<SubTab, TeamIntelligenceEvidence> {
  return {
    map: custom?.map ?? DEFAULT_EVIDENCE.map,
    dynamics: custom?.dynamics ?? DEFAULT_EVIDENCE.dynamics,
    roles: custom?.roles ?? DEFAULT_EVIDENCE.roles,
  };
}

interface EvidenceSummaryProps {
  evidence: TeamIntelligenceEvidence;
  loc: Locale;
}

function EvidenceSummary({ evidence, loc }: EvidenceSummaryProps) {
  return (
    <div className="rounded-xl border border-sand bg-cream/65 px-3 py-2.5">
      <p className="font-mono text-micro uppercase tracking-widest text-muted">
        {t("teamComp.evidenceEyebrow", loc)}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-sand bg-surface-card px-2 py-0.5 text-[11px] text-ink-body">
          {t("teamComp.evidenceSource", loc)}:{" "}
          <span className="font-semibold text-ink">{t(SOURCE_KEY[evidence.source], loc)}</span>
        </span>
        <span className="rounded-full border border-sand bg-surface-card px-2 py-0.5 text-[11px] text-ink-body">
          {t("teamComp.evidenceQuality", loc)}:{" "}
          <span className="font-semibold text-ink">{t(QUALITY_KEY[evidence.quality], loc)}</span>
        </span>
        <span className="rounded-full border border-sand bg-surface-card px-2 py-0.5 text-[11px] text-ink-body">
          {t("teamComp.evidenceConfidence", loc)}:{" "}
          <span className="font-semibold text-ink">{t(CONFIDENCE_KEY[evidence.confidence], loc)}</span>
        </span>
      </div>
      {evidence.note ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{evidence.note}</p>
      ) : null}
    </div>
  );
}

export function TeamIntelligence({
  members,
  edges,
  evidenceBySub,
  isHu = true,
  noDataCtaHref,
  noDataCtaLabel,
  deepDiveHref,
  deepDiveLabel,
}: TeamIntelligenceProps) {
  const loc: Locale = isHu ? "hu" : "en";
  const evidenceByTab = mergeEvidence(evidenceBySub);
  const membersWithData = members.filter((member) => member.hasAssessmentData);
  const membersWithoutData = members.filter((member) => !member.hasAssessmentData);
  const dynamicsCounts = edges.reduce(
    (acc, edge) => {
      if (edge.type === "aligned") acc.aligned += 1;
      if (edge.type === "complementary") acc.complementary += 1;
      if (edge.type === "friction") acc.friction += 1;
      return acc;
    },
    { aligned: 0, complementary: 0, friction: 0 },
  );

  return (
    <div className="flex flex-col gap-6 pt-2">
      <section className="rounded-[24px] border border-sand bg-surface-card p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-dm-sans text-[14px] font-semibold text-ink">
            {isHu ? "Ki mit hoz a csapatba" : "Who brings what to the team"}
          </p>
          <span className="rounded-full bg-warm-mid px-2 py-0.5 text-micro font-medium text-ink-body">
            {membersWithData.length}/{members.length}{" "}
            {isHu ? "tag értelmezhető adattal" : "members with usable data"}
          </span>
        </div>
        <EvidenceSummary evidence={evidenceByTab.roles} loc={loc} />
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {membersWithData.map((member) => {
            // Precedencia-szabály (mint a team-stats / team-report / TeamRoleSection
            // felületeken): kitöltött kérdőív > TRITAN-becslés.
            const resolved = resolveDisplayRoleScores(
              member.measuredRoleScores,
              member.tritan,
            );
            const hasMeasuredRoles = resolved.source === "questionnaire";
            const topRoles = getTopRoles(resolved.scores, 3);
            const topDims = Object.entries(member.tritan)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 2);
            return (
              <article
                key={member.id}
                className="rounded-xl border border-sand bg-cream/45 p-3"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white text-[11px] font-semibold"
                    style={{ background: member.color, color: member.textColor }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <p className="text-caption font-semibold text-ink">{member.name}</p>
                    <p className="text-[11px] text-muted">
                      {hasMeasuredRoles
                        ? isHu ? "Csapatszerep profil" : "Team-role profile"
                        : isHu ? "Becsült csapatszerep profil" : "Estimated team-role profile"}
                    </p>
                  </div>
                  {/* Forrás-jelölés a mért/becsült konvencióval (sage = mért, amber = becsült) */}
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-micro font-semibold ${
                      hasMeasuredRoles
                        ? "bg-sage/15 text-sage-dark"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {hasMeasuredRoles
                      ? isHu ? "kitöltött" : "measured"
                      : isHu ? "becslés" : "estimate"}
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {topRoles.map((role) => (
                    <span
                      key={`${member.id}-${role.role}`}
                      className="rounded-full border border-sand bg-surface-card px-2 py-0.5 text-[11px] text-ink-body"
                    >
                      {isHu ? TEAM_ROLES[role.role].hu : TEAM_ROLES[role.role].en}
                    </span>
                  ))}
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {topDims.map(([dim, value]) => (
                    <span
                      key={`${member.id}-${dim}`}
                      className="rounded-full bg-surface-card px-2 py-0.5 text-[11px] text-ink-body"
                    >
                      <span className="font-semibold text-ink">{dim}</span> {Math.round(value)}%
                    </span>
                  ))}
                </div>
              </article>
            );
          })}

          {membersWithData.length === 0 ? (
            <div className="rounded-xl border border-dashed border-sand bg-cream/45 p-4 text-[12px] text-ink-body">
              {isHu
                ? "Még nincs elég kitöltött felmérés az erőforrás-térképhez."
                : "No completed assessment data yet for the resource map."}
            </div>
          ) : null}
        </div>

        {membersWithoutData.length > 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-sand bg-surface-card p-3">
            <p className="text-[12px] font-medium text-ink">
              {isHu ? "Még hiányzó adatok" : "Missing data members"}
            </p>
            <p className="mt-1 text-[11px] text-ink-body">
              {membersWithoutData.length}{" "}
              {isHu
                ? "tag még nem rendelkezik értelmezhető assessment adattal."
                : "members still do not have usable assessment data."}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {membersWithoutData.slice(0, 8).map((member) => (
                <span
                  key={`${member.id}-missing`}
                  className="rounded-full border border-sand bg-cream px-2 py-0.5 text-[11px] text-ink-body"
                >
                  {member.name}
                </span>
              ))}
            </div>
            {membersWithoutData.length > 8 ? (
              <p className="mt-1 text-[11px] text-muted">
                +{membersWithoutData.length - 8} {isHu ? "fő" : "more"}
              </p>
            ) : null}
            {noDataCtaHref && noDataCtaLabel ? (
              <Link
                href={noDataCtaHref}
                className="mt-3 inline-flex min-h-[36px] items-center rounded-[10px] bg-surface-card px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
              >
                {noDataCtaLabel}
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 rounded-xl border border-sand bg-surface-card p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="font-dm-sans text-caption font-semibold text-ink">
              {t("teamComp.subDynamics", loc)}
            </p>
            <span className="rounded-full bg-warm-mid px-2 py-0.5 text-micro font-medium text-ink-body">
              {isHu ? "profil alapú becslés" : "profile-based estimate"}
            </span>
          </div>
          <EvidenceSummary evidence={evidenceByTab.dynamics} loc={loc} />
          {edges.length > 0 ? (
            <div className="mt-2">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800">
                  {isHu ? "Hasonló profil" : "Aligned"}: {dynamicsCounts.aligned}
                </span>
                <span className="rounded-full border border-sand bg-cream px-2 py-0.5 text-[11px] text-ink-body">
                  {isHu ? "Kiegészítő" : "Complementary"}: {dynamicsCounts.complementary}
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">
                  {isHu ? "Potenciális súrlódás" : "Potential friction"}: {dynamicsCounts.friction}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-ink-body/60">
                {isHu
                  ? "A becslés a személyiségprofil-eltérésekből számolódik. A tényleges kapcsolati dinamikához 360°-os bizalmi kör szükséges."
                  : "Estimates are based on personality profile gaps. Actual relationship dynamics require a 360° trust round."}
              </p>
              <div className="mt-3">
                <DynamicsMap members={members} edges={edges} isHu={isHu} />
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-ink-body">
              {t("teamComp.dynamicsHiddenHint", loc)}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[24px] border border-sand bg-surface-card p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-dm-sans text-[14px] font-semibold text-ink">
            {isHu ? "Részletes csapatszerep elemzés" : "Detailed team-role analysis"}
          </p>
          <span className="rounded-full bg-warm-mid px-2 py-0.5 text-micro font-medium text-ink-body">
            {isHu ? "deep-dive tulajdonos" : "deep-dive owner"}
          </span>
        </div>
        <p className="text-[12px] leading-relaxed text-ink-body">
          {isHu
            ? "Ez az áttekintő nézet. A részletes ábrák és a szerep-eloszlás a Csapatszerepek felületen érhető el."
            : "This is the overview. Detailed charts and the role distribution live on the Team roles surface."}
        </p>
        {deepDiveHref ? (
          <div className="mt-3">
            <Link
              href={deepDiveHref}
              className="inline-flex min-h-[36px] items-center rounded-[10px] bg-surface-card px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
            >
              {deepDiveLabel ?? (isHu ? "Részletes csapatszerep elemzés megnyitása" : "Open detailed team-role analysis")}
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
