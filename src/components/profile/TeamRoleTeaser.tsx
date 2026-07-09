"use client";

import Link from "next/link";
import { estimateTeamRolesFromHexaco } from "@/lib/team-role-estimate";
import { TEAM_ROLES, getTopRoles } from "@/lib/team-role-scoring";
import type { TeamRoleCode } from "@/lib/team-role-scoring";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

interface TeamRoleTeaserProps {
  /** HEXACO dimension scores (0-100) keyed by dimension code */
  hexacoScores: Record<string, number>;
  locale: Locale | string;
}

const ROLE_DESCRIPTIONS: Record<TeamRoleCode, { hu: string; en: string }> = {
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

export function TeamRoleTeaser({ hexacoScores, locale }: TeamRoleTeaserProps) {
  const loc = (locale === "hu" ? "hu" : "en") as Locale;

  // Only meaningful for HEXACO-coded dimensions (H, E, X, A, C, O)
  const hasHexacoDims = "H" in hexacoScores && "X" in hexacoScores;
  if (!hasHexacoDims) return null;

  const estimated = estimateTeamRolesFromHexaco(
    hexacoScores as Record<"H" | "E" | "X" | "A" | "C" | "O", number>,
  );
  const top3 = getTopRoles(estimated, 3);

  return (
    <section>
      <div className="mb-6 flex items-center gap-2.5">
        <SectionEyebrow className="text-[11px] tracking-[2px]">
          {t("content.teamRoleTeaserEyebrow", loc)}
        </SectionEyebrow>
        <span className="rounded-full bg-warm-mid px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted">
          {t("content.teamRoleTeaserEstimate", loc)}
        </span>
      </div>

      <h2 className="mb-2 font-fraunces text-2xl text-ink">
        {t("content.teamRoleTeaserTitle", loc)}
      </h2>
      <p className="mb-6 max-w-lg text-sm leading-relaxed text-ink-body">
        {t("content.teamRoleTeaserDesc", loc)}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {top3.map(({ role, score }, idx) => {
          const roleMeta = TEAM_ROLES[role];
          const desc = ROLE_DESCRIPTIONS[role];
          const rankLabel = idx === 0
            ? t("content.teamRoleTeaserPrimary", loc)
            : idx === 1
              ? t("content.teamRoleTeaserSecondary", loc)
              : t("content.teamRoleTeaserSupporting", loc);
          const rankColor = idx === 0
            ? "bg-sage text-white"
            : "bg-warm-mid text-ink-body";

          return (
            <div
              key={role}
              className="flex flex-col gap-3 rounded-xl border border-sand bg-white p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${rankColor}`}
                >
                  {rankLabel}
                </span>
                <span className="font-mono text-xs text-muted">{score}%</span>
              </div>
              <div>
                <p className="font-fraunces text-lg leading-snug text-ink">
                  {roleMeta[loc]}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-body">
                  {desc[loc]}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info note + CTA */}
      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-sand bg-cream px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-relaxed text-ink-body">
          {t("content.teamRoleTeaserInfoNote", loc)}
        </p>
        <Link
          href="/sign-up?intent=team"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-sand bg-white px-4 text-sm font-semibold text-ink-body transition hover:border-sage/40 hover:text-bronze"
        >
          {t("content.teamRoleTeaserJoinTeam", loc)}
        </Link>
      </div>
    </section>
  );
}
