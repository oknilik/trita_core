import type { SerializedTeamReport } from "../../src/lib/team-report";
import { calculateOperatingStyle } from "../../src/lib/team-operating-style/scoring";
import { AXES, ITEMS, OPERATING_STYLE_VERSION } from "../../src/lib/team-operating-style/questions";
import { snapshotComposition, compareTeamPatterns } from "../../src/lib/team-operating-style/comparison";
import { mean, sampleStdDev } from "../../src/lib/stats/dimension-stats";
import { aggregatePsychSafety, PSYCH_SAFETY_ITEMS, weakPsychSafetyItemIds } from "../../src/lib/psych-safety";
import { calculateTeamPattern } from "../../src/lib/team-pattern";

/** Synthetic QA data only; never stored as a team's measurement. */
export function makeReaderReport(mismatchedCohorts = false): SerializedTeamReport {
  const ids = ["a", "b", "c", "d", "e"];
  const operating = { ...calculateOperatingStyle({ teamId: "team_reader", roundId: "round_reader", instrumentVersion: OPERATING_STYLE_VERSION,
    eligibleRespondentIds: ids,
    responses: ids.map((respondentId) => ({ respondentId, answers: Object.fromEntries(ITEMS.map((q) => [q.id,
      mismatchedCohorts ? q.axis === "execution" && respondentId === "e" ? null : 3 : q.pole === "left" ? 5 : 1,
    ])) })),
  }), referenceStart: "2026-08-19", referenceEnd: "2026-09-16" };
  const composition = snapshotComposition(calculateTeamPattern(ids.map((userId) => ({ userId, scores: { H: 62, A: 62, X: 56.4, C: 66.4, O: 68, E: 50 } }))));
  if (mismatchedCohorts) {
    // Screenshot-shaped aggregate values for layout QA; cohort gates come from scoring above.
    const means = [49.2, 48.8, 55, 52.1];
    const sds = [9, 10.8, 16, 16.1];
    AXES.forEach((axis, index) => { operating.axes[axis].mean = means[index]; operating.axes[axis].sd = sds[index]; });
    if (composition) [15.2, 11.4, 17.3, 15.4].forEach((sd, index) => { composition.axes[(["drive", "cohesion", "discipline", "openness"] as const)[index]].sd = sd; });
  }
  return {
    id: "report_reader", teamId: "team_reader", status: "PUBLISHED", title: "Termékfejlesztés · bemutatóadat",
    publishedAt: "2026-09-17T08:00:00Z", createdAt: "2026-09-17T08:00:00Z", updatedAt: "2026-09-17T08:00:00Z",
    summary: null, strengths: null, risks: null, recommendations: null, interviewFindings: null,
    leadershipGuide: null, internalNotes: "Private consultant note", translationsEn: null, actionItems: null,
    aggregates: {
      generatedAt: "2026-09-17T08:00:00Z", memberCount: 5, completedCount: 5, completionPct: 100,
      teamStyle: { version: 1, operating, composition, sameRespondents: true, comparison: compareTeamPatterns(operating, composition) },
      dimensionAverages: null, dimensionSpread: null, roleDistribution: null, roleGaps: null,
      evidence: null, dynamics: null, pattern: null,
    },
  };
}

/** Full, synthetic editorial sample; no customer data or recorded interview claims. */
export function makeEditorialTeamReport(): SerializedTeamReport {
  const report = makeReaderReport();
  const scores = [
    { H: 50, E: 30, X: 50, A: 42, C: 58, O: 58 },
    { H: 56, E: 40, X: 54, A: 52, C: 62, O: 63 },
    { H: 62, E: 50, X: 56, A: 62, C: 66, O: 68 },
    { H: 68, E: 60, X: 60, A: 72, C: 70, O: 73 },
    { H: 74, E: 70, X: 62, A: 82, C: 76, O: 78 },
  ];
  const composition = snapshotComposition(calculateTeamPattern(scores.map((value, index) => ({ userId: ["a", "b", "c", "d", "e"][index], scores: value }))));
  const dimensions = ["H", "E", "X", "A", "C", "O"] as const;
  const normalizedSafetyAnswers = [
    [4, 2, 4, 4, 4, 4, 4, 4],
    [4, 3, 4, 4, 4, 4, 4, 4],
    [4, 3, 5, 4, 4, 4, 4, 4],
    [4, 3, 4, 4, 3, 4, 4, 4],
    [5, 4, 4, 4, 4, 4, 4, 4],
  ];
  const psychSafety = aggregatePsychSafety(normalizedSafetyAnswers.map((answers) => Object.fromEntries(
    PSYCH_SAFETY_ITEMS.map((item, index) => [item.id, item.reversed ? 6 - answers[index] : answers[index]]),
  )))!;
  const operating = report.aggregates!.teamStyle!.operating;
  return {
    ...report,
    id: "report_editorial_hu",
    title: "Termékfejlesztés · őszi csapatriport",
    summary: "Az önértékelésekben a nyitottság és a lelkiismeretesség emelkedik ki. Ez jó alap lehet ahhoz, hogy új megoldásokat próbáljatok ki, majd végig is vigyétek őket. A működési kérdőívben mind az öten előre egyeztetett feladatokról, vezetői döntésekről és tervszerű munkáról számoltatok be.\nMost azt érdemes megnézni, mi történik, amikor valami eltér a tervtől. A pszichológiai biztonság felmérésében a hibázás kezelése kapta a legalacsonyabb átlagot. A következő hónapban ezért a hibák közös megbeszélésével kezdjetek: mi történt, mit tanultatok belőle, és min változtattok?",
    strengths: "• Az önértékelések alapján szívesen foglalkozhattok új ötletekkel. Egy kisebb, jól körülhatárolt kísérlethez ez hasznos kiindulópont.\n• A működési kérdőív válaszai szerint előre tisztázzátok a felelősségeket és a munka lépéseit. Erre a gyakorlatra az új megoldások kipróbálásakor is támaszkodhattok.",
    risks: "• A hibázás kezeléséről adott válaszok további beszélgetést indokolnak. A pontszám önmagában nem mondja meg, mi nehezíti a hibák megbeszélését; ehhez konkrét helyzeteket kell megismerni.\n• A megmért bizalmi kapcsolatok között egy tag esetében nem látszik erős kapcsolat. Beszéljétek át, milyen közös feladatok segíthetnék a kapcsolódását. A mérésből az okokra és a teljesítményére nem lehet következtetni.\n• Az eredményekben a Megvalósító szerep senkinél sem jelenik meg elsődlegesként. Másodlagos szerepként sem jelenik meg senkinél. Ez nem azt jelenti, hogy a csapat nem tud végrehajtani egy tervet. Azt érdemes tisztázni, ki bontja le a közös ötleteket követhető lépésekre.",
    recommendations: "A következő 30 napban kéthetente szánjatok 30 percet egy elakadt vagy hibásan megoldott feladat átbeszélésére. A vezető kezdjen a saját példájával, majd válasszatok egyetlen változtatást, amelyet a következő alkalomig kipróbáltok.\nEmellett tervezzetek közös munkát annak a tagnak a bevonásával, akinél a bizalmi mérés nem jelzett erős kapcsolatot. Vele egyeztetve válasszatok munkatársat és konkrét feladatot. Két hónap múlva beszéljétek át a tapasztalataitokat, és ismételjétek meg a bizalmi kört.",
    interviewFindings: null,
    leadershipGuide: "Vezetőként kezdd egy olyan esettel, amikor te döntöttél rosszul vagy későn kértél segítséget. Mondd el, mit csinálnál ma másképp, majd kérdezd meg, mi segített volna a csapatnak abban a helyzetben.\nHagyj időt a válaszokra. Ha valaki problémát jelez, előbb próbáld megérteni, mi történt; a megoldásról utána döntsetek. A beszélgetés végén foglaljátok össze, min változtattok, és a következő alkalommal térjetek vissza rá.",
    actionItems: [
      { title: "Beszéljük át, mit tanultunk egy hibából", description: "Kéthetente 30 percben vegyetek elő egy konkrét esetet. Kata az első alkalmon saját példát hoz; a beszélgetést zárjátok egy kipróbálható változtatással.", timeframe: "30", owner: "Kata", status: "in_progress", targetMetric: { kind: "psych_safety_item", itemId: "PS2" } },
      { title: "Közös feladat a kapcsolódás erősítésére", description: "Az érintett taggal egyeztetve válasszatok munkatársat és egy közösen elvégezhető feladatot. Hetente beszéljétek át, hogyan haladnak; két hónap múlva ismételjétek meg a bizalmi kört.", timeframe: "60", owner: "Kata", status: "not_started", targetMetric: { kind: "trust_coverage" } },
      { title: "Nézzük meg, mi vált be", description: "Három hónap múlva térjetek vissza a vállalásokra. Mit próbáltatok ki, mi könnyítette meg a munkát, és min kell még változtatni? A tapasztalatokat vessétek össze az új mérés eredményeivel.", timeframe: "90", owner: "Kata", status: "not_started" },
    ],
    internalNotes: null,
    aggregates: {
      ...report.aggregates!,
      teamStyle: { version: 1, operating, composition, sameRespondents: true, comparison: compareTeamPatterns(operating, composition) },
      dimensionAverages: Object.fromEntries(dimensions.map((dim) => [dim, mean(scores.map((score) => score[dim]))])),
      dimensionSpread: Object.fromEntries(dimensions.map((dim) => [dim, sampleStdDev(scores.map((score) => score[dim]))])),
      roleDistribution: { counts: { OG: 2, KE: 2, HA: 1 }, secondaryCounts: { KO: 3, ER: 2, CS: 2, MI: 2, SZ: 1 }, questionnaireCount: 4, estimateCount: 1 },
      roleGaps: ["MV"],
      evidence: { quality: "partial", measuredEdgeCount: 7, estimatedEdgeCount: 3 },
      dynamics: { alignedCount: 4, complementaryCount: 4, frictionCount: 2, topFrictionDims: ["E"], source: "mixed" },
      trustHighlights: { source: "trust_round", measuredPairCount: 7, possiblePairCount: 10, coveragePct: 70, hubs: ["Anna"], isolated: ["Béla"] },
      psychSafety: { ...psychSafety, weakItemIds: weakPsychSafetyItemIds(psychSafety.itemMeans), campaignName: "Őszi csapatfelmérés", campaignStatus: "CLOSED", measuredAt: "2026-09-16T09:00:00.000Z" },
      pressure: null, peerRoles: null, feedbackCulture: null,
    },
  };
}
