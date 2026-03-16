"use client";

import { useState } from "react";
import type { IntelligenceMember } from "./TeamIntelligence";

interface RoleZone {
  id: string;
  label: string;
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
  { id: "med", label: "Mediátor",    x: 215, y: 80,  r: 55, bg: "#e8f7f1", stroke: "#6ee7b7", tc: "#085041", dims: ["A"] },
  { id: "inn", label: "Innovátor",   x: 360, y: 185, r: 55, bg: "#e0f2fe", stroke: "#7dd3fc", tc: "#075985", dims: ["O", "X"] },
  { id: "exe", label: "Kivitelező",  x: 300, y: 285, r: 50, bg: "#ede9fe", stroke: "#c4b5fd", tc: "#4c1d95", dims: ["C"] },
  { id: "ana", label: "Analizátor",  x: 130, y: 285, r: 50, bg: "#fef9c3", stroke: "#fcd34d", tc: "#713f12", dims: ["H", "C"] },
  { id: "ene", label: "Energizáló",  x: 70,  y: 185, r: 55, bg: "#fce7f3", stroke: "#f9a8d4", tc: "#831843", dims: ["E", "X"] },
  { id: "str", label: "Stratégista", x: 215, y: 210, r: 42, bg: "#f5f3ef", stroke: "#e8e4dc", tc: "#a09a90", dims: [], missing: true },
];

function getZoneForMember(hexaco: IntelligenceMember["hexaco"]): string {
  const sorted = Object.entries(hexaco).sort(([, a], [, b]) => b - a);
  const top = sorted[0][0];
  if (top === "A") return "med";
  if (top === "O" || top === "X") return "inn";
  if (top === "C") return "exe";
  if (top === "H") return "ana";
  if (top === "E") return "ene";
  return "med";
}

const DIM_COLORS: Record<string, string> = {
  H: "#6366F1",
  E: "#EC4899",
  X: "#F59E0B",
  A: "#10B981",
  C: "#8B5CF6",
  O: "#06B6D4",
};

interface RoleDetailPanelProps {
  member: IntelligenceMember;
  zone: RoleZone;
}

function RoleDetailPanel({ member, zone }: RoleDetailPanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#e8e4dc] bg-white p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-white text-[12px] font-bold"
          style={{ background: member.color, color: member.textColor }}
        >
          {member.initials}
        </div>
        <div>
          <p className="text-[14px] font-bold text-[#1a1814]">{member.name}</p>
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: zone.bg, color: zone.tc, border: `1px solid ${zone.stroke}` }}
          >
            {zone.label}
          </span>
        </div>
      </div>

      <div>
        <p className="mb-1.5 font-mono text-[8px] uppercase tracking-widest text-[#c8410a]">
          // domináns dimenziók
        </p>
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
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f0ede6]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${v}%`, background: DIM_COLORS[k] ?? "#888", opacity: 0.85 }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-[10px] text-[#5a5650]">{v}%</span>
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

  const zoneMembers: Record<string, IntelligenceMember[]> = {};
  members.forEach((m) => {
    const zoneId = getZoneForMember(m.hexaco);
    if (!zoneMembers[zoneId]) zoneMembers[zoneId] = [];
    zoneMembers[zoneId].push(m);
  });

  const missingZones = ROLE_ZONES.filter(
    (z) => !z.missing && (!zoneMembers[z.id] || zoneMembers[z.id].length === 0)
  );

  const selectedMember = members.find((m) => m.id === selected);
  const selectedZone = selectedMember
    ? ROLE_ZONES.find((z) => z.id === getZoneForMember(selectedMember.hexaco))
    : null;

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="flex-1">
        <svg
          viewBox="0 0 430 340"
          className="w-full rounded-xl border border-[#e8e4dc] bg-white"
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
                {z.label}
              </text>
              {z.missing && (
                <text
                  x={z.x}
                  y={z.y - z.r * 0.45 + 13}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#b0ada6"
                >
                  ⚠ hiányzik
                </text>
              )}
            </g>
          ))}

          {/* Members per zone */}
          {ROLE_ZONES.filter((z) => !z.missing).map((z) => {
            const mems = zoneMembers[z.id] ?? [];
            return mems.map((m, i) => {
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
                    stroke={selected === m.id ? "#c8410a" : "white"}
                    strokeWidth={selected === m.id ? 2.5 : 2}
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
              <span className="text-[10px] text-[#5a5650]">{z.label}</span>
            </div>
          ))}
          {missingZones.length > 0 && (
            <div className="ml-auto text-[10px] text-[#a09a90]">
              ⚠ {isHu ? "Hiányzó szerep:" : "Missing role:"}{" "}
              {missingZones.map((z) => z.label).join(", ")}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="w-full flex-shrink-0 md:w-[240px]">
        {selectedMember && selectedZone ? (
          <RoleDetailPanel member={selectedMember} zone={selectedZone} />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-[#e8e4dc] bg-white p-6 text-center">
            <p className="text-[12px] text-[#a09a90]">
              Kattints egy személyre
              <br />a szerepe megtekintéséhez
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
