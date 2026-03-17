"use client";

import { useState } from "react";
import type { IntelligenceMember } from "./TeamIntelligence";

const ZONE_LABELS_EN: Record<string, string> = {
  "3_1": "Emerging talent",
  "3_2": "High growth",
  "3_3": "Future leader",
  "2_1": "Developing",
  "2_2": "Solid contributor",
  "2_3": "High performer",
  "1_1": "Development focus",
  "1_2": "Stable contributor",
  "1_3": "Senior expert",
};

const ZONE_LABELS_HU: Record<string, string> = {
  "3_1": "Feltörekvő tehetség",
  "3_2": "Magas növekedés",
  "3_3": "Jövő vezetője",
  "2_1": "Fejlődik",
  "2_2": "Megbízható tag",
  "2_3": "Kiváló teljesítő",
  "1_1": "Fejlesztési fókusz",
  "1_2": "Stabil hozzájáruló",
  "1_3": "Senior szakértő",
};

const DIM_COLORS: Record<string, string> = {
  H: "#6366F1",
  E: "#EC4899",
  X: "#F59E0B",
  A: "#10B981",
  C: "#8B5CF6",
  O: "#06B6D4",
};

const DIM_NAMES: Record<string, string> = {
  H: "Őszinteség",
  E: "Érzelmesség",
  X: "Extraverzió",
  A: "Barátságosság",
  C: "Lelkiism.",
  O: "Nyitottság",
};

// Keep DIM_NAMES available (used if needed in future)
void DIM_NAMES;

type Hexaco = IntelligenceMember["hexaco"];

function estimateFromHexaco(hexaco: Hexaco): { skillLevel: 1 | 2 | 3; growthPotential: 1 | 2 | 3 } {
  const skillLevel: 1 | 2 | 3 = hexaco.C >= 60 ? 3 : hexaco.C >= 40 ? 2 : 1;
  const growthScore = (hexaco.O + hexaco.X) / 2;
  const growthPotential: 1 | 2 | 3 = growthScore >= 60 ? 3 : growthScore >= 40 ? 2 : 1;
  return { skillLevel, growthPotential };
}

function hasRealScores(hexaco: Hexaco): boolean {
  return Object.values(hexaco).some((v) => v !== 50);
}

interface PlacedMember extends IntelligenceMember {
  skillLevel: 1 | 2 | 3;
  growthPotential: 1 | 2 | 3;
  isEstimated: boolean;
}

interface MemberDetailPanelProps {
  member: PlacedMember;
}

function MemberDetailPanel({ member }: MemberDetailPanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#e8e4dc] bg-white p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-white text-[12px] font-bold"
          style={{ background: member.color, color: member.textColor }}
        >
          {member.initials}
        </div>
        <div>
          <p className="text-[14px] font-bold text-[#1a1814]">{member.name}</p>
          <div className="flex items-center gap-1.5">
            <span className="inline-block rounded-full bg-[#f0ede6] px-2 py-0.5 text-[10px] font-medium text-[#5a5650]">
              {member.zone}
            </span>
            {member.isEstimated && (
              <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                becsült
              </span>
            )}
          </div>
        </div>
      </div>

      {/* HEXACO bars */}
      <div>
        <p className="mb-2 font-mono text-[8px] uppercase tracking-widest text-[#c8410a]">
          // hexaco profil
        </p>
        <div className="flex flex-col gap-1.5">
          {(Object.keys(DIM_COLORS) as Array<keyof typeof DIM_COLORS>).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <div
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[7px] font-bold text-white"
                style={{ background: DIM_COLORS[k] }}
              >
                {k}
              </div>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f0ede6]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${member.hexaco[k as keyof typeof member.hexaco]}%`,
                    background: DIM_COLORS[k],
                    opacity: 0.85,
                  }}
                />
              </div>
              <span className="w-8 text-right font-mono text-[10px] text-[#5a5650]">
                {member.hexaco[k as keyof typeof member.hexaco]}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Skill & growth */}
      <div className="flex gap-3 border-t border-[#e8e4dc] pt-3">
        <div className="flex-1 text-center">
          <p className="font-mono text-[8px] uppercase tracking-widest text-[#a09a90]">skill</p>
          <div className="mt-1 flex justify-center gap-0.5">
            {[1, 2, 3].map((v) => (
              <div
                key={v}
                className="h-2 w-2 rounded-full"
                style={{
                  background: v <= member.skillLevel ? "#c8410a" : "#e8e4dc",
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex-1 text-center">
          <p className="font-mono text-[8px] uppercase tracking-widest text-[#a09a90]">potenciál</p>
          <div className="mt-1 flex justify-center gap-0.5">
            {[1, 2, 3].map((v) => (
              <div
                key={v}
                className="h-2 w-2 rounded-full"
                style={{
                  background: v <= member.growthPotential ? "#10B981" : "#e8e4dc",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TeamMapProps {
  members: IntelligenceMember[];
  isHu?: boolean;
}

export function TeamMap({ members, isHu = true }: TeamMapProps) {
  const ZONE_LABELS = isHu ? ZONE_LABELS_HU : ZONE_LABELS_EN;
  const [selected, setSelected] = useState<string | null>(null);

  const placedMembers: PlacedMember[] = members.map((m) => {
    if (hasRealScores(m.hexaco)) {
      const { skillLevel, growthPotential } = estimateFromHexaco(m.hexaco);
      return { ...m, skillLevel, growthPotential, isEstimated: true };
    }
    return { ...m, isEstimated: false };
  });

  const hasEstimated = placedMembers.some((m) => m.isEstimated);
  const selectedMember = placedMembers.find((m) => m.id === selected);

  const cellGroups: Record<string, PlacedMember[]> = {};
  placedMembers.forEach((m) => {
    const key = `${m.growthPotential}_${m.skillLevel}`;
    if (!cellGroups[key]) cellGroups[key] = [];
    cellGroups[key].push(m);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Left: 3×3 grid */}
        <div className="flex-1">
          <div className="mb-1 text-center">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#a09a90]">
              ← fejlődési potenciál →
            </span>
          </div>

          <div className="flex gap-1.5">
            {/* Y-axis label */}
            <div className="flex w-4 items-center justify-center">
              <span
                className="font-mono text-[8px] uppercase tracking-widest text-[#a09a90]"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                magas → alacsony
              </span>
            </div>

            {/* Grid */}
            <div className="flex-1">
              <div className="grid grid-rows-3 gap-1.5">
                {[3, 2, 1].map((pot) => (
                  <div key={pot} className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3].map((skill) => {
                      const key = `${pot}_${skill}`;
                      const cellMembers = cellGroups[key] ?? [];
                      const zoneLabel = ZONE_LABELS[key];

                      return (
                        <div
                          key={key}
                          className="relative min-h-[90px] rounded-xl border border-[#e8e4dc] bg-[#f8f7f4] p-2"
                        >
                          {zoneLabel && (
                            <span className="absolute left-2 top-2 font-mono text-[8px] leading-tight text-[#b0ada6]">
                              {zoneLabel}
                            </span>
                          )}
                          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                            {cellMembers.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setSelected(selected === m.id ? null : m.id)}
                                title={m.name}
                                className={[
                                  "relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold transition-transform hover:scale-110",
                                  selected === m.id
                                    ? "outline outline-2 outline-[#c8410a] outline-offset-1"
                                    : "",
                                  m.isEstimated ? "opacity-50" : "",
                                ].join(" ")}
                                style={{ background: m.color, color: m.textColor }}
                              >
                                {m.initials}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* X-axis labels */}
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {["alacsony", "közép", "magas"].map((l) => (
                  <div key={l} className="text-center font-mono text-[8px] text-[#a09a90]">
                    {l}
                  </div>
                ))}
              </div>
              <div className="mt-0.5 text-center">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#a09a90]">
                  ← szakmai szint →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="w-full flex-shrink-0 md:w-[260px]">
          {selectedMember ? (
            <MemberDetailPanel member={selectedMember} />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-[#e8e4dc] bg-white p-6 text-center">
              <p className="text-[12px] text-[#a09a90]">
                Kattints egy személyre
                <br />a részletek megtekintéséhez
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Estimation info overlay */}
      {hasEstimated && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
          <svg
            viewBox="0 0 16 16"
            className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 5v3.5M8 11v.5" />
          </svg>
          <p className="text-[11px] text-amber-800">
            Az átlátszó avatárok pozíciója HEXACO-adatokból becsült (C → szakmai szint, (O+X)/2 → potenciál). A végleges elhelyezést a csapatvezető manuálisan pontosíthatja.
          </p>
        </div>
      )}
    </div>
  );
}
