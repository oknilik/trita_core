"use client";

import Link from "next/link";
import { estimateBelbinFromHexaco } from "@/lib/belbin-estimate";
import { BELBIN_ROLES, getTopRoles } from "@/lib/belbin-scoring";
import type { BelbinRoleCode } from "@/lib/belbin-scoring";
import type { Locale } from "@/lib/i18n";

interface BelbinTeaserProps {
  /** HEXACO dimension scores (0-100) keyed by dimension code */
  hexacoScores: Record<string, number>;
  locale: Locale | string;
}

const ROLE_DESCRIPTIONS: Record<BelbinRoleCode, { hu: string; en: string }> = {
  PL: { hu: "Kreatív ötletgazda, nem konvencionális gondolkodó", en: "Creative ideas, unconventional thinker" },
  RI: { hu: "Lelkes networker, külső lehetőségeket hoz", en: "Enthusiastic networker, finds external opportunities" },
  CO: { hu: "Érett koordinátor, célra összpontosítja a csapatot", en: "Mature coordinator, focuses the team on goals" },
  SH: { hu: "Dinamikus hajtóerő, kihívásokat szeret", en: "Dynamic driver, thrives on challenges" },
  ME: { hu: "Stratégiai elemző, tárgyilagos értékelő", en: "Strategic analyst, objective evaluator" },
  TW: { hu: "Együttműködő csapattag, enyhíti a feszültséget", en: "Cooperative team player, eases tension" },
  IM: { hu: "Megbízható végrehajtó, terveket valósít meg", en: "Reliable implementer, turns plans into action" },
  CF: { hu: "Aprólékos tökéletesítő, hibákat kiszűr", en: "Painstaking finisher, catches errors" },
  SP: { hu: "Szaktudású specialista, mélyreható ismeretek", en: "Expert specialist, deep subject knowledge" },
};

export function BelbinTeaser({ hexacoScores, locale }: BelbinTeaserProps) {
  const isHu = locale === "hu";

  // Only meaningful for HEXACO-coded dimensions (H, E, X, A, C, O)
  const hasHexacoDims = "H" in hexacoScores && "X" in hexacoScores;
  if (!hasHexacoDims) return null;

  const estimated = estimateBelbinFromHexaco(
    hexacoScores as Record<"H" | "E" | "X" | "A" | "C" | "O", number>,
  );
  const top3 = getTopRoles(estimated, 3);

  return (
    <section>
      <div className="mb-6 flex items-center gap-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
          {isHu ? "// csapatszerepek (belbin)" : "// team roles (belbin)"}
        </p>
        <span className="rounded-full bg-[#f0ece4] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#a09a90]">
          {isHu ? "becslés" : "estimate"}
        </span>
      </div>

      <h2 className="mb-2 font-playfair text-2xl text-[#1a1814]">
        {isHu ? "Valószínű csapatszerepeid" : "Your likely team roles"}
      </h2>
      <p className="mb-6 max-w-lg text-sm leading-relaxed text-[#5a5650]">
        {isHu
          ? "Személyiségprofilod alapján ezek a Belbin-csapatszerepek illenek hozzád leginkább. A pontos méréshez töltsd ki a Belbin kérdőívet."
          : "Based on your personality profile, these Belbin team roles fit you best. Complete the Belbin questionnaire for an exact measurement."}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {top3.map(({ role, score }, idx) => {
          const roleMeta = BELBIN_ROLES[role];
          const desc = ROLE_DESCRIPTIONS[role];
          const rankLabel = idx === 0
            ? (isHu ? "Elsődleges" : "Primary")
            : idx === 1
              ? (isHu ? "Másodlagos" : "Secondary")
              : (isHu ? "Kiegészítő" : "Supporting");
          const rankColor = idx === 0
            ? "bg-[#c8410a] text-white"
            : "bg-[#f0ece4] text-[#5a5650]";

          return (
            <div
              key={role}
              className="flex flex-col gap-3 rounded-xl border border-[#e8e4dc] bg-white p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${rankColor}`}
                >
                  {rankLabel}
                </span>
                <span className="font-mono text-xs text-[#a09a90]">{score}%</span>
              </div>
              <div>
                <p className="font-playfair text-lg leading-snug text-[#1a1814]">
                  {isHu ? roleMeta.hu : roleMeta.en}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#5a5650]">
                  {isHu ? desc.hu : desc.en}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info note + CTA */}
      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#e8e4dc] bg-[#faf9f6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-relaxed text-[#5a5650]">
          {isHu
            ? "Ez egy becslés a személyiségprofilodból. A pontos Belbin-kérdőív kitöltésével csapatszintű összehasonlítás is elérhetővé válik."
            : "This is an estimate from your personality profile. Completing the full Belbin questionnaire unlocks team-level comparison."}
        </p>
        <Link
          href="/sign-up?intent=team"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-[#e8e4dc] bg-white px-4 text-sm font-semibold text-[#3d3a35] transition hover:border-[#c8410a]/40 hover:text-[#c8410a]"
        >
          {isHu ? "Csapatba lépés →" : "Join a team →"}
        </Link>
      </div>
    </section>
  );
}
