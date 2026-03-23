"use client";

import { useState } from "react";
import type { IntelligenceMember, DynamicsEdge } from "./TeamIntelligence";

const EDGE_COLORS: Record<DynamicsEdge["type"], string> = {
  good: "#10B981",
  neutral: "#d3cfc6",
  tension: "#f87171",
};

const EDGE_WIDTHS: Record<DynamicsEdge["type"], number> = {
  good: 2.5,
  neutral: 1.5,
  tension: 2,
};

const EDGE_DASH: Record<DynamicsEdge["type"], string> = {
  good: "none",
  neutral: "6 3",
  tension: "none",
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
    .filter((e) => e.type === "good")
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
}

function DynamicsDetailPanel({ member, edges, members }: DynamicsDetailPanelProps) {
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
  const outgoing = edges.filter((e) => e.from === member.id);
  const incoming = edges.filter((e) => e.to === member.id);

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
          <p className="mb-1.5 font-mono text-[8px] uppercase tracking-widest text-bronze">
            // kapcsolatok
          </p>
          <div className="flex flex-col gap-1">
            {outgoing.map((e, i) => {
              const target = memberMap[e.to];
              if (!target) return null;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: EDGE_COLORS[e.type] }}
                  />
                  <span className="text-[11px] text-ink-body">{target.name}</span>
                  <span className="ml-auto text-[10px] text-muted">
                    {e.type === "good"
                      ? "jó együttmű."
                      : e.type === "tension"
                      ? "feszültség"
                      : "semleges"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-sand pt-2 text-[11px] text-ink-body">
        <span className="font-semibold text-ink">{incoming.length}</span> bejövő kapcsolat
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

  if (edges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-sand bg-[#f8f7f4] py-16 text-center">
        <p className="text-[14px] font-semibold text-ink">
          {isHu ? "Még nincs kapcsolati adat" : "No dynamics data yet"}
        </p>
        <p className="mt-1 text-[12px] text-muted">
          {isHu
            ? "Indíts szakmai visszajelzési kört a dynamics map feltöltéséhez"
            : "Run a peer feedback round to populate the dynamics map"}
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
                opacity={e.type === "neutral" ? 0.45 : 0.8}
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
                    stroke="#c17f4a"
                    strokeWidth={1}
                    opacity={0.35}
                  />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={m.color}
                  stroke={selected === m.id ? "#3d6b5e" : "white"}
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
                  fill="#4a4a5e"
                >
                  {m.name.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-4">
          {(["good", "neutral", "tension"] as DynamicsEdge["type"][]).map((t) => (
            <div key={t} className="flex items-center gap-2">
              <div className="h-[3px] w-6 rounded" style={{ background: EDGE_COLORS[t] }} />
              <span className="text-[11px] text-ink-body">
                {t === "good" ? "Jó együttmű." : t === "neutral" ? "Semleges" : "Feszültség"}
              </span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#fce7d6] ring-1 ring-sage" />
            <span className="text-[11px] text-ink-body">Hub személy</span>
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
          />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-sand bg-white p-6 text-center">
            <p className="text-[12px] text-muted">
              Kattints egy személyre
              <br />a kapcsolatai megtekintéséhez
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
