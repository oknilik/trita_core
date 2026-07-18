"use client";

import { estimateTeamRolesFromTritan } from "@/lib/team-role-estimate";
import { TEAM_ROLES, getTopRoles } from "@/lib/team-role-scoring";
import type { TeamRoleCode } from "@/lib/team-role-scoring";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface TeamRolesProps {
  tritanScores: Record<string, number>;
  locale: Locale;
}

const ROLE_SUBTITLES: Record<TeamRoleCode, { hu: string; en: string }> = {
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

const ROLE_DESCRIPTIONS: Record<TeamRoleCode, { hu: string; en: string }> = {
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

export function TeamRoles({ tritanScores, locale }: TeamRolesProps) {
  const lang = locale === "hu" ? "hu" : "en";

  const hasTritanDims = "INTE" in tritanScores && "TEMP" in tritanScores;
  if (!hasTritanDims) return null;

  const estimated = estimateTeamRolesFromTritan(
    tritanScores as Record<"INTE" | "RESO" | "TEMP" | "ADAP" | "THOR" | "OPEN", number>,
  );
  const top3 = getTopRoles(estimated, 3);

  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
        {t("results.teamRoleEyebrow", locale)}
      </p>
      <h2 className="mt-1.5 mb-6 font-fraunces text-[22px] tracking-tight text-[var(--color-text-primary)]">
        {t("results.teamRoleTitle", locale)}
      </h2>
      <p className="mb-6 max-w-lg text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
        {t("content.teamRoleSub", locale)}
      </p>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.4fr_1fr_1fr]">
        {top3.map(({ role, score }, idx) => {
          const roleMeta = TEAM_ROLES[role];
          const subtitle = ROLE_SUBTITLES[role];
          const desc = ROLE_DESCRIPTIONS[role];
          const rank = RANK_LABELS[idx];
          const isPrimary = idx === 0;

          return (
            <div
              key={role}
              className={`flex cursor-pointer flex-col rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isPrimary
                  ? "border-2 border-[var(--color-action-primary-bg)] bg-[var(--color-surface-self-accent-soft)] p-[22px]"
                  : "border-[1.5px] border-[var(--color-border-soft)] bg-white p-[18px]"
              }`}
            >
              {/* Badge */}
              <span
                className={`mb-2 self-start rounded px-[9px] py-[3px] text-[8px] font-bold uppercase tracking-wide ${
                  isPrimary
                    ? "bg-[var(--color-action-primary-bg)] text-white"
                    : idx === 1
                      ? "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]"
                      : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]"
                }`}
              >
                {rank[lang]} · {score}%
              </span>

              {/* Name */}
              <p
                className={`mb-0.5 font-fraunces text-[var(--color-text-primary)] ${
                  isPrimary ? "text-[19px]" : "text-[17px]"
                }`}
              >
                {roleMeta[lang]}
              </p>

              {/* Subtitle */}
              <p className="mb-1.5 text-[11px] italic text-[var(--color-text-muted)]">
                {subtitle[lang]}
              </p>

              {/* Description */}
              <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {desc[lang]}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
