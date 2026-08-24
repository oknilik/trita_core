import { prisma } from "@/lib/prisma";
import { getTeamPageData, FRICTION_WEIGHTS } from "@/lib/team-stats";
import { computeAlignedHubIds, isMeasuredDynamicsSource } from "@/lib/friction-model";
import { mean, sampleStdDev } from "@/lib/stats/dimension-stats";
import { resolveDisplayRoleScores } from "@/lib/team-role-estimate";
import { TEAM_ROLES, getTopRoles, type TeamRoleScores } from "@/lib/team-role-scoring";
import {
  MIN_INTELLIGENCE_ASSESSMENTS,
  resolveTeamIntelligenceQuality,
  type TeamIntelligenceEvidenceQuality,
} from "@/lib/team-intelligence";
import {
  generateTeamSummary,
  getStrengthInsight,
  getWatchAreaInsight,
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
import { buildTeamTrustNetwork } from "@/lib/trust-network.server";
import { computeTeamPressure } from "@/lib/team-pressure";
import { getCampaignTeamIds } from "@/lib/campaign-steps-core";
import { deficitSlotEligible, strengthSlotEligible } from "@/lib/score-valence";
import {
  parseReportTranslations,
  type ReportTranslations,
} from "@/lib/team-report-i18n";
import {
  buildTeamReportComparisonBasis,
  type TeamReportComparisonBasis,
} from "@/lib/team-report-composition";
import { loadTeamFeedbackCulture } from "@/lib/team-observer.server";
import type { TeamFeedbackCulture } from "@/lib/team-observer";
import {
  parseTeamActionTarget,
  type TeamActionTarget,
} from "@/lib/team-action-target";

// A publikált csapatkép aggregátum-pillanatképe. Publikáláskor fagy be —
// a validált kép nem változhat utólagos kitöltésektől.
// Terv: docs/product/team-report-gating-plan.md

export interface TeamReportAggregates {
  generatedAt: string;
  /** A self-eredmények forrásköre; hiányában tagonként a legfrissebb eredmény. */
  assessmentCampaignId?: string;
  memberCount: number;
  completedCount: number;
  completionPct: number;
  /** Dimenzió-átlagok (H/E/X/A/C/O, 0-100) — csak MIN_INTELLIGENCE_ASSESSMENTS felett */
  dimensionAverages: Record<string, number> | null;
  /** Dimenziónkénti szórás — a csapat heterogenitása */
  dimensionSpread: Record<string, number> | null;
  /**
   * BELSŐ, tanácsadói összehasonlítási alap a stabil mag újraszámításához.
   * Pszeudonim kulcs + hat dimenzió, nyers user ID nélkül. Régi snapshotban
   * hiányzik; nem tanácsadói szerializációból kötelezően redaktáljuk.
   */
  comparisonBasis?: TeamReportComparisonBasis;
  pattern: {
    label: string;
    confidence: string;
    /**
     * Stabilitás-jelzés a mintázat-motorból (opcionális — régebbi
     * pillanatképekben nincs): a küszöb-közeli tengelyeken a mintázat
     * kontextusfüggő, ezt a riportnak jeleznie kell.
     */
    stability?: "stabil" | "közepes" | "instabil";
    stabilityNote?: string;
    /** Küszöb-közeli tengelyek kulcsai (drive/cohesion/discipline/openness). */
    unstableAxes?: string[];
    /** Hány tagnál van >20 pontos tengely-eltérés a csapatmintától — név nélkül. */
    tensionMemberCount?: number;
  } | null;
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
    /**
     * MÉRT kapcsolati élek száma — a mért bizalmi kör (`trust_round`), ill.
     * a régi observer-forrás. Korábban `observerEdgeCount` néven csak az
     * `"observer"` forrást számolta, de a dinamika-élek ma `trust_round` /
     * `profile_estimate` forrásúak, ezért a mért kör adata is 0-nak látszott.
     */
    measuredEdgeCount: number;
    estimatedEdgeCount: number;
  } | null;
  /** Kapcsolati dinamika összképe — kizárólag aggregált, egyéni párok nélkül */
  dynamics: {
    alignedCount: number;
    complementaryCount: number;
    frictionCount: number;
    /** A súrlódást leginkább hajtó dimenziók (magas szórás × friction-súly), max 2 */
    topFrictionDims: string[];
    /** `trust_round` = mért bizalmi kör, `profile_estimate` = becslés, `mixed` = vegyes. */
    source: "trust_round" | "profile_estimate" | "mixed";
  } | null;
  /**
   * Kapcsolati háló kiemelések a tanácsadói debriefhez — ki a csapat
   * összekötője (hub) és ki nincs még beágyazva (beágyazatlan tag).
   * Elsődlegesen MÉRT trust-kör adatból (trust-network hub/isolated logika),
   * mért adat híján profil-alapú becslésből (csak hub). Névvel szerepel, mert
   * a debrief tárgya konkrét tag; a láthatóság a dinamika-térképpel azonos
   * (vezető/tanácsadó). Opcionális: régebbi pillanatképekben nem létezik; null,
   * ha nincs kiemelhető tag. Terv: docs/product/feature-ideas.md #3.
   */
  trustHighlights?: {
    /** A kiemelés adatalapja: mért bizalmi kör vagy profil-alapú becslés. */
    source: "trust_round" | "profile_estimate";
    /** Mért párok száma (0, ha becslésből származik a kiemelés). */
    measuredPairCount: number;
    /** Az összes lehetséges pár (ha ismert a taglista), különben null. */
    possiblePairCount: number | null;
    /** Lefedettség: mért / lehetséges pár, 0–100 — null becslésnél. */
    coveragePct: number | null;
    /** A csapat összekötő(i) — megjelenítendő névvel. */
    hubs: string[];
    /** Beágyazatlan tag(ok) — megjelenítendő névvel; becslésnél mindig üres. */
    isolated: string[];
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
    /** Itemenkénti mintaszórás (1–5); régi snapshotokban nincs. */
    itemSds?: Record<string, number>;
    /** A küszöb (3,4) alatti területek, leggyengébbtől — akció-javaslathoz */
    weakItemIds: string[];
    campaignName: string;
    campaignStatus: string;
    measuredAt: string;
  } | null;
  /**
   * Van a csapatot lefedő pulse-kör, de TÖBB csapatra szól — a
   * PsychSafetyResponse-on nincs csapat-oszlop, így csapat-szintű aggregátum
   * nem képezhető belőle (psychSafety ilyenkor null). A vázlat-előtöltés
   * ebből tudja, hogy NEM javasolhat új pulse-indítást. Opcionális: régebbi
   * pillanatképekben nem létezik.
   */
  psychSafetyMultiTeam?: boolean;
  /**
   * „Csapat nyomás alatt" — dimenzió-pólus koncentrációk (az értékelt tagok
   * ≥ fele ugyanazon a póluson). Opcionális: régebbi pillanatképekben nem
   * létezik; null, ha nincs kiemelhető koncentráció. Egyéni adat nem kerül
   * ki — csak dimenzió, pólus és darabszám. Tartalom: lib/team-pressure.ts.
   */
  pressure?: {
    concentrations: Array<{
      dim: string;
      /** `polarized` = mindkét pólus küszöb feletti — egyetlen összevont találat. */
      pole: "high" | "low" | "polarized";
      count: number;
      assessedCount: number;
    }>;
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
  /**
   * Személyen belüli önkép–külső kép összhang, kizárólag kampány-hatókörű
   * observer-adatból és csapat-szintű anonimitási padló felett.
   */
  feedbackCulture?: TeamFeedbackCulture | null;
}

export interface TeamReportActionItem {
  /** Stabil azonosító az append-only változástörténethez. */
  id?: string;
  title: string;
  description: string;
  /** Időtáv napokban: 30 / 60 / 90 */
  timeframe: "30" | "60" | "90";
  /** A végrehajtás felelőse — szabad szöveg, mert lehet szerep vagy név. */
  owner?: string;
  /** ISO naptári nap (YYYY-MM-DD); időzóna-független követéshez. */
  dueDate?: string;
  status?: "not_started" | "in_progress" | "blocked" | "done";
  /** A következő mérési körben visszamérendő, strukturált célmutató. */
  targetMetric?: TeamActionTarget;
  evidenceUrl?: string;
  note?: string;
}

export interface SerializedTeamReport {
  id: string;
  teamId: string;
  campaignId?: string | null;
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
  /**
   * Jóváhagyott angol fordítás a narratívához (lib/team-report-i18n.ts).
   * A nézetek a localizeTeamReport()-tal oldják fel EN lekérésnél.
   */
  translationsEn: ReportTranslations | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TeamReportPublishBlockReason =
  | "REPORT_CAMPAIGN_REQUIRED"
  | "REPORT_CAMPAIGN_MISMATCH"
  | "REPORT_AGGREGATES_REQUIRED"
  | "REPORT_SELF_DATA_INSUFFICIENT"
  | "REPORT_TRUST_DATA_INSUFFICIENT"
  | "REPORT_PULSE_DATA_INSUFFICIENT"
  | "REPORT_PULSE_MULTI_TEAM_UNSCOPED"
  | "REPORT_NARRATIVE_INCOMPLETE"
  | "REPORT_TARGET_ACTION_REQUIRED";

/**
 * A publikálás fail-closed tartalmi kapuja. A szerkesztő kliensoldali
 * állapota nem biztonsági vagy mérési határ: minden invariáns itt, a
 * szerver által újraépített aggregátumon dől el.
 */
export function validateTeamReportForPublish(input: {
  campaignId: string | null;
  aggregates: TeamReportAggregates | null;
  title: string | null | undefined;
  summary: string | null | undefined;
  recommendations: string | null | undefined;
  actionItems: unknown;
}): TeamReportPublishBlockReason | null {
  if (!input.campaignId) return "REPORT_CAMPAIGN_REQUIRED";
  if (!input.aggregates) return "REPORT_AGGREGATES_REQUIRED";
  if (input.aggregates.assessmentCampaignId !== input.campaignId) {
    return "REPORT_CAMPAIGN_MISMATCH";
  }
  if (
    input.aggregates.completedCount < MIN_INTELLIGENCE_ASSESSMENTS ||
    !input.aggregates.dimensionAverages
  ) {
    return "REPORT_SELF_DATA_INSUFFICIENT";
  }
  if (!input.aggregates.evidence || input.aggregates.evidence.measuredEdgeCount < 1) {
    return "REPORT_TRUST_DATA_INSUFFICIENT";
  }
  if (input.aggregates.psychSafetyMultiTeam) return "REPORT_PULSE_MULTI_TEAM_UNSCOPED";
  if (!input.aggregates.psychSafety) return "REPORT_PULSE_DATA_INSUFFICIENT";

  const hasText = (value: string | null | undefined) => Boolean(value?.trim());
  if (!hasText(input.title) || !hasText(input.summary) || !hasText(input.recommendations)) {
    return "REPORT_NARRATIVE_INCOMPLETE";
  }

  const actions = parseActionItems(input.actionItems);
  if (!actions?.some((item) => item.title.trim() && item.targetMetric)) {
    return "REPORT_TARGET_ACTION_REQUIRED";
  }
  return null;
}

const DIMS = ["H", "E", "X", "A", "C", "O"] as const;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * A súrlódást leginkább hajtó dimenziók: súly·szórás szerint rangsorolva,
 * max 2. A szűrés ugyanerre a mennyiségre megy: w·szórás ≥ 2, ami a korábbi
 * 12-es nyers szórás-küszöb × átlagsúly (1/6) megfelelője.
 */
export function computeTopFrictionDims(
  dimensionSpread: Record<string, number>,
): string[] {
  return Object.entries(dimensionSpread)
    .map(([dim, spread]) => ({ dim, score: (FRICTION_WEIGHTS[dim] ?? 0) * spread }))
    .filter((d) => d.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((d) => d.dim);
}

export async function buildTeamReportAggregates(
  teamId: string,
  options?: { assessmentCampaignId?: string },
): Promise<TeamReportAggregates | null> {
  // Alapértelmezésben megmarad a tagonkénti legfrissebb self-eredmény.
  // Kör-riportnál az explicit campaignId minden kampány-kötött réteget
  // (self, szerep, trust, pulse, observer) ugyanarra a felvételre szűr.
  const teamData = await getTeamPageData(teamId, "hu", options);
  if (!teamData) return null;

  const assessed = teamData.members.filter((m) => m.scores !== null);
  const feedbackCulturePromise = loadTeamFeedbackCulture({
    orgId: teamData.orgId,
    members: teamData.members.map((member) => ({
      userId: member.userId,
      scores: member.scores,
    })),
    campaignId: options?.assessmentCampaignId,
  });
  const comparisonBasis = buildTeamReportComparisonBasis(teamId, assessed);
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
      // Bessel-korrekciós mintaszórás a közös stats-helperből (a csapat a
      // populáció mintája — a ÷n populációs szórás lefelé torzított).
      dimensionAverages[dim] = Math.round(mean(values));
      dimensionSpread[dim] = round1(sampleStdDev(values));
    }
  }

  let roleDistribution: TeamReportAggregates["roleDistribution"] = null;
  if (hasMinimum) {
    const counts: Record<string, number> = {};
    const secondaryCounts: Record<string, number> = {};
    let questionnaireCount = 0;
    let estimateCount = 0;
    // MINDEN tagon iterálunk, nem csak a személyiség-teszttel rendelkezőkön:
    // a MÉRT szerep-kérdőívhez nem kell tritan (korábban a teszt nélküli tag
    // mért szerepe kiesett → a roleGaps lefedett szerepet is hiányzónak írt).
    // A becslés-ág változatlanul csak teljes score-készletből fut.
    for (const member of teamData.members) {
      // Precedencia a kanonikus szabályból (team-role-estimate):
      // kitöltött kérdőív > TRITAN-becslés; részleges score-ból nincs becslés.
      const resolved = resolveDisplayRoleScores(
        member.teamRoleSource === "questionnaire" ? member.teamRoleScores : null,
        member.scores,
      );
      if (!resolved) continue;
      if (resolved.source === "questionnaire") questionnaireCount++;
      else estimateCount++;
      // S2: becslés-ágon az exact (kerekítetlen összeg) a holtverseny-
      // evidencia — enélkül a hash-fallback más elsődleges szerepet adhatna,
      // mint a többi felület.
      const top3 = getTopRoles(resolved.scores, 3, resolved.exact);
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

  // Adatalap: mi MÉRT, mi becsült. Mért = mért bizalmi kör (`trust_round`)
  // vagy a régi observer-forrás; becsült = profil-alapú (`profile_estimate`).
  const measuredEdgeCount = teamData.dynamicsEdges.filter((e) =>
    isMeasuredDynamicsSource(e.source),
  ).length;
  const estimatedEdgeCount = teamData.dynamicsEdges.length - measuredEdgeCount;
  const evidence = {
    quality: resolveTeamIntelligenceQuality(completedCount, memberCount),
    measuredEdgeCount,
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
      ? computeTopFrictionDims(dimensionSpread)
      : [];
    dynamics = {
      alignedCount: counts.aligned,
      complementaryCount: counts.complementary,
      frictionCount: counts.friction,
      topFrictionDims,
      source:
        measuredEdgeCount === 0
          ? "profile_estimate"
          : estimatedEdgeCount === 0
            ? "trust_round"
            : "mixed",
    };
  }

  // Kapcsolati háló kiemelések — ki a hub, ki a beágyazatlan tag.
  // Elsődlegesen MÉRT trust-kör alapján (a trust-network már számol
  // hub/isolated-et a küszöb-szabályokkal); mért adat híján profil-alapú
  // becslés hub (aligned-fok ≥ 3), beágyazatlan-tag nélkül — az csak mért
  // adatból értelmezhető megbízhatóan. A láthatóság a dinamika-térképpel
  // azonos: a debrifen névvel kell. Terv: feature-ideas.md #3.
  let trustHighlights: TeamReportAggregates["trustHighlights"] = null;
  {
    const nameByUserId = new Map(
      teamData.members.map((m) => [m.userId, m.displayName]),
    );
    const namesFor = (ids: string[]): string[] =>
      ids
        .map((id) => nameByUserId.get(id))
        .filter((n): n is string => Boolean(n));

    const trust = await buildTeamTrustNetwork(teamId, {
      campaignId: options?.assessmentCampaignId,
    }).catch(() => null);
    if (trust && trust.measuredPairCount > 0) {
      const hubs = namesFor(trust.hubUserIds);
      const isolated = namesFor(trust.isolatedUserIds);
      // A hálózati lefedettség hub/beágyazatlan találat nélkül is mérés.
      // A régi feltétel ilyenkor eldobta a mért párszámot a snapshotból.
      trustHighlights = {
        source: "trust_round",
        measuredPairCount: trust.measuredPairCount,
        possiblePairCount: trust.possiblePairCount,
        coveragePct:
          trust.coverage !== null ? Math.round(trust.coverage * 100) : null,
        hubs,
        isolated,
      };
    } else if (hasMinimum && teamData.dynamicsEdges.length > 0) {
      // Profil-alapú becslés fallback: a dinamika-térképpel KÖZÖS hub-
      // definíció (computeAlignedHubIds, aligned-fok ≥ 3, mindkét végpont
      // számít). Beágyazatlan-tag itt nincs.
      const hubs = namesFor(
        computeAlignedHubIds(
          teamData.dynamicsEdges.map((e) => ({
            from: e.fromUserId,
            to: e.toUserId,
            type: e.type,
          })),
        ),
      );
      if (hubs.length > 0) {
        trustHighlights = {
          source: "profile_estimate",
          measuredPairCount: 0,
          possiblePairCount: trust?.possiblePairCount ?? null,
          coveragePct: null,
          hubs,
          isolated: [],
        };
      }
    }
  }

  // Pszichológiai biztonság: a legutóbbi kör anonim aggregátuma.
  // A pillanatképbe fagy — a riport a publikáláskori állapotot őrzi.
  //
  // Csapat-célzás a kanonikus szabállyal (getCampaignTeamIds): a teamIds az
  // igazság, üresnél a legacy teamId. A korábbi, csak-teamId szűrő két hibát
  // hordozott: (1) a csak teamIds-ben célzott csapat SEMMIT nem talált;
  // (2) több-csapatos kampánynál MÁS csapatok válaszai is beleszámoltak.
  // Az új response.teamId izolál; régi, nem feloldható adatra fail-closed.
  let psychSafety: TeamReportAggregates["psychSafety"] = null;
  let psychSafetyMultiTeam = false;
  const psCandidates = await prisma.campaign.findMany({
    // Több-lépéses kampánynál a type az ELSŐ lépés (pl. OBSERVER_360) —
    // a pulse-t a steps-ben kell keresni, a legacy type-ot fallbackként.
    where: {
      ...(options?.assessmentCampaignId
        ? { id: options.assessmentCampaignId }
        : {}),
      status: { in: ["ACTIVE", "CLOSED"] },
      AND: [
        { OR: [{ teamId }, { teamIds: { has: teamId } }] },
        { OR: [{ steps: { has: "PSYCH_SAFETY" } }, { type: "PSYCH_SAFETY" }] },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      status: true,
      closedAt: true,
      createdAt: true,
      teamId: true,
      teamIds: true,
      psychSafetyResponses: { select: { teamId: true, answers: true, submittedOn: true } },
    },
  });
  const psCovering = psCandidates.filter((c) =>
    getCampaignTeamIds(c).includes(teamId),
  );
  // A LEZÁRT kör a stabil mérés: előnyt kap egy újabb, félúton lévő aktív
  // körrel szemben (az félkész, torzított képet fagyasztana a riportba).
  const psLatestClosed = [...psCovering]
    .filter((c) => c.status === "CLOSED")
    .sort(
      (a, b) =>
        (b.closedAt ?? b.createdAt).getTime() -
        (a.closedAt ?? a.createdAt).getTime(),
    )[0];
  const psCampaign =
    psLatestClosed ?? psCovering.find((c) => c.status === "ACTIVE") ?? null;
  if (psCampaign) {
    const campaignTeamIds = getCampaignTeamIds(psCampaign);
    const scopedResponses = psCampaign.psychSafetyResponses.filter((response) =>
      campaignTeamIds.length === 1
        ? response.teamId === null || response.teamId === teamId
        : response.teamId === teamId,
    );
    psychSafetyMultiTeam =
      campaignTeamIds.length > 1 &&
      psCampaign.psychSafetyResponses.length > 0 &&
      scopedResponses.length === 0;
    const psAgg = aggregatePsychSafety(
      scopedResponses.map((r) => r.answers),
    );
    if (psAgg) {
      // measuredAt: lezárt körnél a zárás napja; AKTÍV körnél a legutóbbi
      // beérkezett válasz napja — a kampány createdAt a kör indítása, nem a
      // mérés ideje lenne.
      const latestResponseAt = scopedResponses.reduce<Date | null>(
        (acc, r) => (!acc || r.submittedOn > acc ? r.submittedOn : acc),
        null,
      );
      const measuredAt =
        psCampaign.status === "CLOSED"
          ? (psCampaign.closedAt ?? psCampaign.createdAt)
          : (latestResponseAt ?? psCampaign.createdAt);
      psychSafety = {
        index: psAgg.index,
        band: psAgg.band,
        count: psAgg.count,
        spread: psAgg.spread,
        itemMeans: psAgg.itemMeans,
        itemSds: psAgg.itemSds,
        weakItemIds: weakPsychSafetyItemIds(psAgg.itemMeans),
        campaignName: psCampaign.name,
        campaignStatus: psCampaign.status,
        measuredAt: measuredAt.toISOString(),
      };
    }
  }

  // „Csapat nyomás alatt" — pólus-koncentrációk az értékelt tagokból.
  // Csak dimenzió + pólus + darabszám kerül ki, egyéni adat soha.
  const pressureConcentrations = hasMinimum
    ? computeTeamPressure(assessed.map((m) => ({ scores: m.scores })))
    : [];
  const pressure =
    pressureConcentrations.length > 0
      ? { concentrations: pressureConcentrations }
      : null;

  // Csapattársi szerep-visszajelzés (peer-kör) — aggregált, küszöb feletti kép.
  let peerRoles: TeamReportAggregates["peerRoles"] = null;
  const peerProfiles = await buildTeamPeerRoleProfiles(teamId, {
    campaignId: options?.assessmentCampaignId,
  });
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
  const feedbackCulture = await feedbackCulturePromise;

  return {
    generatedAt: new Date().toISOString(),
    ...(options?.assessmentCampaignId
      ? { assessmentCampaignId: options.assessmentCampaignId }
      : {}),
    memberCount,
    completedCount,
    completionPct:
      memberCount > 0 ? Math.round((completedCount / memberCount) * 100) : 0,
    dimensionAverages,
    dimensionSpread,
    comparisonBasis,
    pattern:
      hasMinimum && teamData.patternResult
        ? {
            label: teamData.patternResult.fullLabel,
            confidence: String(teamData.patternResult.confidence ?? ""),
            stability: teamData.patternResult.stability,
            stabilityNote: teamData.patternResult.stabilityNote,
            unstableAxes: teamData.patternResult.unstableAxes ?? [],
            tensionMemberCount: (teamData.patternResult.styleDistances ?? []).filter(
              (d) => d.tensionAxes.length > 0,
            ).length,
          }
        : null,
    roleDistribution,
    roleGaps,
    evidence,
    dynamics,
    trustHighlights,
    psychSafety,
    psychSafetyMultiTeam,
    pressure,
    peerRoles,
    feedbackCulture,
  };
}

// ── Vázlat-előtöltés ─────────────────────────────────────────────────────────
// Új vázlat nyitásakor a narratív mezők generált javaslatot kapnak a
// team-insights értelmezési rétegből — a tanácsadó szerkeszti, nem nulláról ír.
// Csak magyarul generálunk (elsődleges piac); a tanácsadó átírhatja.

const PREFILL_DIM_LABELS: Record<string, string> = {
  H: "becsületesség-alázat",
  E: "emocionalitás",
  X: "extraverzió",
  A: "barátságosság",
  C: "lelkiismeretesség",
  O: "nyitottság",
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
  // Valencia-kapu a kanonikus modulból (score-valence): a fordított kódolású
  // E ezen az ÉRTÉKELŐ felületen sem erősség- (topDims), sem deficit-
  // (bottomDim) slotba nem kerülhet — különben egy érzelmileg STABIL csapat
  // legalacsonyabb dimenziója (E) tévesen „kockázatként" jelenne meg.
  // E a semleges profil-mondatban (generateTeamSummary) marad,
  // valencia-mentes szint-szóval.
  const strengthEligible = sorted.filter(([dim]) =>
    strengthSlotEligible(dim, "evaluative"),
  );
  const deficitEligible = sorted.filter(([dim]) => deficitSlotEligible(dim));
  const topDims = strengthEligible.slice(0, 2).map(([dim]) => dim);
  const bottomDim = deficitEligible[deficitEligible.length - 1][0];
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
  // A „hasonló profil / homogén / közös vakfolt" értelmezés CSAK TISZTÁN
  // profil-becslés eredetű aligned élekre igaz. A mért bizalmi körből
  // (trust_round) származó aligned él MAGAS BIZALMAT jelent, nem profil-
  // hasonlóságot — abból homogenitást állítani hamis lenne. VEGYES (mixed)
  // forrásnál sem tudható, hogy az aligned többség melyik feléből jön,
  // ezért homogenitást ott SEM állítunk. A source mező különíti el.
  const alignedReflectsSimilarity = agg.dynamics
    ? agg.dynamics.source === "profile_estimate"
    : false;
  const profileHomogeneitySignal = alignedReflectsSimilarity && alignedShare >= 0.5;
  const highTrustSignal =
    agg.dynamics?.source === "trust_round" && alignedShare >= 0.5;
  const frictionDimLabels = (agg.dynamics?.topFrictionDims ?? [])
    .map((dim) => PREFILL_DIM_LABELS[dim] ?? dim)
    .join(", ");
  const gapRoleNames = (agg.roleGaps ?? [])
    .map((role) => TEAM_ROLES[role as keyof typeof TEAM_ROLES]?.hu ?? role)
    .join(", ");
  const evidenceWeak = agg.evidence ? agg.evidence.quality !== "sufficient" : false;
  const measuredMissing = agg.evidence ? agg.evidence.measuredEdgeCount === 0 : true;

  // Pszich. biztonság: gyenge területek a narratívához és az akciólistához.
  const ps = agg.psychSafety ?? null;
  const psWeakAreas = ps
    ? ps.weakItemIds
        .map((id) => getPsychSafetyItem(id)?.area.hu)
        .filter((a): a is string => Boolean(a))
    : [];
  const singleRoleGapTarget =
    agg.roleGaps?.length === 1
      ? parseTeamActionTarget({ kind: "role_gap", roleCode: agg.roleGaps[0] })
      : undefined;

  const bullets = (lines: string[]) =>
    lines.filter((l) => l.length > 0).map((l) => `• ${l}`).join("\n");

  // Összefoglaló: profil-mondat + dinamika-számok. A darabszám ÉL-szám
  // (felmért kapcsolat), nem az összes tagpár — profil-él csak felmért tagok
  // közt épül, a kapcsolat nélküli (disconnected) mért pár pedig kimarad.
  let summary = generateTeamSummary(avgs);
  if (agg.dynamics && dynamicsTotal > 0) {
    summary += ` A ${dynamicsTotal} felmért kapcsolatból ${agg.dynamics.alignedCount} összehangolt, ${agg.dynamics.complementaryCount} egymást kiegészítő, ${agg.dynamics.frictionCount} esetében pedig súrlódás alakulhat ki.`;
  }

  const strengths = bullets([
    ...topDims.map((dim) => getStrengthInsight(dim)),
    profileHomogeneitySignal
      ? "A hasonló munkastílusok gyors összecsiszolódást tehetnek lehetővé, és kevesebb egyeztetést igényelhetnek."
      : "",
    highTrustSignal
      ? "A mért bizalmi kör alapján sok az erős, kölcsönös bizalmi kapcsolat — ezek biztos alapot adhatnak az együttműködéshez."
      : "",
  ]);

  const risks = bullets([
    getWatchAreaInsight(bottomDim),
    ...spreadDims.map((dim) => getDiversityInsight(dim)),
    frictionShare >= 0.4
      ? `A felmért kapcsolatok jelentős részénél nagy a munkastílusbeli különbség${frictionDimLabels ? ` (fő terület: ${frictionDimLabels})` : ""} — tisztázott normák nélkül ez visszatérő feszültség forrásává válhat.`
      : "",
    profileHomogeneitySignal
      ? "A hasonló profilok közös vakfoltokat hordozhatnak — egy külső nézőpont segíthet észrevenni azt, ami a csapaton belül rejtve marad."
      : "",
    gapRoleNames
      ? `Lefedetlen csapatszerepek: ${gapRoleNames} — ezeket senki sem viszi elsődlegesen, és kijelölt helyettes sincs.`
      : "",
    ps && psWeakAreas.length > 0
      ? `A pszichológiai biztonsági pulzusmérés (${ps.index}/100, ${ps.count} névtelen válasz) leggyengébb területei: ${psWeakAreas.join(", ")} — ezeken a területeken a tagok nem feltétlenül mondják ki őszintén a véleményüket, ami a többi mérés eredményét is torzíthatja.`
      : "",
    ps && ps.spread >= 20
      ? "A pszichológiai biztonság megélése erősen eltér a csapaton belül — az átlag mögött nagyon különböző egyéni tapasztalatok állnak."
      : "",
    agg.pressure && agg.pressure.concentrations.length > 0
      ? `Nyomás alatti kollektív minta: ${agg.pressure.concentrations
          .map(
            (c) =>
              `${PREFILL_DIM_LABELS[c.dim] ?? c.dim} (${
                c.pole === "polarized"
                  ? "két ellentétes pólus"
                  : c.pole === "high"
                    ? "magas pólus"
                    : "alacsony pólus"
              }, ${c.count}/${c.assessedCount} tag)`,
          )
          .join(", ")} — az egyéni túlterhelődések nyomás alatt összeadódhatnak (részletek a „Csapat nyomás alatt" fejezetben).`
      : "",
  ]);

  const recommendations = bullets([
    frictionShare >= 0.4 || frictionDimLabels
      ? `Közös működési normák rögzítése (döntéshozatal, a határidők kezelése, kommunikáció)${frictionDimLabels ? ` — elsősorban a következő területeken: ${frictionDimLabels}` : ""}.`
      : "",
    gapRoleNames
      ? `A hiányzó szerepek (${gapRoleNames}) tudatos pótlása: felelős kijelölése a csapaton belül vagy külső támogatás bevonása.`
      : "",
    measuredMissing
      ? "Mért bizalmi kör (360°) indítása — a jelenlegi kapcsolati kép a profilokból számolt becslés, amelyet az új mérés megerősíthet vagy árnyalhat."
      : "",
    profileHomogeneitySignal
      ? "Külső visszajelzés tudatos bevonása — például másik csapattól, ügyféltől vagy mentortól — a közös vakfoltok ellensúlyozására."
      : "",
    ...(ps && psWeakAreas.length > 0
      ? ps.weakItemIds.map(
          (id) =>
            `${getPsychSafetyItem(id)?.area.hu ?? id}: ${PSYCH_SAFETY_ACTIONS[id]?.hu ?? ""}`,
        )
      : []),
    // Több-csapatos futó pulse mellett NEM javaslunk új pulse-indítást —
    // a mérés fut, csak csapat-szintre nem bontható (psychSafetyMultiTeam).
    !ps && !agg.psychSafetyMultiTeam
      ? "Pszichológiai biztonsági pulzusmérés indítása — névtelen, körülbelül kétperces mérés; enélkül a csapatkép csak a kimondott véleményekre épül, a visszatartott véleményekre viszont nem."
      : "",
  ]);

  const leadershipGuide = bullets([
    `Építs a csapat erősségére: ${topDims.map((d) => PREFILL_DIM_LABELS[d] ?? d).join(" és ")} — az ehhez illő feladatoknál jellemzően kevesebb vezetői ráhatás is elég.`,
    ...spreadDims.map((dim) => getDiversityInsight(dim)),
    getWatchAreaInsight(bottomDim),
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
      title: "A csapatkép közös átbeszélése",
      description:
        "A riport közös értelmezése a csapattal: az erősségek megerősítése, a kockázatok nyílt megbeszélése és a kérdések tisztázása.",
      timeframe: "30",
    },
    ...(frictionShare >= 0.4 || frictionDimLabels
      ? [
          {
            title: "Működési normák rögzítése",
            description: `Rögzítsetek néhány közös szabályt a legnagyobb eltérést mutató területeken${frictionDimLabels ? ` (${frictionDimLabels})` : ""}: hogyan döntötök, hogyan kezelitek a határidőket, és melyik csatornán kommunikáltok.`,
            timeframe: "30" as const,
          },
        ]
      : []),
    ...(gapRoleNames
      ? [
          {
            title: "Szerepek tisztázása",
            description: `Tervezzétek meg, hogyan feditek le a hiányzó szerepeket (${gapRoleNames}): jelöljetek ki belső felelőst, alakítsátok át a folyamatokat, vagy vonjatok be külső támogatást.`,
            timeframe: "60" as const,
            ...(singleRoleGapTarget
              ? { targetMetric: singleRoleGapTarget }
              : {}),
          },
        ]
      : []),
    ...(evidenceWeak || measuredMissing
      ? [
          {
            title: "Mért bizalmi kör",
            description:
              "Bizalmi kör (360°) indítása a csapatban — a becsült kapcsolati elemek ellenőrzése mért adatokkal, hogy a következő riport pontosabb képet adhasson.",
            timeframe: "60" as const,
            targetMetric: { kind: "trust_coverage" as const },
          },
        ]
      : []),
    ...(ps && ps.weakItemIds.length > 0
      ? ps.weakItemIds.slice(0, 2).map((id) => {
          const targetMetric = parseTeamActionTarget({
            kind: "psych_safety_item",
            itemId: id,
          });
          return {
            title: `Pszichológiai biztonság: ${getPsychSafetyItem(id)?.area.hu ?? id}`,
            description: PSYCH_SAFETY_ACTIONS[id]?.hu ?? "",
            timeframe: "30" as const,
            ...(targetMetric ? { targetMetric } : {}),
          };
        })
      : []),
    {
      title: "Utánkövetés és a riport frissítése",
      description:
        "A bevezetett normák és szerepek működésének áttekintése; új riport készítése a változás mérésére.",
      timeframe: "90",
    },
  ];

  return { summary, strengths, risks, recommendations, leadershipGuide, actionItems };
}

export function parseActionItems(value: unknown): TeamReportActionItem[] | null {
  if (!Array.isArray(value)) return null;
  const statuses = ["not_started", "in_progress", "blocked", "done"] as const;
  const items = value.flatMap((raw): TeamReportActionItem[] => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const item = raw as Record<string, unknown>;
    if (
      typeof item.title !== "string" ||
      typeof item.description !== "string" ||
      !["30", "60", "90"].includes(String(item.timeframe))
    ) return [];
    const status = statuses.includes(item.status as (typeof statuses)[number])
      ? item.status as TeamReportActionItem["status"]
      : undefined;
    const dueDate =
      typeof item.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(item.dueDate)
        ? item.dueDate
        : undefined;
    const targetMetric = parseTeamActionTarget(item.targetMetric);
    return [{
      ...(typeof item.id === "string" && item.id.trim() ? { id: item.id.trim() } : {}),
      title: item.title,
      description: item.description,
      timeframe: item.timeframe as TeamReportActionItem["timeframe"],
      ...(typeof item.owner === "string" && item.owner.trim()
        ? { owner: item.owner.trim() }
        : {}),
      ...(dueDate ? { dueDate } : {}),
      ...(status ? { status } : {}),
      ...(targetMetric ? { targetMetric } : {}),
      ...(typeof item.evidenceUrl === "string" && item.evidenceUrl.trim()
        ? { evidenceUrl: item.evidenceUrl.trim() }
        : {}),
      ...(typeof item.note === "string" && item.note.trim() ? { note: item.note.trim() } : {}),
    }];
  });
  return items.length > 0 ? items : null;
}

type TeamReportRecord = {
  id: string;
  teamId: string;
  campaignId?: string | null;
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
  /** Opcionális: a Prisma-kliens a migráció + generate után adja vissza. */
  translationsEn?: unknown;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeTeamReport(
  report: TeamReportRecord,
  options: { includeInternalNotes: boolean },
): SerializedTeamReport {
  const rawAggregates = (report.aggregates as TeamReportAggregates | null) ?? null;
  // A stabil-mag alap per-tag, bár pszeudonimizált score-okat tartalmaz.
  // Szervezeti vezető/tag számára nincs rá szükség, ezért ugyanazon a
  // tanácsadói kapun redaktáljuk, mint az internalNotes mezőt.
  let aggregates = rawAggregates;
  if (rawAggregates && !options.includeInternalNotes) {
    aggregates = { ...rawAggregates };
    delete aggregates.comparisonBasis;
  }

  return {
    id: report.id,
    teamId: report.teamId,
    campaignId: report.campaignId ?? null,
    status: report.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    title: report.title,
    aggregates,
    summary: report.summary,
    strengths: report.strengths,
    risks: report.risks,
    recommendations: report.recommendations,
    interviewFindings: report.interviewFindings,
    leadershipGuide: report.leadershipGuide,
    actionItems: parseActionItems(report.actionItems),
    internalNotes: options.includeInternalNotes ? report.internalNotes : null,
    translationsEn: parseReportTranslations(
      (report as { translationsEn?: unknown }).translationsEn,
    ),
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
