"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { FRICTION_WEIGHTS, computeAlignedHubIds, isMeasuredDynamicsSource } from "@/lib/friction-model";
import { EDGE_CONFIDENCE_ONE_SIDED } from "@/lib/trust-network";
import { DYNAMICS_COLORS_CSS } from "@/lib/color-system";
import type { IntelligenceMember, DynamicsEdge } from "./TeamIntelligence";

// Dinamika-trió — dokumentált státusz-kivétel (color-system DYNAMICS_COLORS_CSS),
// mindig felirattal. A korábbi bézs „complementary" megszűnt: egy fogalom,
// egy szín (a TeamReportView-val azonos hármas).
const EDGE_COLORS: Record<DynamicsEdge["type"], string> = {
  aligned: DYNAMICS_COLORS_CSS.aligned,
  complementary: DYNAMICS_COLORS_CSS.complementary,
  friction: DYNAMICS_COLORS_CSS.friction,
};

const EDGE_WIDTHS: Record<DynamicsEdge["type"], number> = {
  aligned: 2.5,
  complementary: 1.5,
  friction: 2,
};

const EDGE_DASH: Record<DynamicsEdge["type"], string> = {
  aligned: "none",
  complementary: "6 3",
  friction: "none",
};

function getCircularPositions(
  members: IntelligenceMember[],
  cx: number,
  cy: number,
  r: number
): Record<string, { x: number; y: number }> {
  const result: Record<string, { x: number; y: number }> = {};
  members.forEach((m, i) => {
    const angle = (i / members.length) * Math.PI * 2 - Math.PI / 2;
    result[m.id] = {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  });
  return result;
}

// ── Dimension breakdown helpers ──────────────────────────────────────────────

const DIM_LABELS: Record<string, { hu: string; en: string }> = {
  THOR: { hu: "Lelkiismeretesség", en: "Conscientiousness" },
  ADAP: { hu: "Barátságosság", en: "Agreeableness" },
  INTE: { hu: "Becsületesség-Alázat", en: "Honesty-Humility" },
  RESO: { hu: "Emocionalitás", en: "Emotionality" },
  TEMP: { hu: "Extraverzió", en: "Extraversion" },
  OPEN: { hu: "Nyitottság", en: "Openness" },
};

const DIM_FRICTION_HINT: Record<string, { hu: string; en: string }> = {
  THOR: { hu: "Eltérő munkaszervezés és határidő-kezelés", en: "Different work organization and deadline approach" },
  ADAP: { hu: "Eltérő kommunikációs stílus és konfliktuskezelés", en: "Different communication style and conflict approach" },
  INTE: { hu: "Eltérő motivációs minták és bizalmi beállítódás", en: "Different motivational patterns and trust orientation" },
  RESO: { hu: "Eltérő érzelmi igények és stresszválasz", en: "Different emotional needs and stress response" },
  TEMP: { hu: "Eltérő energia-szint és interakciós igény", en: "Different energy level and interaction needs" },
  OPEN: { hu: "Eltérő hozzáállás az újdonsághoz és változáshoz", en: "Different attitude toward novelty and change" },
};

const DIM_ALIGNED_HINT: Record<string, { hu: string; en: string }> = {
  THOR: { hu: "Hasonló munkastílus és szervezettség", en: "Similar work style and organization" },
  ADAP: { hu: "Hasonló kommunikációs megközelítés", en: "Similar communication approach" },
  INTE: { hu: "Hasonló értékrend és átláthatóság-igény", en: "Similar values and transparency needs" },
  RESO: { hu: "Hasonló érzelmi hőfok", en: "Similar emotional temperature" },
  TEMP: { hu: "Hasonló szociális energia", en: "Similar social energy" },
  OPEN: { hu: "Hasonló nyitottság az újra", en: "Similar openness to new ideas" },
};

interface DimGap {
  code: string;
  gap: number;
  contribution: number;
  label: string;
  hint: string;
}

function computeDimBreakdown(
  a: IntelligenceMember["tritan"],
  b: IntelligenceMember["tritan"],
  loc: Locale,
): { gaps: DimGap[]; totalFriction: number } {
  const dims = ["THOR", "ADAP", "INTE", "RESO", "TEMP", "OPEN"] as const;
  const gaps: DimGap[] = [];
  let totalFriction = 0;

  for (const code of dims) {
    const aValue = a[code];
    const bValue = b[code];
    // Részleges profil: hiányzó dimenzióból nincs gap — a hívó ugyan teljes
    // profil-párnál nyitja a bontást (hasAssessmentData), az őr defenzív.
    if (typeof aValue !== "number" || typeof bValue !== "number") continue;
    const gap = Math.abs(aValue - bValue);
    const w = FRICTION_WEIGHTS[code] ?? 0;
    const contribution = Math.round(w * gap);
    totalFriction += contribution;
    const isSmall = gap < 15;
    gaps.push({
      code,
      gap,
      contribution,
      label: (DIM_LABELS[code]?.[loc] ?? code),
      hint: isSmall
        ? (DIM_ALIGNED_HINT[code]?.[loc] ?? "")
        : (DIM_FRICTION_HINT[code]?.[loc] ?? ""),
    });
  }

  gaps.sort((x, y) => y.contribution - x.contribution);
  return { gaps, totalFriction };
}

// ── Detail panel ────────────────────────────────────────────────────────────

interface DynamicsDetailPanelProps {
  member: IntelligenceMember;
  edges: DynamicsEdge[];
  members: IntelligenceMember[];
  loc: Locale;
}

function DynamicsDetailPanel({ member, edges, members, loc }: DynamicsDetailPanelProps) {
  const [expandedEdge, setExpandedEdge] = useState<string | null>(null);
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
  const myEdges = edges.filter((e) => e.from === member.id || e.to === member.id);

  const edgeLabelKey: Record<DynamicsEdge["type"], string> = {
    aligned: "teamComp.edgeAligned",
    friction: "teamComp.edgeFriction",
    complementary: "teamComp.edgeComplementary",
  };

  // MÉRT (trust) élre a „hasonló profil" címke hamis állítás lenne — az
  // aligned ott ERŐS BIZALMAT jelent, nem profil-hasonlóságot. Mért élen
  // ezért forrás-semleges címke jár.
  const edgeLabel = (e: DynamicsEdge): string =>
    e.type === "aligned" && isMeasuredDynamicsSource(e.source)
      ? t("teamComp.edgeAlignedNeutral", loc)
      : t(edgeLabelKey[e.type], loc);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-sand bg-surface-card p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-white text-[12px] font-bold"
          style={{ background: member.color, color: member.textColor }}
        >
          {member.initials}
        </div>
        <p className="text-[14px] font-bold text-ink">{member.name}</p>
      </div>

      {myEdges.length > 0 && (
        <div>
          <SectionEyebrow className="mb-1.5 text-micro">
            {t("teamComp.connectionsEyebrow", loc)}
          </SectionEyebrow>
          <div className="flex flex-col gap-0.5">
            {myEdges.map((e, i) => {
              const otherId = e.from === member.id ? e.to : e.from;
              const target = memberMap[otherId];
              if (!target) return null;
              const isExpanded = expandedEdge === otherId;
              // Dimenzió-bontás CSAK valódi profil-párból: kitöltetlen vagy
              // részleges profilú tagnál nincs miből gap-et számolni — a
              // hasAssessmentData csak teljes fő-dimenzió-készletnél igaz.
              const hasPairProfiles =
                member.hasAssessmentData && target.hasAssessmentData;
              const breakdown = isExpanded && hasPairProfiles
                ? computeDimBreakdown(member.tritan, target.tritan, loc)
                : null;

              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setExpandedEdge(isExpanded ? null : otherId)}
                    className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-cream"
                  >
                    <div
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ background: EDGE_COLORS[e.type] }}
                    />
                    <span className="text-[11px] text-ink-body">{target.name}</span>
                    <span className="ml-auto text-micro text-muted">
                      {edgeLabel(e)}
                    </span>
                    {isMeasuredDynamicsSource(e.source) ? (
                      <span className="rounded-full bg-sage/15 px-1.5 py-0.5 font-mono text-micro uppercase tracking-wide text-sage-dark">
                        {t("teamComp.dynamicsStateMeasured", loc)}
                      </span>
                    ) : null}
                    {/* egyoldalú confidence = csak az egyik irányból van mért válasz */}
                    {e.source === "trust_round" && e.confidence === EDGE_CONFIDENCE_ONE_SIDED ? (
                      <span className="rounded-full border border-sand px-1.5 py-0.5 text-micro text-muted">
                        {t("teamComp.edgeOneSided", loc)}
                      </span>
                    ) : null}
                    <svg
                      className={`h-3 w-3 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                    >
                      <path d="M3 4.5L6 7.5L9 4.5" />
                    </svg>
                  </button>

                  {/* Hiányzó profil-adatnál a bontás helyett jelöljük az okot
                      — nem számolunk gap-et kitalált 50-esek ellen. */}
                  {isExpanded && !hasPairProfiles && (
                    <div className="mb-2 ml-5 mt-1 rounded-lg border border-dashed border-sand bg-cream/60 p-3">
                      <p className="text-micro leading-snug text-muted">
                        {t("teamComp.breakdownNoProfile", loc)}
                      </p>
                    </div>
                  )}
                  {isExpanded && breakdown && (
                    <div className="mb-2 ml-5 mt-1 rounded-lg border border-sand bg-cream/60 p-3">
                      <div className="flex flex-col gap-2">
                        {breakdown.gaps.slice(0, 4).map((g) => (
                          <div key={g.code}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-micro font-semibold text-ink">{g.label}</span>
                              <span className="text-micro text-muted">
                                {g.gap < 15
                                  ? (loc === "hu" ? "hasonló" : "similar")
                                  : g.gap < 30
                                    ? (loc === "hu" ? "eltérő" : "different")
                                    : (loc === "hu" ? "nagyon eltérő" : "very different")}
                              </span>
                            </div>
                            <div className="mt-0.5 flex gap-1">
                              <div className="h-1 flex-1 overflow-hidden rounded-full bg-sand">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(g.gap, 100)}%`,
                                    backgroundColor: g.gap < 15 ? DYNAMICS_COLORS_CSS.aligned : g.gap < 30 ? DYNAMICS_COLORS_CSS.complementary : DYNAMICS_COLORS_CSS.friction,
                                  }}
                                />
                              </div>
                            </div>
                            {g.hint && (
                              <p className="mt-0.5 text-micro leading-snug text-muted">{g.hint}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-sand pt-2 text-[11px] text-ink-body">
        <span className="font-semibold text-ink">{myEdges.length}</span> {t("teamComp.incomingConnections", loc)}
      </div>
    </div>
  );
}

interface DynamicsMapProps {
  members: IntelligenceMember[];
  edges: DynamicsEdge[];
  isHu?: boolean;
}

export function DynamicsMap({ members, edges, isHu = true }: DynamicsMapProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const loc: Locale = isHu ? "hu" : "en";

  if (edges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-sand bg-[var(--color-surface-chip-neutral)] py-16 text-center">
        <p className="text-[14px] font-semibold text-ink">
          {t("teamComp.noDynamicsTitle", loc)}
        </p>
        <p className="mt-1 text-[12px] text-muted">
          {t("teamComp.noDynamicsDesc", loc)}
        </p>
      </div>
    );
  }

  const positions = getCircularPositions(members, 180, 180, 130);
  // Van-e mért (trust) él a térképen — a jelmagyarázat „hasonló profil"
  // címkéje csak tisztán profil-becslés képre igaz; mért él mellett az
  // aligned szín semleges címkét kap (a mért aligned = erős bizalom).
  const hasMeasuredEdges = edges.some((e) => isMeasuredDynamicsSource(e.source));
  // Hub-forrás a riporttal (team-report trustHighlights) AZONOSAN: ha van
  // mért trust-pár, a trust-háló hub-jai (isTrustHub, szerveren számolva)
  // karikázódnak; csak tiszta profil-becslés képen fut a computeAlignedHubIds
  // (aligned-fok ≥ 3, mindkét végpont számít). Korábban a térkép a KEVERT
  // él-listán becsült hubot — a riport és a térkép más embert emelhetett ki.
  const hubIds = hasMeasuredEdges
    ? members.filter((m) => m.isTrustHub).map((m) => m.id)
    : computeAlignedHubIds(edges);

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* SVG — mobilon a beágyazás ~230–290px-re nyomná össze a 360-as
          viewBoxot (olvashatatlan nevek, 44px alatti tap-célok), ezért alsó
          szélesség-korlát + vízszintesen görgethető konténer. */}
      <div className="min-w-0 flex-1 overflow-x-auto">
        <svg
          viewBox="0 0 360 360"
          className="w-full min-w-[340px] rounded-xl border border-sand bg-surface-card"
        >
          {/* Edges */}
          {edges.map((e, i) => {
            const from = positions[e.from];
            const to = positions[e.to];
            if (!from || !to) return null;
            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={EDGE_COLORS[e.type]}
                strokeWidth={EDGE_WIDTHS[e.type]}
                strokeDasharray={EDGE_DASH[e.type]}
                opacity={e.type === "complementary" ? 0.45 : 0.8}
              />
            );
          })}

          {/* Nodes */}
          {members.map((m) => {
            const pos = positions[m.id];
            if (!pos) return null;
            const isHub = hubIds.includes(m.id);
            const r = isHub ? 22 : 18;
            return (
              <g
                key={m.id}
                className="cursor-pointer"
                onClick={() => setSelected(selected === m.id ? null : m.id)}
              >
                {isHub && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 5}
                    fill="none"
                    stroke="var(--color-accent-primary)"
                    strokeWidth={1}
                    opacity={0.35}
                  />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={m.color}
                  stroke={selected === m.id ? "var(--color-action-primary-bg)" : "white"}
                  strokeWidth={selected === m.id ? 2.5 : 2}
                />
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={11}
                  fontWeight="800"
                  fill={m.textColor}
                >
                  {m.initials}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + r + 13}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--color-text-secondary)"
                >
                  {m.name.split(" ")[0]}
                </text>
                {/* Láthatatlan, nagyobb érintési cél: a node az egyetlen
                    interakciós pont, a rajzolt sugár ujjhoz túl kicsi. */}
                <circle cx={pos.x} cy={pos.y} r={r + 8} fill="transparent" />
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-4">
          {(["aligned", "complementary", "friction"] as DynamicsEdge["type"][]).map((edgeType) => {
            const legendKey =
              edgeType === "aligned"
                ? hasMeasuredEdges
                  ? "teamComp.legendAlignedNeutral"
                  : "teamComp.legendAligned"
                : edgeType === "complementary"
                  ? "teamComp.legendComplementary"
                  : "teamComp.legendFriction";
            return (
              <div key={edgeType} className="flex items-center gap-2">
                <div className="h-[3px] w-6 rounded" style={{ background: EDGE_COLORS[edgeType] }} />
                <span className="text-[11px] text-ink-body">
                  {t(legendKey, loc)}
                </span>
              </div>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[var(--color-surface-warm-tint)] ring-1 ring-sage" />
            <span className="text-[11px] text-ink-body">{t("teamComp.hubPerson", loc)}</span>
          </div>
        </div>

        {/* Forrás-transzparencia: mért trust-adat vs profil-alapú becslés.
            A "mért" definíció közös (isMeasuredDynamicsSource): trust_round ∪
            observer — az intelligence-data/cockpit/riport számlálóival azonos. */}
        {hasMeasuredEdges ? (
          <p className="mt-2 text-micro leading-relaxed text-muted">
            {loc === "hu"
              ? `A kapcsolatok egy része bizalmi kör alapján MÉRT adat (${edges.filter((e) => isMeasuredDynamicsSource(e.source)).length}/${edges.length} kapcsolat), a többi profil-alapú becslés.`
              : `Some connections are MEASURED from a trust round (${edges.filter((e) => isMeasuredDynamicsSource(e.source)).length}/${edges.length} connections); the rest are profile-based estimates.`}
          </p>
        ) : (
          <p className="mt-2 text-micro leading-relaxed text-muted">
            {loc === "hu"
              ? "A kapcsolat-jelzések profil-alapú becslések — bizalmi kör indításával mért adatra cserélhetők."
              : "Connection markers are profile-based estimates — run a trust round to replace them with measured data."}
          </p>
        )}
      </div>

      {/* Detail panel */}
      <div className="w-full flex-shrink-0 md:w-[240px]">
        {selected ? (
          <DynamicsDetailPanel
            member={members.find((m) => m.id === selected)!}
            edges={edges}
            members={members}
            loc={loc}
          />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-sand bg-surface-card p-6 text-center">
            <p className="text-[12px] text-muted">
              {t("teamComp.clickPerson", loc)}
              <br />{t("teamComp.clickPersonConnections", loc)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
