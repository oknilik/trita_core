import { prisma } from "@/lib/prisma";
import { getTeamPageData, FRICTION_WEIGHTS } from "@/lib/team-stats";
import { estimateTeamRolesFromTritan } from "@/lib/team-role-estimate";
import { TEAM_ROLES, getTopRoles, type TeamRoleScores } from "@/lib/team-role-scoring";
import {
  MIN_INTELLIGENCE_ASSESSMENTS,
  resolveTeamIntelligenceQuality,
  type TeamIntelligenceEvidenceQuality,
} from "@/lib/team-intelligence";
import {
  generateTeamSummary,
  getStrengthInsight,
  getWeaknessInsight,
  getDiversityInsight,
} from "@/lib/team-insights";
import {
  aggregatePsychSafety,
  weakPsychSafetyItemIds,
  getPsychSafetyItem,
  PSYCH_SAFETY_ACTIONS,
  leaderTrapsForWeakItems,
} from "@/lib/psych-safety";
import { buildTeamPeerRoleProfiles } from "@/lib/team-role-peer.server";
import { compareSelfAndPeerTopRoles, TEAM_ROLE_PEER_MIN_RATERS } from "@/lib/team-role-peer";

// A publikált csapatkép aggregátum-pillanatképe. Publikáláskor fagy be —
// a validált kép nem változhat utólagos kitöltésektől.
// Terv: docs/product/team-report-gating-plan.md

export interface TeamReportAggregates {
  generatedAt: string;
  memberCount: number;
  completedCount: number;
  completionPct: number;
  /** Dimenzió-átlagok (H/E/X/A/C/O, 0-100) — csak MIN_INTELLIGENCE_ASSESSMENTS felett */
  dimensionAverages: Record<string, number> | null;
  /** Dimenziónkénti szórás — a csapat heterogenitása */
  dimensionSpread: Record<string, number> | null;
  pattern: { label: string; confidence: string } | null;
  /** Elsődleges csapatszerep-eloszlás (szerepkód → fő) + lefedettség */
  roleDistribution: {
    counts: Record<string, number>;
    /** 2-3. legerősebb szerepek tagonként (szerepkód → fő) — tartalék-lefedettség */
    secondaryCounts?: Record<string, number>;
    questionnaireCount: number;
    estimateCount: number;
  } | null;
  /** Le nem fedett csapatszerepek (szerepkódok) — csak roleDistribution mellett */
  roleGaps: string[] | null;
  /** Mi mért, mi becsült — a riport adatalapja */
  evidence: {
    quality: TeamIntelligenceEvidenceQuality;
    observerEdgeCount: number;
    estimatedEdgeCount: number;
  } | null;
  /** Kapcsolati dinamika összképe — kizárólag aggregált, egyéni párok nélkül */
  dynamics: {
    alignedCount: number;
    complementaryCount: number;
    frictionCount: number;
    /** A súrlódást leginkább hajtó dimenziók (magas szórás × friction-súly), max 2 */
    topFrictionDims: string[];
    source: "observer" | "profile_estimate" | "mixed";
  } | null;
  /**
   * Pszichológiai biztonság pulse — a legutóbbi kör anonim aggregátuma.
   * Opcionális: régebbi riport-pillanatképekben nem létezik; null, ha nincs
   * mérés vagy a válaszszám az anonimitás-küszöb (3) alatt van.
   */
  psychSafety?: {
    index: number;
    band: "low" | "mid" | "high";
    count: number;
    spread: number;
    /** Itemenkénti normalizált átlag (1–5, magas = biztonságos) */
    itemMeans: Record<string, number>;
    /** A küszöb (3,4) alatti területek, leggyengébbtől — akció-javaslathoz */
    weakItemIds: string[];
    campaignName: string;
    campaignStatus: string;
    measuredAt: string;
  } | null;
  /**
   * Csapattársi szerep-visszajelzés (peer-kör) aggregátuma. Opcionális:
   * régebbi pillanatképekben nem létezik; null, ha nem volt peer-kör.
   * Kizárólag küszöb (3 értékelő) feletti, aggregált adat.
   */
  peerRoles?: {
    /** Tagok, akiknél a csapatkép a küszöb felett összeállt */
    ratedCount: number;
    memberCount: number;
    /** szerepkód → hányszor szerepel a peer-top3-ban (küszöb feletti tagoknál) */
    topRoleCounts: Record<string, number>;
    /** Hány tagnál tér el az önkép és a csapatkép top-3 halmaza (ahol mindkettő él) */
    mismatchCount: number;
    /** Hány tagnál élt mindkét oldal az összevetéshez */
    comparedCount: number;
  } | null;
}

export interface TeamReportActionItem {
  title: string;
  description: string;
  /** Időtáv napokban: 30 / 60 / 90 */
  timeframe: "30" | "60" | "90";
}

export interface SerializedTeamReport {
  id: string;
  teamId: string;
  status: "DRAFT" | "PUBLISHED";
  title: string | null;
  aggregates: TeamReportAggregates | null;
  summary: string | null;
  strengths: string | null;
  risks: string | null;
  recommendations: string | null;
  interviewFindings: string | null;
  leadershipGuide: string | null;
  actionItems: TeamReportActionItem[] | null;
  /** Csak tanácsadói nézetben kerül kitöltésre */
  internalNotes: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const DIMS = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"] as const;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function buildTeamReportAggregates(
  teamId: string,
): Promise<TeamReportAggregates | null> {
  const teamData = await getTeamPageData(teamId, "hu");
  if (!teamData) return null;

  const assessed = teamData.members.filter((m) => m.scores !== null);
  const completedCount = assessed.length;
  const memberCount = teamData.members.length;
  const hasMinimum = completedCount >= MIN_INTELLIGENCE_ASSESSMENTS;

  let dimensionAverages: Record<string, number> | null = null;
  let dimensionSpread: Record<string, number> | null = null;
  if (hasMinimum) {
    dimensionAverages = {};
    dimensionSpread = {};
    for (const dim of DIMS) {
      const values = assessed
        .map((m) => m.scores![dim])
        .filter((v): v is number => typeof v === "number");
      if (values.length === 0) continue;
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance =
        values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
      dimensionAverages[dim] = Math.round(avg);
      dimensionSpread[dim] = round1(Math.sqrt(variance));
    }
  }

  let roleDistribution: TeamReportAggregates["roleDistribution"] = null;
  if (hasMinimum) {
    const counts: Record<string, number> = {};
    const secondaryCounts: Record<string, number> = {};
    let questionnaireCount = 0;
    let estimateCount = 0;
    for (const member of assessed) {
      let scores: TeamRoleScores | null = null;
      if (member.teamRoleSource === "questionnaire" && member.teamRoleScores) {
        scores = member.teamRoleScores as TeamRoleScores;
        questionnaireCount++;
      } else if (member.scores && "INTE" in member.scores && "TEMP" in member.scores) {
        scores = estimateTeamRolesFromTritan(
          member.scores as Record<"INTE" | "RESO" | "TEMP" | "ADAP" | "THOR" | "OPEN", number>,
        );
        estimateCount++;
      }
      if (!scores) continue;
      const top3 = getTopRoles(scores, 3);
      top3.forEach(({ role }, index) => {
        if (!(role in TEAM_ROLES)) return;
        if (index === 0) {
          counts[role] = (counts[role] ?? 0) + 1;
        } else {
          secondaryCounts[role] = (secondaryCounts[role] ?? 0) + 1;
        }
      });
    }
    roleDistribution = { counts, secondaryCounts, questionnaireCount, estimateCount };
  }

  // Valódi hiány: sem elsődleges, sem másodlagos/harmadlagos lefedettség.
  const roleGaps = roleDistribution
    ? Object.keys(TEAM_ROLES).filter(
        (role) =>
          !(role in roleDistribution!.counts) &&
          !(role in (roleDistribution!.secondaryCounts ?? {})),
      )
    : null;

  // Adatalap: mi mért (observer), mi becsült (profil-alapú).
  const observerEdgeCount = teamData.dynamicsEdges.filter(
    (e) => e.source === "observer",
  ).length;
  const estimatedEdgeCount = teamData.dynamicsEdges.length - observerEdgeCount;
  const evidence = {
    quality: resolveTeamIntelligenceQuality(completedCount, memberCount),
    observerEdgeCount,
    estimatedEdgeCount,
  };

  // Dinamika-összkép — csak él-típus darabszámok, egyéni párok nélkül.
  let dynamics: TeamReportAggregates["dynamics"] = null;
  if (hasMinimum && teamData.dynamicsEdges.length > 0) {
    const counts = { aligned: 0, complementary: 0, friction: 0 };
    for (const edge of teamData.dynamicsEdges) {
      if (edge.type in counts) counts[edge.type as keyof typeof counts]++;
    }
    // Súrlódás-hajtó dimenziók: magas szórás × friction-súly (C/A/H dominál).
    const topFrictionDims = dimensionSpread
      ? Object.entries(dimensionSpread)
          .map(([dim, spread]) => ({ dim, score: (FRICTION_WEIGHTS[dim] ?? 0) * spread }))
          .filter((d) => (dimensionSpread![d.dim] ?? 0) >= 12)
          .sort((a, b) => b.score - a.score)
          .slice(0, 2)
          .map((d) => d.dim)
      : [];
    dynamics = {
      alignedCount: counts.aligned,
      complementaryCount: counts.complementary,
      frictionCount: counts.friction,
      topFrictionDims,
      source:
        observerEdgeCount === 0
          ? "profile_estimate"
          : estimatedEdgeCount === 0
            ? "observer"
            : "mixed",
    };
  }

  // Pszichológiai biztonság: a legutóbbi kör anonim aggregátuma.
  // A pillanatképbe fagy — a riport a publikáláskori állapotot őrzi.
  let psychSafety: TeamReportAggregates["psychSafety"] = null;
  const psCampaign = await prisma.campaign.findFirst({
    where: { teamId, type: "PSYCH_SAFETY", status: { in: ["ACTIVE", "CLOSED"] } },
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      status: true,
      closedAt: true,
      createdAt: true,
      psychSafetyResponses: { select: { answers: true } },
    },
  });
  if (psCampaign) {
    const psAgg = aggregatePsychSafety(
      psCampaign.psychSafetyResponses.map((r) => r.answers),
    );
    if (psAgg) {
      psychSafety = {
        index: psAgg.index,
        band: psAgg.band,
        count: psAgg.count,
        spread: psAgg.spread,
        itemMeans: psAgg.itemMeans,
        weakItemIds: weakPsychSafetyItemIds(psAgg.itemMeans),
        campaignName: psCampaign.name,
        campaignStatus: psCampaign.status,
        measuredAt: (psCampaign.closedAt ?? psCampaign.createdAt).toISOString(),
      };
    }
  }

  // Csapattársi szerep-visszajelzés (peer-kör) — aggregált, küszöb feletti kép.
  let peerRoles: TeamReportAggregates["peerRoles"] = null;
  const peerProfiles = await buildTeamPeerRoleProfiles(teamId);
  if (peerProfiles.size > 0) {
    const topRoleCounts: Record<string, number> = {};
    let ratedCount = 0;
    let mismatchCount = 0;
    let comparedCount = 0;
    for (const member of teamData.members) {
      const peer = peerProfiles.get(member.userId);
      if (!peer || peer.raterCount < TEAM_ROLE_PEER_MIN_RATERS || !peer.scores) {
        continue;
      }
      ratedCount += 1;
      for (const r of peer.topRoles) {
        topRoleCounts[r.role] = (topRoleCounts[r.role] ?? 0) + 1;
      }
      if (member.teamRoleScores && member.teamRoleSource === "questionnaire") {
        const selfTop = getTopRoles(member.teamRoleScores as TeamRoleScores, 3);
        comparedCount += 1;
        const diff = compareSelfAndPeerTopRoles(selfTop, peer.topRoles);
        if (diff.peerOnly.length > 0 || diff.selfOnly.length > 0) {
          mismatchCount += 1;
        }
      }
    }
    peerRoles = {
      ratedCount,
      memberCount,
      topRoleCounts,
      mismatchCount,
      comparedCount,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    memberCount,
    completedCount,
    completionPct:
      memberCount > 0 ? Math.round((completedCount / memberCount) * 100) : 0,
    dimensionAverages,
    dimensionSpread,
    pattern:
      hasMinimum && teamData.patternResult
        ? {
            label: teamData.patternResult.fullLabel,
            confidence: String(teamData.patternResult.confidence ?? ""),
          }
        : null,
    roleDistribution,
    roleGaps,
    evidence,
    dynamics,
    psychSafety,
    peerRoles,
  };
}

// ── Vázlat-előtöltés ─────────────────────────────────────────────────────────
// Új vázlat nyitásakor a narratív mezők generált javaslatot kapnak a
// team-insights értelmezési rétegből — a tanácsadó szerkeszti, nem nulláról ír.
// Csak magyarul generálunk (elsődleges piac); a tanácsadó átírhatja.

const PREFILL_DIM_LABELS: Record<string, string> = {
  INTE: "integritás",
  RESO: "rezonancia",
  TEMP: "társas energia",
  ADAP: "alkalmazkodás",
  THOR: "tervezettség",
  OPEN: "nyitottság",
};

export function buildDraftNarrativePrefill(agg: TeamReportAggregates): {
  summary: string;
  strengths: string;
  risks: string;
  recommendations: string;
  leadershipGuide: string;
  actionItems: TeamReportActionItem[];
} | null {
  const avgs = agg.dimensionAverages;
  if (!avgs || Object.keys(avgs).length < 2) return null;

  const sorted = Object.entries(avgs).sort((a, b) => b[1] - a[1]);
  const topDims = sorted.slice(0, 2).map(([dim]) => dim);
  const bottomDim = sorted[sorted.length - 1][0];
  const spreadDims = agg.dimensionSpread
    ? Object.entries(agg.dimensionSpread)
        .filter(([, spread]) => spread >= 12)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([dim]) => dim)
    : [];

  const dynamicsTotal = agg.dynamics
    ? agg.dynamics.alignedCount + agg.dynamics.complementaryCount + agg.dynamics.frictionCount
    : 0;
  const frictionShare = agg.dynamics && dynamicsTotal > 0
    ? agg.dynamics.frictionCount / dynamicsTotal
    : 0;
  const alignedShare = agg.dynamics && dynamicsTotal > 0
    ? agg.dynamics.alignedCount / dynamicsTotal
    : 0;
  const frictionDimLabels = (agg.dynamics?.topFrictionDims ?? [])
    .map((dim) => PREFILL_DIM_LABELS[dim] ?? dim)
    .join(", ");
  const gapRoleNames = (agg.roleGaps ?? [])
    .map((role) => TEAM_ROLES[role as keyof typeof TEAM_ROLES]?.hu ?? role)
    .join(", ");
  const evidenceWeak = agg.evidence ? agg.evidence.quality !== "sufficient" : false;
  const observerMissing = agg.evidence ? agg.evidence.observerEdgeCount === 0 : true;

  // Pszich. biztonság: gyenge területek a narratívához és az akciólistához.
  const ps = agg.psychSafety ?? null;
  const psWeakAreas = ps
    ? ps.weakItemIds
        .map((id) => getPsychSafetyItem(id)?.area.hu)
        .filter((a): a is string => Boolean(a))
    : [];

  const bullets = (lines: string[]) =>
    lines.filter((l) => l.length > 0).map((l) => `• ${l}`).join("\n");

  // Összefoglaló: profil-mondat + dinamika-számok.
  let summary = generateTeamSummary(avgs);
  if (agg.dynamics && dynamicsTotal > 0) {
    summary += ` A ${dynamicsTotal} tagpárból ${agg.dynamics.alignedCount} összehangolt, ${agg.dynamics.complementaryCount} kiegészítő és ${agg.dynamics.frictionCount} mutat súrlódási potenciált.`;
  }

  const strengths = bullets([
    ...topDims.map((dim) => getStrengthInsight(dim)),
    alignedShare >= 0.5
      ? "A hasonló munkastílusok gyors összecsiszolódást és alacsony koordinációs költséget adnak."
      : "",
  ]);

  const risks = bullets([
    getWeaknessInsight(bottomDim),
    ...spreadDims.map((dim) => getDiversityInsight(dim)),
    frictionShare >= 0.4
      ? `A tagpárok jelentős részénél nagy a munkastílus-különbség${frictionDimLabels ? ` (fő terület: ${frictionDimLabels})` : ""} — tisztázott normák nélkül visszatérő feszültségforrás.`
      : "",
    alignedShare >= 0.5
      ? "A homogén profil közös vakfoltokat hordozhat — amit senki nem vesz észre, az kimarad."
      : "",
    gapRoleNames
      ? `Lefedetlen csapatszerep: ${gapRoleNames} — ezekre se elsődleges, se tartalék lefedettség nincs.`
      : "",
    ps && psWeakAreas.length > 0
      ? `A pszichológiai biztonság pulse (${ps.index}/100, ${ps.count} névtelen válasz) gyenge pontjai: ${psWeakAreas.join(", ")} — ezeken a területeken a tagok visszatarthatják a valós véleményüket, ami torzítja a többi mérést is.`
      : "",
    ps && ps.spread >= 20
      ? "A biztonság-élmény erősen megosztott a csapaton belül — az átlag mögött nagyon eltérő egyéni tapasztalatok állnak."
      : "",
  ]);

  const recommendations = bullets([
    frictionShare >= 0.4 || frictionDimLabels
      ? `Közös működési normák rögzítése (döntéshozatal, határidő-kezelés, kommunikáció)${frictionDimLabels ? ` — elsősorban a következő területeken: ${frictionDimLabels}` : ""}.`
      : "",
    gapRoleNames
      ? `A hiányzó szerepek (${gapRoleNames}) tudatos pótlása: felelős kijelölése a csapaton belül vagy külső támogatás bevonása.`
      : "",
    observerMissing
      ? "Kollégai (observer) visszajelzés-kör indítása — a jelenlegi kép részben profil-alapú becslésen áll, a mért adat megerősíti vagy árnyalja."
      : "",
    alignedShare >= 0.5
      ? "Külső visszajelzés tudatos behozása (más csapat, ügyfél, mentor) a közös vakfoltok ellensúlyozására."
      : "",
    ...(ps && psWeakAreas.length > 0
      ? ps.weakItemIds.map(
          (id) =>
            `${getPsychSafetyItem(id)?.area.hu ?? id}: ${PSYCH_SAFETY_ACTIONS[id]?.hu ?? ""}`,
        )
      : []),
    !ps
      ? "Pszichológiai biztonság pulse indítása — névtelen, ~2 perces mérés; enélkül a csapatkép a kimondott véleményekre épül, a visszatartottakra nem."
      : "",
  ]);

  const leadershipGuide = bullets([
    `Építs a csapat erősségére: ${topDims.map((d) => PREFILL_DIM_LABELS[d] ?? d).join(" és ")} — az ehhez illő feladatoknál a csapat magától teljesít.`,
    ...spreadDims.map((dim) => getDiversityInsight(dim)),
    getWeaknessInsight(bottomDim),
    // Vezetői csapda-kártyák: a gyenge pulse-területek mögött tipikus
    // vezetői mintázat + ellenszer (keret: HBR 2026/07, saját adaptáció).
    ...(ps
      ? leaderTrapsForWeakItems(ps.weakItemIds)
          .slice(0, 2)
          .map((trap) => `${trap.title.hu} — ${trap.antidote.hu}`)
      : []),
  ]);

  const actionItems: TeamReportActionItem[] = [
    {
      title: "Csapatkép-átbeszélő workshop",
      description:
        "A riport közös értelmezése a csapattal: erősségek megerősítése, kockázatok nyílt megbeszélése, kérdések tisztázása.",
      timeframe: "30",
    },
    ...(frictionShare >= 0.4 || frictionDimLabels
      ? [
          {
            title: "Működési normák rögzítése",
            description: `Közös minimum-szabályok a legnagyobb eltérésű területekre${frictionDimLabels ? ` (${frictionDimLabels})` : ""}: hogyan döntünk, hogyan kezeljük a határidőket, melyik csatornán kommunikálunk.`,
            timeframe: "30" as const,
          },
        ]
      : []),
    ...(gapRoleNames
      ? [
          {
            title: "Szerep-tisztázás",
            description: `A lefedetlen szerepek (${gapRoleNames}) pótlásának megtervezése: belső felelős kijelölése, folyamat-támasz vagy külső erőforrás.`,
            timeframe: "60" as const,
          },
        ]
      : []),
    ...(evidenceWeak || observerMissing
      ? [
          {
            title: "Kollégai visszajelzés-kör",
            description:
              "Observer-kör indítása a csapatban — a becsült elemek megerősítése mért adattal, a következő riport pontosabb képet ad.",
            timeframe: "60" as const,
          },
        ]
      : []),
    ...(ps && ps.weakItemIds.length > 0
      ? ps.weakItemIds.slice(0, 2).map((id) => ({
          title: `Pszichológiai biztonság: ${getPsychSafetyItem(id)?.area.hu ?? id}`,
          description: PSYCH_SAFETY_ACTIONS[id]?.hu ?? "",
          timeframe: "30" as const,
        }))
      : []),
    {
      title: "Utánkövetés és riport-frissítés",
      description:
        "A bevezetett normák és szerepek működésének áttekintése; új riport készítése a változás mérésére.",
      timeframe: "90",
    },
  ];

  return { summary, strengths, risks, recommendations, leadershipGuide, actionItems };
}

export function parseActionItems(value: unknown): TeamReportActionItem[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.filter(
    (item): item is TeamReportActionItem =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as TeamReportActionItem).title === "string" &&
      typeof (item as TeamReportActionItem).description === "string" &&
      ["30", "60", "90"].includes(String((item as TeamReportActionItem).timeframe)),
  );
  return items.length > 0 ? items : null;
}

type TeamReportRecord = {
  id: string;
  teamId: string;
  status: string;
  title: string | null;
  aggregates: unknown;
  summary: string | null;
  strengths: string | null;
  risks: string | null;
  recommendations: string | null;
  interviewFindings: string | null;
  leadershipGuide: string | null;
  actionItems: unknown;
  internalNotes: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeTeamReport(
  report: TeamReportRecord,
  options: { includeInternalNotes: boolean },
): SerializedTeamReport {
  return {
    id: report.id,
    teamId: report.teamId,
    status: report.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    title: report.title,
    aggregates: (report.aggregates as TeamReportAggregates | null) ?? null,
    summary: report.summary,
    strengths: report.strengths,
    risks: report.risks,
    recommendations: report.recommendations,
    interviewFindings: report.interviewFindings,
    leadershipGuide: report.leadershipGuide,
    actionItems: parseActionItems(report.actionItems),
    internalNotes: options.includeInternalNotes ? report.internalNotes : null,
    publishedAt: report.publishedAt?.toISOString() ?? null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export async function getLatestPublishedReport(
  teamId: string,
): Promise<SerializedTeamReport | null> {
  const report = await prisma.teamReport.findFirst({
    where: { teamId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
  if (!report) return null;
  return serializeTeamReport(report, { includeInternalNotes: false });
}

export async function listTeamReports(
  teamId: string,
): Promise<SerializedTeamReport[]> {
  const reports = await prisma.teamReport.findMany({
    where: { teamId },
    orderBy: { createdAt: "desc" },
  });
  return reports.map((r) => serializeTeamReport(r, { includeInternalNotes: true }));
}
