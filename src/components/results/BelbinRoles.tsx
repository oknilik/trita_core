"use client";

import { estimateBelbinFromHexaco } from "@/lib/belbin-estimate";
import { BELBIN_ROLES, getTopRoles } from "@/lib/belbin-scoring";
import type { BelbinRoleCode } from "@/lib/belbin-scoring";

interface BelbinRolesProps {
  hexacoScores: Record<string, number>;
  locale: string;
}

const ROLE_SUBTITLES: Record<BelbinRoleCode, { hu: string; en: string }> = {
  PL: { hu: "Kreatív ötletgazda a csapatban", en: "Creative ideas person in the team" },
  RI: { hu: "Lelkes networker a csapatban", en: "Enthusiastic networker in the team" },
  CO: { hu: "Érett koordinátor a csapatban", en: "Mature coordinator in the team" },
  SH: { hu: "Dinamikus hajtóerő a csapatban", en: "Dynamic driver in the team" },
  ME: { hu: "Stratégiai elemző a csapatban", en: "Strategic analyst in the team" },
  TW: { hu: "Együttműködő támasz a csapatban", en: "Cooperative support in the team" },
  IM: { hu: "Megbízható végrehajtó a csapatban", en: "Reliable implementer in the team" },
  CF: { hu: "Aprólékos tökéletesítő a csapatban", en: "Painstaking finisher in the team" },
  SP: { hu: "Szaktudású specialista a csapatban", en: "Expert specialist in the team" },
};

const ROLE_DESCRIPTIONS: Record<BelbinRoleCode, { hu: string; en: string }> = {
  PL: { hu: "Eredeti gondolkodó, aki új megoldásokat hoz — de néha elszakad a gyakorlati megvalósítástól.", en: "Original thinker who brings new solutions — but can lose touch with practical implementation." },
  RI: { hu: "Könnyen teremt kapcsolatokat és hoz külső lehetőségeket — de az utánkövetés nem az erőssége.", en: "Easily builds connections and brings external opportunities — but follow-through isn't their strength." },
  CO: { hu: "Természetes facilitátor, aki célra fókuszálja a csapatot — de delegálhat túl sokat.", en: "Natural facilitator who focuses the team on goals — but may over-delegate." },
  SH: { hu: "Hajtott, kihívásokat kereső típus. Nyomás alatt is teljesít, előre viszi a csapatot — de néha türelmetlenül.", en: "Driven, challenge-seeking type. Performs under pressure, pushes the team forward — but sometimes impatiently." },
  ME: { hu: "Tárgyilagosan elemez, jó döntéseket hoz — de lassú reagálású és túl kritikus lehet.", en: "Analyzes objectively, makes good decisions — but can be slow to react and overly critical." },
  TW: { hu: "Segítőkész és diplomata, enyhíti a feszültséget — de döntéshelyzetben határozatlan lehet.", en: "Helpful and diplomatic, eases tension — but can be indecisive in decision moments." },
  IM: { hu: "Rendszeres és megbízható, terveket valósít meg — de rugalmatlan lehet új helyzetekben.", en: "Systematic and reliable, turns plans into action — but can be inflexible in new situations." },
  CF: { hu: "Precíz és alapos, hibákat kiszűr a végén — de aggódhat a határidők miatt.", en: "Precise and thorough, catches errors at the end — but may worry about deadlines." },
  SP: { hu: "Mélyreható szaktudás, nélkülözhetetlen egy területen — de szűk fókuszú lehet.", en: "Deep expertise, indispensable in one area — but can have a narrow focus." },
};

const RANK_LABELS = [
  { hu: "Elsődleges", en: "Primary" },
  { hu: "Másodlagos", en: "Secondary" },
  { hu: "Harmadik", en: "Third" },
];

export function BelbinRoles({ hexacoScores, locale }: BelbinRolesProps) {
  const isHu = locale === "hu";

  const hasHexacoDims = "H" in hexacoScores && "X" in hexacoScores;
  if (!hasHexacoDims) return null;

  const estimated = estimateBelbinFromHexaco(
    hexacoScores as Record<"H" | "E" | "X" | "A" | "C" | "O", number>,
  );
  const top3 = getTopRoles(estimated, 3);

  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-[#8a8a9a]">
        {isHu ? "Csapatszerepek (Belbin)" : "Team roles (Belbin)"}
      </p>
      <h2 className="mt-1.5 mb-6 font-fraunces text-[22px] tracking-tight text-[#1a1a2e]">
        {isHu ? "Így jelenhetsz meg csapatban" : "How you show up in a team"}
      </h2>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.4fr_1fr_1fr]">
        {top3.map(({ role, score }, idx) => {
          const roleMeta = BELBIN_ROLES[role];
          const subtitle = ROLE_SUBTITLES[role];
          const desc = ROLE_DESCRIPTIONS[role];
          const rank = RANK_LABELS[idx];
          const isPrimary = idx === 0;

          return (
            <div
              key={role}
              className={`flex cursor-pointer flex-col rounded-[14px] transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isPrimary
                  ? "border-2 border-[#3d6b5e] bg-[#e8f2f0] p-[22px]"
                  : "border-[1.5px] border-[#e8e0d3] bg-white p-[18px]"
              }`}
            >
              {/* Badge */}
              <span
                className={`mb-2 self-start rounded px-[9px] py-[3px] text-[8px] font-bold uppercase tracking-wide ${
                  isPrimary
                    ? "bg-[#3d6b5e] text-white"
                    : idx === 1
                      ? "bg-[#fdf5ee] text-[#8a5530]"
                      : "bg-[#f2ede6] text-[#8a8a9a]"
                }`}
              >
                {isHu ? rank.hu : rank.en} · {score}%
              </span>

              {/* Name */}
              <p
                className={`mb-0.5 font-fraunces text-[#1a1a2e] ${
                  isPrimary ? "text-[19px]" : "text-[17px]"
                }`}
              >
                {isHu ? roleMeta.hu : roleMeta.en}
              </p>

              {/* Subtitle */}
              <p className="mb-1.5 text-[11px] italic text-[#8a8a9a]">
                {isHu ? subtitle.hu : subtitle.en}
              </p>

              {/* Description */}
              <p className="text-xs leading-relaxed text-[#4a4a5e]">
                {isHu ? desc.hu : desc.en}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
