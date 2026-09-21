import { HEXACO_ORDER, HEXACO_DIMENSIONS } from "@/lib/hexaco";
import { runProfileEngine } from "@/lib/profile-engine";
import { SOLO_DIM_SUMMARIES } from "@/lib/profile-content";
import { dimStandardError } from "@/lib/psychometrics";
import { isValidTeamRoleSelectionSet } from "@/lib/team-role-questions";
import {
  calculateTeamRoleScores,
  getTopRoles,
  TEAM_ROLES,
} from "@/lib/team-role-scoring";
import { t, tf, type Locale } from "@/lib/i18n";
import type { CandidateComparison } from "./comparisons";
export type Suggestion = {
  id: string;
  title: string;
  text: string;
  source: string;
  target:
    | "candidateSummary"
    | "managerSummary"
    | "connection"
    | "difference"
    | "prompt";
};
export function candidateSuggestions(input: {
  dimensions: Record<string, number>;
  measuredAt: string;
  locale: Locale;
  roleSelections?: unknown;
  roleCompleted: boolean;
  comparison?: CandidateComparison;
}): Suggestion[] {
  const { dimensions, locale, comparison: c } = input;
  if (
    !HEXACO_ORDER.every(
      (d) =>
        Number.isFinite(dimensions[d]) &&
        dimensions[d] >= 0 &&
        dimensions[d] <= 100,
    )
  )
    return [];
  const engine = runProfileEngine(dimensions, "TRITAN", "evaluative");
  const source = [
    tf("candidateSuggestions.source", locale, {
      date: input.measuredAt || "–",
    }),
    ...(c
      ? [
          tf("candidateSuggestions.teamSource", locale, {
            name: c.teamName,
            date: c.publishedAt.slice(0, 10),
            revision: c.revision,
            count: c.count,
          }),
        ]
      : []),
  ].join("\n");
  const block = (
    id: string,
    target: Suggestion["target"],
    text: string,
    role = false,
  ): Suggestion => ({
    id: `${c?.teamId ?? "profile"}:${id}`,
    title: t(`candidateSuggestions.${id}`, locale),
    target,
    text,
    source:
      source +
      (role && input.roleCompleted
        ? `\n${t("candidateSuggestions.roleSource", locale)}`
        : ""),
  });
  const lines = engine.topSoloDims.slice(0, 2).flatMap(({ dim, level }) => {
    const text = SOLO_DIM_SUMMARIES[`${dim}_${level}`]?.[locale];
    return text
      ? [
          `${HEXACO_DIMENSIONS[dim as keyof typeof HEXACO_DIMENSIONS][locale]}: ${text}`,
        ]
      : [];
  });
  const result: Suggestion[] = c
    ? []
    : [
        block(
          "profile",
          "candidateSummary",
          `${t("candidateSuggestions.hypothesis", locale)}\n${lines.join("\n\n") || t("candidateSuggestions.balanced", locale)}`,
        ),
      ];
  const validRoles =
    input.roleCompleted && isValidTeamRoleSelectionSet(input.roleSelections);
  const roles = validRoles
    ? getTopRoles(
        calculateTeamRoleScores(
          input.roleSelections as Parameters<typeof calculateTeamRoleScores>[0],
        ),
      ).map((r) => r.role)
    : [];
  const roleNames = (codes: typeof roles) =>
    codes.map((r) => TEAM_ROLES[r][locale]).join(", ");
  let roleText = roles.length
    ? tf("candidateSuggestions.roleOwn", locale, { roles: roleNames(roles) })
    : t("candidateSuggestions.noRole", locale);
  const roleEvidence = c?.evidence?.roles;
  if (c && roles.length) {
    if (
      roleEvidence &&
      roleEvidence.estimateCount === 0 &&
      roleEvidence.questionnaireCount >= 3 &&
      roleEvidence.questionnaireCount === c.count &&
      Object.values(roleEvidence.counts).reduce((a, b) => a + b, 0) ===
        c.count &&
      roleEvidence.secondaryCounts
    ) {
      const represented = roles.filter(
        (r) =>
          (roleEvidence.counts[r] ?? 0) +
            (roleEvidence.secondaryCounts?.[r] ?? 0) >
          0,
      );
      const absent = roles.filter((r) => !represented.includes(r));
      roleText +=
        "\n\n" +
        [
          represented.length
            ? tf("candidateSuggestions.overlap", locale, {
                roles: roleNames(represented),
              })
            : "",
          absent.length
            ? tf("candidateSuggestions.complement", locale, {
                roles: roleNames(absent),
              })
            : "",
        ]
          .filter(Boolean)
          .join("\n");
    } else roleText += `\n\n${t("candidateSuggestions.mixedRoles", locale)}`;
  }
  let question = t("candidateSuggestions.genericQuestion", locale);
  if (c) {
    const close = HEXACO_ORDER.filter(
      (d) =>
        Math.abs(dimensions[d] - c.dimensions[d]) <=
        dimStandardError("short", d),
    );
    result.push(
      block(
        "connection",
        "connection",
        close.length
          ? tf("candidateSuggestions.close", locale, {
              dimensions: close
                .map((d) => HEXACO_DIMENSIONS[d][locale])
                .join(", "),
            })
          : t("candidateSuggestions.noClose", locale),
      ),
    );
    const spread = c.evidence?.spread;
    const completeSpread =
      spread &&
      HEXACO_ORDER.every((d) => Number.isFinite(spread[d]) && spread[d] >= 0);
    const gaps = completeSpread
      ? HEXACO_ORDER.filter(
          (d) =>
            Math.abs(dimensions[d] - c.dimensions[d]) >
            Math.max(1.96 * dimStandardError("short", d), spread[d]),
        )
      : [];
    const gapText = gaps
      .map((d) =>
        tf("candidateSuggestions.gap", locale, {
          dimension: HEXACO_DIMENSIONS[d][locale],
          candidate: dimensions[d].toFixed(1),
          team: c.dimensions[d].toFixed(1),
          sd: spread![d].toFixed(1),
        }),
      )
      .join("\n\n");
    result.push(
      block(
        "difference",
        "difference",
        `${gapText || t(completeSpread ? "candidateSuggestions.noGap" : "candidateSuggestions.noSpread", locale)}\n\n${t("candidateSuggestions.method", locale)}`,
      ),
    );
    if (gaps.length)
      question = tf("candidateSuggestions.question", locale, {
        dimension: HEXACO_DIMENSIONS[gaps[0]][locale],
      });
  }
  result.push(
    block(
      "roles",
      c ? "prompt" : "managerSummary",
      roleText,
      Boolean(validRoles),
    ),
  );
  result.push(
    block(
      "interview",
      c ? "prompt" : "managerSummary",
      question +
        (roles.length
          ? `\n\n${t("candidateSuggestions.roleQuestion", locale)}`
          : ""),
    ),
  );
  return result;
}
