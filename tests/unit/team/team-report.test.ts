import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDraftNarrativePrefill,
  computeTopFrictionDims,
  serializeTeamReport,
  type TeamReportAggregates,
} from "@/lib/team-report";

const baseRecord = {
  id: "rep_1",
  teamId: "team_1",
  status: "PUBLISHED",
  title: "Q3 csapatkép",
  aggregates: { memberCount: 5 },
  summary: "Összefoglaló",
  strengths: null,
  risks: null,
  recommendations: null,
  interviewFindings: "Interjú-tanulságok",
  leadershipGuide: "Vezetési javaslatok",
  actionItems: [
    {
      title: "Kickoff workshop",
      description: "Normák tisztázása",
      timeframe: "30",
      targetMetric: { kind: "psych_safety_item", itemId: "PS1" },
    },
    { title: "hiányos elem", timeframe: "60" },
  ],
  internalNotes: "BIZALMAS tanácsadói jegyzet",
  publishedAt: new Date("2026-07-10T10:00:00Z"),
  createdAt: new Date("2026-07-09T10:00:00Z"),
  updatedAt: new Date("2026-07-10T10:00:00Z"),
};

test("internal notes are stripped for non-consultant serialization", () => {
  const serialized = serializeTeamReport(baseRecord, { includeInternalNotes: false });
  assert.equal(serialized.internalNotes, null);
  assert.equal(serialized.summary, "Összefoglaló");
  assert.equal(serialized.interviewFindings, "Interjú-tanulságok");
});

test("internal notes survive consultant serialization", () => {
  const serialized = serializeTeamReport(baseRecord, { includeInternalNotes: true });
  assert.equal(serialized.internalNotes, "BIZALMAS tanácsadói jegyzet");
});

test("comparisonBasis csak a tanácsadói szerializációban marad meg", () => {
  const record = {
    ...baseRecord,
    aggregates: {
      memberCount: 3,
      comparisonBasis: {
        version: 1,
        contributors: [{ key: "pseudonym", dimensions: { H: 50 } }],
      },
    },
  };

  const organizationView = serializeTeamReport(record, { includeInternalNotes: false });
  const consultantView = serializeTeamReport(record, { includeInternalNotes: true });

  assert.equal(organizationView.aggregates?.comparisonBasis, undefined);
  assert.equal(consultantView.aggregates?.comparisonBasis?.contributors.length, 1);
});

test("action items: malformed entries dropped, valid kept", () => {
  const serialized = serializeTeamReport(baseRecord, { includeInternalNotes: false });
  assert.deepEqual(serialized.actionItems, [
    {
      title: "Kickoff workshop",
      description: "Normák tisztázása",
      timeframe: "30",
      targetMetric: { kind: "psych_safety_item", itemId: "PS1" },
    },
  ]);
  assert.equal(serialized.leadershipGuide, "Vezetési javaslatok");
});

test("non-array actionItems serialize to null", () => {
  const serialized = serializeTeamReport(
    { ...baseRecord, actionItems: { rogue: true } },
    { includeInternalNotes: false },
  );
  assert.equal(serialized.actionItems, null);
});

const richAggregates: TeamReportAggregates = {
  generatedAt: "2026-07-13T10:00:00Z",
  memberCount: 5,
  completedCount: 4,
  completionPct: 80,
  dimensionAverages: { H: 62, E: 45, X: 58, A: 51, C: 70, O: 40 },
  dimensionSpread: { H: 8, E: 14, X: 9, A: 6, C: 18, O: 7 },
  pattern: { label: "Végrehajtó mag", confidence: "medium" },
  roleDistribution: {
    counts: { IM: 3, CO: 1 },
    secondaryCounts: { TW: 2, ME: 1 },
    questionnaireCount: 1,
    estimateCount: 3,
  },
  roleGaps: ["OG", "HA"],
  evidence: { quality: "partial", measuredEdgeCount: 0, estimatedEdgeCount: 6 },
  dynamics: {
    alignedCount: 1,
    complementaryCount: 2,
    frictionCount: 3,
    topFrictionDims: ["C", "E"],
    source: "profile_estimate",
  },
};

test("prefill: rich aggregates produce every narrative field + action items", () => {
  const prefill = buildDraftNarrativePrefill(richAggregates);
  assert.ok(prefill);
  // A szám ÉL-darabszám (felmért kapcsolat), nem tagpár — a copy őszinte.
  assert.ok(prefill!.summary.includes("6 felmért kapcsolatból"));
  assert.ok(!prefill!.summary.includes("tagpár"));
  assert.ok(prefill!.strengths.startsWith("• "));
  // friction 50% → norma-kockázat + ajánlás
  assert.ok(prefill!.risks.includes("munkastílus-különbség"));
  assert.ok(prefill!.recommendations.includes("működési normák"));
  // szerep-hiány bekerül név szerint
  assert.ok(prefill!.risks.includes("Ötletgazda"));
  // mért kapcsolati adat hiányzik → bizalmi kör ajánlás + akció
  assert.ok(prefill!.recommendations.includes("bizalmi kör"));
  const titles = prefill!.actionItems.map((item) => item.title);
  assert.ok(titles.includes("Csapatkép-átbeszélő workshop"));
  assert.ok(titles.includes("Működési normák rögzítése"));
  assert.ok(titles.includes("Szerep-tisztázás"));
  assert.ok(titles.includes("Mért bizalmi kör"));
  assert.ok(titles.includes("Utánkövetés és riport-frissítés"));
  assert.deepEqual(
    prefill!.actionItems.find((item) => item.title === "Mért bizalmi kör")?.targetMetric,
    { kind: "trust_coverage" },
  );
  for (const item of prefill!.actionItems) {
    assert.ok(["30", "60", "90"].includes(item.timeframe));
  }
});

test("prefill: a gyenge pulse-terület akciója a konkrét itemre céloz", () => {
  const prefill = buildDraftNarrativePrefill({
    ...richAggregates,
    psychSafety: {
      index: 52,
      band: "low",
      count: 5,
      spread: 10,
      itemMeans: { PS1: 2.8 },
      weakItemIds: ["PS1"],
      campaignName: "Pulse",
      campaignStatus: "CLOSED",
      measuredAt: "2026-08-01",
    },
  });
  const action = prefill!.actionItems.find((item) =>
    item.title.includes("Kényes témák felvetése")
  );
  assert.deepEqual(action?.targetMetric, {
    kind: "psych_safety_item",
    itemId: "PS1",
  });
});

test("prefill: high aligned share from TRUST data does NOT claim homogeneity (D2)", () => {
  const trustAligned: TeamReportAggregates = {
    ...richAggregates,
    evidence: { quality: "sufficient", measuredEdgeCount: 6, estimatedEdgeCount: 0 },
    dynamics: {
      alignedCount: 4,
      complementaryCount: 1,
      frictionCount: 1,
      topFrictionDims: [],
      source: "trust_round",
    },
  };
  const prefill = buildDraftNarrativePrefill(trustAligned);
  assert.ok(prefill);
  // A magas bizalom NEM homogenitás — a vakfolt/hasonló-profil szöveg kimarad.
  assert.ok(!prefill!.risks.includes("homogén profil"));
  assert.ok(!prefill!.strengths.includes("hasonló munkastílus"));
  assert.ok(!prefill!.recommendations.includes("Külső visszajelzés"));
  // Helyette a mért bizalmat pozitívan nevezi meg.
  assert.ok(prefill!.strengths.includes("bizalmi kapcsolat"));
});

test("prefill: high aligned share from PROFILE estimate keeps the homogeneity note (D2)", () => {
  const profileAligned: TeamReportAggregates = {
    ...richAggregates,
    evidence: { quality: "sufficient", measuredEdgeCount: 0, estimatedEdgeCount: 6 },
    dynamics: {
      alignedCount: 4,
      complementaryCount: 1,
      frictionCount: 1,
      topFrictionDims: [],
      source: "profile_estimate",
    },
  };
  const prefill = buildDraftNarrativePrefill(profileAligned);
  assert.ok(prefill);
  // Profil-hasonlóság → a homogén-vakfolt értelmezés jogos.
  assert.ok(prefill!.risks.includes("homogén profil"));
  assert.ok(prefill!.strengths.includes("hasonló munkastílus"));
  // Becslésből nem állítunk mért bizalmat.
  assert.ok(!prefill!.strengths.includes("bizalmi kapcsolat"));
});

test("prefill: MIXED-source dynamics claims neither homogeneity nor measured-trust strength (FIX 3)", () => {
  // Vegyes forrásnál nem tudható, hogy az aligned többség a mért bizalmi
  // vagy a profil-becslés feléből jön — homogenitást (vakfoltot) és teljes
  // mért bizalmat sem állíthat a prefill.
  const mixedAligned: TeamReportAggregates = {
    ...richAggregates,
    evidence: { quality: "sufficient", measuredEdgeCount: 3, estimatedEdgeCount: 3 },
    dynamics: {
      alignedCount: 4,
      complementaryCount: 1,
      frictionCount: 1,
      topFrictionDims: [],
      source: "mixed",
    },
  };
  const prefill = buildDraftNarrativePrefill(mixedAligned);
  assert.ok(prefill);
  assert.ok(!prefill!.risks.includes("homogén profil"));
  assert.ok(!prefill!.strengths.includes("hasonló munkastílus"));
  assert.ok(!prefill!.recommendations.includes("Külső visszajelzés"));
  // A „mért bizalmi kör alapján…" erősség-mondat is csak tiszta trust_round-nál jár.
  assert.ok(!prefill!.strengths.includes("bizalmi kapcsolat"));
});

test("prefill: E legalacsonyabb átlagnál sem kerül a figyelendő (deficit) slotba — score-valence kapu", () => {
  const resoLowest: TeamReportAggregates = {
    ...richAggregates,
    dimensionAverages: { H: 62, E: 30, X: 58, A: 51, C: 70, O: 45 },
  };
  const prefill = buildDraftNarrativePrefill(resoLowest);
  assert.ok(prefill);
  // Az érzelmi stabilitás nem kockázat — a E figyelendő-szövege kimarad,
  // a legalacsonyabb ELIGIBLE dimenzió (O) figyelendője kerül be.
  assert.ok(!prefill!.risks.includes("Érzelmileg ráhangolódóbb"));
  assert.ok(prefill!.risks.includes("Pragmatikus fókusz"));
});

test("prefill: több-csapatos futó pulse mellett nincs 'pulse indítása' javaslat (FIX 2)", () => {
  const multiTeamPulse: TeamReportAggregates = {
    ...richAggregates,
    psychSafety: null,
    psychSafetyMultiTeam: true,
  };
  const prefill = buildDraftNarrativePrefill(multiTeamPulse);
  assert.ok(prefill);
  assert.ok(!prefill!.recommendations.includes("pulse indítása"));
});

test("prefill: se pulse-adat, se lefedő kör → marad a pulse-indítás javaslat", () => {
  const prefill = buildDraftNarrativePrefill(richAggregates);
  assert.ok(prefill);
  assert.ok(prefill!.recommendations.includes("Pszichológiai biztonság pulse indítása"));
});

test("prefill: no dimension averages returns null", () => {
  const prefill = buildDraftNarrativePrefill({
    ...richAggregates,
    dimensionAverages: null,
  });
  assert.equal(prefill, null);
});

// ── computeTopFrictionDims ───────────────────────────────────────────────────

test("topFrictionDims: a szűrés is a rangsorolt mennyiségre (w·szórás ≥ 2) megy", () => {
  // C 10-es nyers szórás: 0.30 × 10 = 3 ≥ 2 → bekerül, pedig a régi
  // nyers ≥12 szűrő kizárta volna; O 20-as szórás: 0.05 × 20 = 1 < 2 →
  // kimarad, pedig a nyers szűrő átengedte volna.
  assert.deepEqual(computeTopFrictionDims({ C: 10, O: 20 }), ["C"]);
});

test("topFrictionDims: w·szórás szerint rangsorol, max 2 dim", () => {
  // C 5.4 > A 3.0 > E 2.1 (levágva) > H 1.6 (küszöb alatt)
  assert.deepEqual(
    computeTopFrictionDims({ H: 8, E: 14, C: 18, A: 12 }),
    ["C", "A"],
  );
});

test("topFrictionDims: küszöb alatti szórásoknál üres", () => {
  assert.deepEqual(
    computeTopFrictionDims({ H: 5, E: 5, X: 5, A: 5, C: 5, O: 5 }),
    [],
  );
});

test("unknown status normalizes to DRAFT", () => {
  const serialized = serializeTeamReport(
    { ...baseRecord, status: "weird" },
    { includeInternalNotes: false },
  );
  assert.equal(serialized.status, "DRAFT");
});
