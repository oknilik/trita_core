"use client";

import { useState } from "react";
import { TeamMap } from "./TeamMap";
import { DynamicsMap } from "./DynamicsMap";
import { RoleFitMap } from "./RoleFitMap";

export type SubTab = "map" | "dynamics" | "roles";

export interface IntelligenceMember {
  id: string;
  name: string;
  initials: string;
  hexaco: { H: number; E: number; X: number; A: number; C: number; O: number };
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

interface TeamIntelligenceProps {
  members: IntelligenceMember[];
  edges: DynamicsEdge[];
  isHu?: boolean;
}

const SUB_LABELS_HU = {
  map: "① Csapattérkép",
  dynamics: "② Dinamika",
  roles: "③ Szerep illeszkedés",
} as const;

const SUB_LABELS_EN = {
  map: "① Team Map",
  dynamics: "② Dynamics Map",
  roles: "③ Role Fit",
} as const;

export function TeamIntelligence({ members, edges, isHu = true }: TeamIntelligenceProps) {
  const [sub, setSub] = useState<SubTab>("map");
  const labels = isHu ? SUB_LABELS_HU : SUB_LABELS_EN;

  return (
    <div className="pt-6">
      {/* Al-tab navigáció */}
      <div className="mb-5 flex gap-2">
        {(["map", "dynamics", "roles"] as SubTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSub(t)}
            className={[
              "rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors",
              sub === t
                ? "bg-ink text-white"
                : "bg-warm-mid text-ink-body hover:bg-sand",
            ].join(" ")}
          >
            {labels[t]}
          </button>
        ))}
      </div>

      {sub === "map" && <TeamMap members={members} isHu={isHu} />}
      {sub === "dynamics" && <DynamicsMap members={members} edges={edges} isHu={isHu} />}
      {sub === "roles" && <RoleFitMap members={members} isHu={isHu} />}
    </div>
  );
}
