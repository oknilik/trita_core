"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import type { IntelligenceMember, DynamicsEdge } from "./TeamIntelligence";

const EDGE_COLORS: Record<DynamicsEdge["type"], string> = {
  aligned: "var(--color-state-success-strong)",
  complementary: "#d3cfc6",
  friction: "#f59e0b",
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

function getHubIds(edges: DynamicsEdge[]): string[] {
  const counts: Record<string, number> = {};
  edges
    .filter((e) => e.type === "aligned")
    .forEach((e) => {
      counts[e.to] = (counts[e.to] ?? 0) + 1;
    });
  return Object.entries(counts)
    .filter(([, count]) => count >= 3)
    .map(([id]) => id);
}

interface DynamicsDetailPanelProps {
  member: IntelligenceMember;
  edges: DynamicsEdge[];
  members: IntelligenceMember[];
  loc: Locale;
}

function DynamicsDetailPanel({ member, edges, members, loc }: DynamicsDetailPanelProps) {
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
  // Profile-based edges are symmetric — show all edges involving this member
  const outgoing = edges.filter((e) => e.from === member.id || e.to === member.id);
  const incoming = edges.filter((e) => e.to === member.id || e.from === member.id);

  const edgeLabelKey: Record<DynamicsEdge["type"], string> = {
    aligned: "teamComp.edgeAligned",
    friction: "teamComp.edgeFriction",
    complementary: "teamComp.edgeComplementary",
  };

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
        </div>
      </div>

      {outgoing.length > 0 && (
        <div>
          <SectionEyebrow className="mb-1.5 text-[8px]">
            {t("teamComp.connectionsEyebrow", loc)}
          </SectionEyebrow>
          <div className="flex flex-col gap-1">
            {outgoing.map((e, i) => {
              const otherId = e.from === member.id ? e.to : e.from;
              const target = memberMap[otherId];
              if (!target) return null;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: EDGE_COLORS[e.type] }}
                  />
                  <span className="text-[11px] text-ink-body">{target.name}</span>
                  <span className="ml-auto text-[10px] text-muted">
                    {t(edgeLabelKey[e.type], loc)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-sand pt-2 text-[11px] text-ink-body">
        <span className="font-semibold text-ink">{incoming.length}</span> {t("teamComp.incomingConnections", loc)}
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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-sand bg-[#f8f7f4] py-16 text-center">
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
  const hubIds = getHubIds(edges);

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* SVG */}
      <div className="flex-1">
        <svg
          viewBox="0 0 360 360"
          className="w-full rounded-xl border border-sand bg-white"
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
                  fontSize={9}
                  fontWeight="800"
                  fill={m.textColor}
                >
                  {m.initials}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + r + 11}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--color-text-secondary)"
                >
                  {m.name.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-4">
          {(["aligned", "complementary", "friction"] as DynamicsEdge["type"][]).map((edgeType) => {
            const legendKey = edgeType === "aligned" ? "teamComp.legendAligned" : edgeType === "complementary" ? "teamComp.legendComplementary" : "teamComp.legendFriction";
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
            <div className="h-3 w-3 rounded-full bg-[#fce7d6] ring-1 ring-sage" />
            <span className="text-[11px] text-ink-body">{t("teamComp.hubPerson", loc)}</span>
          </div>
        </div>
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
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-sand bg-white p-6 text-center">
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
