"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import type { IntelligenceMember } from "./TeamIntelligence";

interface RoleZone {
  id: string;
  labelKey: string;
  x: number;
  y: number;
  r: number;
  bg: string;
  stroke: string;
  tc: string;
  dims: string[];
  missing?: boolean;
}

const ROLE_ZONES: RoleZone[] = [
  { id: "med", labelKey: "teamComp.zoneMediatorLabel",   x: 215, y: 80,  r: 55, bg: "#e8f7f1", stroke: "#6ee7b7", tc: "#085041", dims: ["A"] },
  { id: "inn", labelKey: "teamComp.zoneInnovatorLabel",  x: 360, y: 185, r: 55, bg: "#e0f2fe", stroke: "#7dd3fc", tc: "#075985", dims: ["O", "X"] },
  { id: "exe", labelKey: "teamComp.zoneExecutorLabel",   x: 300, y: 285, r: 50, bg: "#ede9fe", stroke: "#c4b5fd", tc: "#4c1d95", dims: ["C"] },
  { id: "ana", labelKey: "teamComp.zoneAnalyzerLabel",   x: 130, y: 285, r: 50, bg: "#fef9c3", stroke: "#fcd34d", tc: "#713f12", dims: ["H", "C"] },
  { id: "ene", labelKey: "teamComp.zoneEnergizerLabel",  x: 70,  y: 185, r: 55, bg: "#fce7f3", stroke: "#f9a8d4", tc: "#831843", dims: ["E", "X"] },
  { id: "str", labelKey: "teamComp.zoneStrategistLabel", x: 215, y: 210, r: 42, bg: "var(--color-surface-chip-neutral)", stroke: "var(--color-border-default)", tc: "var(--color-text-muted)", dims: [], missing: true },
];

type HexacoKey = keyof IntelligenceMember["hexaco"];
type ZoneFitConfidence = "high" | "medium" | "low";

interface ZoneFitResult {
  primaryZoneId: string;
  primaryScore: number;
  secondaryScore: number;
  confidence: ZoneFitConfidence;
}

const ROLE_ZONE_WEIGHTS: Record<string, Partial<Record<HexacoKey, number>>> = {
  med: { A: 0.5, H: 0.3, E: 0.2 },
  inn: { O: 0.45, X: 0.35, C: 0.2 },
  exe: { C: 0.55, X: 0.25, A: 0.2 },
  ana: { H: 0.35, C: 0.35, O: 0.3 },
  ene: { X: 0.45, E: 0.3, O: 0.25 },
};

function weightedZoneScore(
  hexaco: IntelligenceMember["hexaco"],
  weights: Partial<Record<HexacoKey, number>>,
): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const [dim, weight] of Object.entries(weights) as Array<[HexacoKey, number]>) {
    weightedSum += hexaco[dim] * weight;
    totalWeight += weight;
  }
  if (totalWeight <= 0) return 0;
  return weightedSum / totalWeight;
}

function resolveZoneFit(hexaco: IntelligenceMember["hexaco"]): ZoneFitResult {
  const scores = Object.entries(ROLE_ZONE_WEIGHTS).map(([zoneId, weights]) => ({
    zoneId,
    score: weightedZoneScore(hexaco, weights),
  }));
  scores.sort((a, b) => b.score - a.score);

  const top = scores[0] ?? { zoneId: "med", score: 0 };
  const second = scores[1] ?? { zoneId: "med", score: 0 };
  const gap = top.score - second.score;

  const confidence: ZoneFitConfidence =
    gap >= 12 ? "high" : gap >= 6 ? "medium" : "low";

  return {
    primaryZoneId: top.zoneId,
    primaryScore: top.score,
    secondaryScore: second.score,
    confidence,
  };
}

const DIM_COLORS: Record<string, string> = {
  H: "var(--color-visual-gradient-indigo)",
  E: "#EC4899",
  X: "var(--color-state-warning-strong)",
  A: "var(--color-state-success-strong)",
  C: "var(--color-visual-gradient-violet)",
  O: "#06B6D4",
};

interface RoleDetailPanelProps {
  member: IntelligenceMember;
  zone: RoleZone;
  fit: ZoneFitResult;
  loc: Locale;
}

function RoleDetailPanel({ member, zone, fit, loc }: RoleDetailPanelProps) {
  const confidenceKey =
    fit.confidence === "high"
      ? "teamComp.roleFitConfidenceHigh"
      : fit.confidence === "medium"
        ? "teamComp.roleFitConfidenceMedium"
        : "teamComp.roleFitConfidenceLow";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-sand bg-white p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-white text-[12px] font-bold"
          style={{ background: member.color, color: member.textColor }}
        >
          {member.initials}
        </div>
        <div>
          <p className="text-[14px] font-bold text-ink">{member.name}</p>
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: zone.bg, color: zone.tc, border: `1px solid ${zone.stroke}` }}
          >
            {t(zone.labelKey, loc)}
          </span>
          <p className="mt-1 text-[10px] text-ink-body">
            {t("teamComp.roleFitScore", loc)}:{" "}
            <span className="font-semibold text-ink">{Math.round(fit.primaryScore)}%</span>
            {" · "}
            {t("teamComp.roleFitConfidence", loc)}:{" "}
            <span className="font-semibold text-ink">{t(confidenceKey, loc)}</span>
          </p>
        </div>
      </div>

      <div>
        <SectionEyebrow className="mb-1.5 text-[8px]">
          {t("teamComp.dominantDimsEyebrow", loc)}
        </SectionEyebrow>
        <div className="flex flex-col gap-1.5">
          {Object.entries(member.hexaco)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <div
                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[7px] font-bold text-white"
                  style={{ background: DIM_COLORS[k] ?? "#888" }}
                >
                  {k}
                </div>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-warm-mid">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${v}%`, background: DIM_COLORS[k] ?? "#888", opacity: 0.85 }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-[10px] text-ink-body">{v}%</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

interface RoleFitMapProps {
  members: IntelligenceMember[];
  isHu?: boolean;
}

export function RoleFitMap({ members, isHu = true }: RoleFitMapProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const loc: Locale = isHu ? "hu" : "en";
  const membersWithData = members.filter((m) => m.hasAssessmentData);
  const membersWithoutData = members.filter((m) => !m.hasAssessmentData);

  const memberFitById = new Map<string, ZoneFitResult>();
  const zoneMembers: Record<string, IntelligenceMember[]> = {};
  membersWithData.forEach((m) => {
    const fit = resolveZoneFit(m.hexaco);
    memberFitById.set(m.id, fit);
    if (!zoneMembers[fit.primaryZoneId]) zoneMembers[fit.primaryZoneId] = [];
    zoneMembers[fit.primaryZoneId].push(m);
  });

  const missingZones = ROLE_ZONES.filter(
    (z) => !z.missing && (!zoneMembers[z.id] || zoneMembers[z.id].length === 0)
  );

  const selectedMember = membersWithData.find((m) => m.id === selected);
  const selectedFit = selectedMember
    ? memberFitById.get(selectedMember.id) ?? null
    : null;
  const selectedZone = selectedMember
    ? ROLE_ZONES.find((z) => z.id === selectedFit?.primaryZoneId)
    : null;

  if (membersWithData.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-sand bg-[#f8f7f4] p-10 text-center">
        <p className="text-[14px] font-semibold text-ink">
          {t("teamComp.noRoleFitDataTitle", loc)}
        </p>
        <p className="mt-1 text-[12px] text-muted">
          {t("teamComp.noRoleFitDataDesc", loc)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {membersWithoutData.length > 0 ? (
        <div className="rounded-xl border border-sand bg-white px-3 py-2 text-[12px] text-ink-body">
          {t("teamComp.membersWithoutAssessment", loc)}:{" "}
          <span className="font-semibold text-ink">{membersWithoutData.length}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 md:flex-row">
      <div className="flex-1">
        <svg
          viewBox="0 0 430 340"
          className="w-full rounded-xl border border-sand bg-white"
        >
          {/* Zone circles */}
          {ROLE_ZONES.map((z) => (
            <g key={z.id}>
              <circle
                cx={z.x}
                cy={z.y}
                r={z.r}
                fill={z.bg}
                stroke={z.stroke}
                strokeWidth={z.missing ? 1 : 1.5}
                strokeDasharray={z.missing ? "5 3" : "none"}
                opacity={z.missing ? 0.5 : 1}
              />
              <text
                x={z.x}
                y={z.y - z.r * 0.45}
                textAnchor="middle"
                fontSize={9}
                fontWeight={700}
                fill={z.missing ? "#b0ada6" : z.tc}
              >
                {t(z.labelKey, loc)}
              </text>
              {z.missing && (
                <text
                  x={z.x}
                  y={z.y - z.r * 0.45 + 13}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#b0ada6"
                >
                  {t("teamComp.missingRoleTag", loc)}
                </text>
              )}
            </g>
          ))}

          {/* Members per zone */}
          {ROLE_ZONES.filter((z) => !z.missing).map((z) => {
            const mems = zoneMembers[z.id] ?? [];
            return mems.map((m, i) => {
              const fit = memberFitById.get(m.id);
              const angle =
                mems.length > 1 ? (i / mems.length) * Math.PI * 2 - Math.PI / 2 : 0;
              const dist = mems.length > 1 ? z.r * 0.42 : 0;
              const px = z.x + Math.cos(angle) * dist;
              const py = z.y + Math.sin(angle) * dist + (mems.length <= 1 ? 10 : 0);

              return (
                <g
                  key={m.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(selected === m.id ? null : m.id)}
                >
                  <circle
                    cx={px}
                    cy={py}
                    r={16}
                    fill={m.color}
                    stroke={selected === m.id ? "var(--color-action-primary-bg)" : "white"}
                    strokeWidth={selected === m.id ? 2.5 : 2}
                    opacity={fit?.confidence === "low" ? 0.74 : 1}
                  />
                  <text
                    x={px}
                    y={py + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={8}
                    fontWeight="800"
                    fill={m.textColor}
                  >
                    {m.initials}
                  </text>
                </g>
              );
            });
          })}
        </svg>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-3">
          {ROLE_ZONES.filter((z) => !z.missing).map((z) => (
            <div key={z.id} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded"
                style={{ background: z.bg, border: `1px solid ${z.stroke}` }}
              />
              <span className="text-[10px] text-ink-body">{t(z.labelKey, loc)}</span>
            </div>
          ))}
          {missingZones.length > 0 && (
            <div className="ml-auto text-[10px] text-muted">
              {t("teamComp.missingRoleLabel", loc)}{" "}
              {missingZones.map((z) => t(z.labelKey, loc)).join(", ")}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="w-full flex-shrink-0 md:w-[240px]">
        {selectedMember && selectedZone && selectedFit ? (
          <RoleDetailPanel
            member={selectedMember}
            zone={selectedZone}
            fit={selectedFit}
            loc={loc}
          />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-sand bg-white p-6 text-center">
            <p className="text-[12px] text-muted">
              {t("teamComp.clickPersonRole", loc)}
              <br />{t("teamComp.clickPersonRoleDesc", loc)}
            </p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
