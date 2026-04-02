"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { TeamMap } from "./TeamMap";
import { DynamicsMap } from "./DynamicsMap";
import { RoleFitMap } from "./RoleFitMap";

export type SubTab = "map" | "dynamics" | "roles";

export interface IntelligenceMember {
  id: string;
  name: string;
  initials: string;
  hexaco: { H: number; E: number; X: number; A: number; C: number; O: number };
  hasAssessmentData: boolean;
  skillLevel: 1 | 2 | 3;
  growthPotential: 1 | 2 | 3;
  zone: string;
  color: string;
  textColor: string;
}

export interface DynamicsEdge {
  from: string;
  to: string;
  type: "good" | "neutral" | "tension";
}

export interface TeamIntelligenceEvidence {
  source: "self" | "self_plus_observer" | "inferred";
  quality: "none" | "partial" | "sufficient";
  confidence: "low" | "medium" | "high";
  note?: string;
}

interface TeamIntelligenceProps {
  members: IntelligenceMember[];
  edges: DynamicsEdge[];
  evidenceBySub?: Partial<Record<SubTab, TeamIntelligenceEvidence>>;
  isHu?: boolean;
}

const SUB_KEYS: Record<SubTab, string> = {
  map: "teamComp.subMap",
  dynamics: "teamComp.subDynamics",
  roles: "teamComp.subRoles",
};

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

export function TeamIntelligence({ members, edges, evidenceBySub, isHu = true }: TeamIntelligenceProps) {
  const [sub, setSub] = useState<SubTab>("map");
  const loc: Locale = isHu ? "hu" : "en";
  const availableTabs: SubTab[] = edges.length > 0
    ? ["map", "dynamics", "roles"]
    : ["map", "roles"];
  const activeSub: SubTab = availableTabs.includes(sub) ? sub : "map";
  const evidence = mergeEvidence(evidenceBySub)[activeSub];

  return (
    <div className="pt-6">
      {/* Al-tab navigáció */}
      <div className="mb-5 flex gap-2">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSub(tab)}
            className={[
              "rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors",
              activeSub === tab
                ? "bg-ink text-white"
                : "bg-warm-mid text-ink-body hover:bg-sand",
            ].join(" ")}
          >
            {t(SUB_KEYS[tab], loc)}
          </button>
        ))}
      </div>

      {edges.length === 0 ? (
        <p className="mb-4 rounded-xl border border-warm-mid bg-cream px-3 py-2 text-[12px] text-ink-body">
          {t("teamComp.dynamicsHiddenHint", loc)}
        </p>
      ) : null}

      <div className="mb-4 rounded-xl border border-sand bg-white px-3 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {t("teamComp.evidenceEyebrow", loc)}
        </p>
        <p className="mt-1 text-[12px] text-ink-body">
          {t("teamComp.evidenceSource", loc)}:{" "}
          <span className="font-semibold text-ink">{t(SOURCE_KEY[evidence.source], loc)}</span>
          {" · "}
          {t("teamComp.evidenceQuality", loc)}:{" "}
          <span className="font-semibold text-ink">{t(QUALITY_KEY[evidence.quality], loc)}</span>
          {" · "}
          {t("teamComp.evidenceConfidence", loc)}:{" "}
          <span className="font-semibold text-ink">{t(CONFIDENCE_KEY[evidence.confidence], loc)}</span>
        </p>
        {evidence.note ? (
          <p className="mt-1 text-[11px] text-muted">{evidence.note}</p>
        ) : null}
      </div>

      {activeSub === "map" && <TeamMap members={members} isHu={isHu} />}
      {activeSub === "dynamics" && <DynamicsMap members={members} edges={edges} isHu={isHu} />}
      {activeSub === "roles" && <RoleFitMap members={members} isHu={isHu} />}
    </div>
  );
}
