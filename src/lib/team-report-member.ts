// ─────────────────────────────────────────────────────────────────────
// Tag-nézet nézetmodell — a publikált (befagyasztott) csapat-aggregátum +
// a néző SAJÁT eredménye alapján. Kizárólag pozitív/építő metszet: a tag
// a saját adatát látja a csapat tükrében, más egyénről semmit.
// Terv: docs/product/feature-ideas.md #4 (tag-riport metszet).
//
// A csapat-részek a publikált riport aggregátumából jönnek (konzisztens a
// menedzser nézetével, tartja a kapuzást); a személyes részek a néző élő
// eredményéből. Prisma-mentes, kliens-oldalon is importálható.
// ─────────────────────────────────────────────────────────────────────

import type { SerializedTeamReport } from "@/lib/team-report";
import { withHuArticle } from "@/lib/hu-grammar";
import {
  TEAM_ROLES,
  getTopRoles,
  type TeamRoleCode,
  type TeamRoleScores,
} from "@/lib/team-role-scoring";
import { resolveDisplayRoleScores } from "@/lib/team-role-estimate";

const DIMS = ["H", "E", "X", "A", "C", "O"] as const;
type Loc = "hu" | "en";

export const MEMBER_DIM_LABELS: Record<string, { hu: string; en: string }> = {
  H: { hu: "Becsületesség-Alázat", en: "Honesty-Humility" },
  E: { hu: "Emocionalitás", en: "Emotionality" },
  X: { hu: "Extraverzió", en: "Extraversion" },
  A: { hu: "Barátságosság", en: "Agreeableness" },
  C: { hu: "Lelkiismeretesség", en: "Conscientiousness" },
  O: { hu: "Nyitottság", en: "Openness" },
};

// Tag-szemszögű „hogyan kamatoztasd" tipp dimenziónként — pozitív keret.
const DIM_MEMBER_TIP: Record<string, { hu: string; en: string }> = {
  C: {
    hu: "Építs a lelkiismeretességedre: sokat tehetsz azért, hogy a csapat ötleteiből határidőre kézzelfogható eredmény szülessen – vállald tudatosan ezt a szerepet.",
    en: "Use your conscientiousness: you can turn the team's ideas into on-time, finished results – deliberately take on that role.",
  },
  H: {
    hu: "Az egyenes, kiszámítható működésed bizalmat épít – támaszkodj rá a nehéz beszélgetéseknél és a döntéseknél.",
    en: "Your straightforward, dependable style builds trust – lean on it in tough conversations and decisions.",
  },
  A: {
    hu: "A rugalmasságod hidat épít az eltérő stílusok között – vállalj közvetítő szerepet, ahol feszül a helyzet.",
    en: "Your agreeableness bridges different styles – take a connecting role where things get tense.",
  },
  E: {
    hu: "Érzékenyen reagálsz a feszültebb helyzetekre – korán észlelheted, ha valaki elakad; ilyenkor érdemes megszólalnod.",
    en: "You sense how others are doing – you often notice first when someone is stuck; speak up then.",
  },
  X: {
    hu: "A lendületed viszi a csapatot – te tudod beindítani a közös munkát és tartani a tempót.",
    en: "Your energy drives the team – you can kick off shared work and keep up the pace.",
  },
  O: {
    hu: "Az új iránti nyitottságod új lendületet adhat a csapat működésének – hozz be tudatosan külső nézőpontokat és új ötleteket.",
    en: "Your openness to new things refreshes the team – deliberately bring in outside perspectives and ideas.",
  },
};

export interface MemberDim {
  code: string;
  label: string;
  /** A néző saját értéke (0–100). */
  self: number;
  /** Csapatátlag (0–100). */
  teamAvg: number;
  /** Csapaton belüli szórás — a sáv szélessége. */
  teamSpread: number;
  /** Érdemben a csapatátlag felett (≥ 6 pont) — itt egészíti ki a csapatot. */
  aboveTeam: boolean;
}

export interface MemberReportViewModel {
  memberName: string;
  /** Van-e saját + csapatátlag összevetés (mindkettő megvan). */
  hasSelfComparison: boolean;
  dims: MemberDim[];
  /** A dimenziók, ahol a leginkább kiegészíti a csapatot (max 2, felirat). */
  complementLabels: string[];
  primaryRole: { code: TeamRoleCode; label: string } | null;
  secondaryRole: { code: TeamRoleCode; label: string } | null;
  /**
   * A megjelenített szerep forrása (hitelességi alapelv): "questionnaire" =
   * kitöltött csapatszerep-kérdőív (MÉRT), "estimate" = a személyiség-
   * profilból számolt becslés. A nézetnek badge-elnie KELL — becsült szerep
   * jelöletlenül mértnek látszana.
   */
  roleSource: "questionnaire" | "estimate" | null;
  /** A saját elsődleges szerep ritka (rá számítanak) vagy megosztott a csapatban. */
  roleFit: "rare" | "shared" | null;
  patternLabel: string | null;
  /** Tanácsadó által írt, aggregált erősségek prózában (pozitív). */
  strengths: string | null;
  /** Tag-szemszögű, építő tippek (max 3). */
  tips: string[];
}

export interface MemberViewerInput {
  displayName: string;
  scores: Record<string, number> | null;
  teamRoleScores: Record<string, number> | null;
  teamRoleSource: "questionnaire" | "estimate" | null;
}

export function buildMemberReportViewModel(
  report: SerializedTeamReport,
  viewer: MemberViewerInput | null,
  loc: Loc,
): MemberReportViewModel {
  const agg = report.aggregates;
  const averages = agg?.dimensionAverages ?? null;
  const spread = agg?.dimensionSpread ?? null;
  const selfScores = viewer?.scores ?? null;

  const dims: MemberDim[] = [];
  if (averages && selfScores) {
    for (const code of DIMS) {
      const teamAvg = averages[code];
      const self = selfScores[code];
      if (typeof teamAvg !== "number" || typeof self !== "number") continue;
      const sp = spread?.[code];
      dims.push({
        code,
        label: MEMBER_DIM_LABELS[code]?.[loc] ?? code,
        self: Math.round(self),
        teamAvg: Math.round(teamAvg),
        teamSpread: typeof sp === "number" ? Math.round(sp) : 0,
        aboveTeam: self - teamAvg >= 6,
      });
    }
  }

  const complementLabels = dims
    .filter((d) => d.aboveTeam)
    .sort((a, b) => b.self - b.teamAvg - (a.self - a.teamAvg))
    .slice(0, 2)
    .map((d) => d.label);

  // A néző saját szerepe (élő) — a kanonikus precedencia-szabályból
  // (team-role-estimate): kitöltött kérdőív > TRITAN-becslés; részleges
  // self-score-ból nincs becslés. A source-t megőrizzük (a nézet badge-eli),
  // az exact (kerekítetlen becslés-összeg) a holtverseny-evidencia — enélkül
  // a hash-fallback más elsődleges szerepet adhatna, mint a többi felület.
  const measuredRoles =
    viewer?.teamRoleSource === "questionnaire" ? viewer.teamRoleScores : null;
  const resolvedRoles = resolveDisplayRoleScores(measuredRoles, selfScores);
  const roleScores: TeamRoleScores | null = resolvedRoles?.scores ?? null;
  const top = roleScores ? getTopRoles(roleScores, 2, resolvedRoles?.exact) : [];
  const primaryRole = top[0]
    ? { code: top[0].role, label: TEAM_ROLES[top[0].role][loc] }
    : null;
  const secondaryRole = top[1]
    ? { code: top[1].role, label: TEAM_ROLES[top[1].role][loc] }
    : null;

  // Szerep-illeszkedés a befagyasztott aggregátumból: a saját elsődleges
  // szerep hány tagnak elsődleges? 1 → ritka (rá számítanak), ≥2 → megosztott.
  // FONTOS: 0 darabszámnál NINCS állítás — a pillanatkép fagyáskor készült,
  // a néző (pl. később csatlakozott vagy azóta kitöltött tag) lehet, hogy
  // nincs is benne; a 0 tehát nem különböztethető meg a „ritka" esettől.
  let roleFit: "rare" | "shared" | null = null;
  if (primaryRole && agg?.roleDistribution) {
    const primaryCount = agg.roleDistribution.counts[primaryRole.code] ?? 0;
    if (primaryCount >= 1) {
      roleFit = primaryCount === 1 ? "rare" : "shared";
    }
  }

  const tips: string[] = [];
  const topDim = [...dims].sort((a, b) => b.self - a.self)[0];
  if (topDim && DIM_MEMBER_TIP[topDim.code]) {
    tips.push(DIM_MEMBER_TIP[topDim.code][loc]);
  }
  if (primaryRole && roleFit === "rare") {
    tips.push(
      loc === "hu"
        ? `A csapatban ${withHuArticle(primaryRole.label)} szerep ritka – rád ebben különösen számítanak, vállald fel tudatosan.`
        : `The ${primaryRole.label} role is rare in this team – they especially rely on you here; own it deliberately.`,
    );
  } else if (primaryRole && roleFit === "shared") {
    tips.push(
      loc === "hu"
        ? `${withHuArticle(primaryRole.label, { capitalize: true })} szerepet többen is viszitek – osszátok meg a tudást és a terhet, támogassátok egymást.`
        : `Several of you carry the ${primaryRole.label} role – share the knowledge and the load, support each other.`,
    );
  }
  tips.push(
    loc === "hu"
      ? "Építs tudatosan az erősségeidre a közös munkában, és vonj be külső nézőpontot a közös vakfoltok ellensúlyozására."
      : "Build deliberately on your strengths in shared work, and bring in an outside perspective to guard against shared blind spots.",
  );

  return {
    memberName: viewer?.displayName ?? "",
    hasSelfComparison: dims.length > 0,
    dims,
    complementLabels,
    primaryRole,
    secondaryRole,
    roleSource: resolvedRoles?.source ?? null,
    roleFit,
    patternLabel: agg?.pattern?.label ?? null,
    strengths: report.strengths,
    tips: tips.slice(0, 3),
  };
}
