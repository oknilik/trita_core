// Füstteszt: a TeamReportDocument node-oldali renderelése mock-adatokkal.
// NEM része a CI-nek — kézi ellenőrzés: `npx tsx scripts/smoke-team-report-pdf.tsx`.
// A font-átregisztráció a generate-persona-reports.tsx mintája.
import { join } from "node:path";
import { Font, renderToBuffer } from "@react-pdf/renderer";
import React from "react";

const FONT_DIR = join(process.cwd(), "public", "fonts");
Font.clear();
Font.register({
  family: "Fraunces",
  fonts: [
    { src: join(FONT_DIR, "Fraunces-Regular.ttf"), fontWeight: 400 },
    { src: join(FONT_DIR, "Fraunces-Regular.ttf"), fontWeight: 600 },
    { src: join(FONT_DIR, "Fraunces-Italic.ttf"), fontStyle: "italic" },
  ],
});
Font.register({
  family: "DM Sans",
  fonts: [
    { src: join(FONT_DIR, "DMSans-Regular.ttf"), fontWeight: 400 },
    { src: join(FONT_DIR, "DMSans-Regular.ttf"), fontWeight: 500 },
    { src: join(FONT_DIR, "DMSans-Regular.ttf"), fontWeight: 600 },
  ],
});
Font.register({
  family: "Helvetica",
  fonts: [
    { src: join(FONT_DIR, "DMSans-Regular.ttf"), fontWeight: 400 },
    { src: join(FONT_DIR, "DMSans-Regular.ttf"), fontWeight: 700 },
    { src: join(FONT_DIR, "Fraunces-Italic.ttf"), fontWeight: 400, fontStyle: "italic" },
    { src: join(FONT_DIR, "Fraunces-Italic.ttf"), fontWeight: 700, fontStyle: "italic" },
  ],
});

async function main() {
  const { TeamReportDocument } = await import("../src/components/pdf/TeamReportPdf");
  const report = {
    id: "rep_smoke",
    teamId: "team_smoke",
    status: "PUBLISHED" as const,
    title: "Termékfejlesztés — őszi kör",
    aggregates: {
      generatedAt: "2026-08-15T10:00:00.000Z",
      memberCount: 9,
      completedCount: 8,
      completionPct: 89,
      dimensionAverages: { H: 62, E: 48, X: 55, A: 58, C: 71, O: 66 },
      dimensionSpread: { H: 12, E: 18, X: 9, A: 14, C: 8, O: 11 },
      pattern: {
        label: "Építők",
        confidence: "magas",
        stability: "közepes" as const,
        stabilityNote:
          "A Nyitottság-tengely küszöb-közeli — a mintázat kontextusfüggő lehet.",
        unstableAxes: ["openness"],
        tensionMemberCount: 2,
      },
      roleDistribution: {
        counts: { OG: 2, KE: 3, HA: 1 },
        questionnaireCount: 6,
        estimateCount: 2,
      },
      roleGaps: ["MV"],
      evidence: { quality: "partial" as const, measuredEdgeCount: 14, estimatedEdgeCount: 22 },
      dynamics: {
        alignedCount: 9,
        complementaryCount: 15,
        frictionCount: 4,
        topFrictionDims: ["E"],
        source: "mixed" as const,
      },
      trustHighlights: {
        source: "trust_round" as const,
        measuredPairCount: 14,
        possiblePairCount: 36,
        coveragePct: 39,
        hubs: ["Anna"],
        isolated: ["Béla"],
      },
      psychSafety: {
        index: 68,
        band: "mid" as const,
        count: 7,
        spread: 0.6,
        itemMeans: { PS1: 4.1, PS2: 3.2 },
        weakItemIds: ["PS2"],
        campaignName: "Scan v1 — ősz",
        campaignStatus: "CLOSED",
        measuredAt: "2026-08-10T09:00:00.000Z",
      },
      pressure: null,
      peerRoles: null,
      feedbackCulture: null,
    },
    summary: "• A csapat magja stabil és lelkiismeretes.\n• Az újítási energia egy szűk körben koncentrálódik.",
    strengths: "• Erős végrehajtás\n• Magas kohézió a magban",
    risks: "• A visszajelzési kultúra törékeny\n• Egy tag beágyazatlan",
    recommendations: "• Heti 15 perces retró bevezetése\n• Bizalmi kör megismétlése 8 hét múlva",
    interviewFindings: null,
    leadershipGuide: "• A vezető először a pszichológiai biztonság 2. itemére figyeljen.",
    actionItems: [
      {
        title: "Retró-ritmus bevezetése",
        description: "Kéthetente 30 perc, rotáló facilitátorral.",
        timeframe: "30" as const,
        owner: "Kata",
        status: "in_progress" as const,
        targetMetric: { kind: "psych_safety_item" as const, itemId: "PS2" },
      },
      {
        title: "Beágyazatlan tag onboarding-párja",
        description: "Mentor-pár kijelölése és heti közös munka.",
        timeframe: "60" as const,
        status: "not_started" as const,
      },
    ],
    internalNotes: null,
    translationsEn: null,
    publishedAt: "2026-08-16T08:00:00.000Z",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-16T08:00:00.000Z",
  };

  for (const isHu of [true, false]) {
    const buf = await renderToBuffer(
      React.createElement(TeamReportDocument, { report: report as never, isHu }) as never,
    );
    console.log(`render ok (isHu=${isHu}): ${buf.length} bytes, %PDF=${buf.subarray(0, 5).toString()}`);
  }

  // Üres-aggregátum ág (régi riport): ne dőljön el.
  const bare = { ...report, aggregates: null, actionItems: null, leadershipGuide: null };
  const buf = await renderToBuffer(
    React.createElement(TeamReportDocument, { report: bare as never, isHu: true }) as never,
  );
  console.log(`render ok (no aggregates): ${buf.length} bytes`);

  // Vizuális ellenőrzéshez fájlba is kiírjuk a teljes HU változatot.
  const { writeFileSync } = await import("node:fs");
  const full = await renderToBuffer(
    React.createElement(TeamReportDocument, { report: report as never, isHu: true }) as never,
  );
  writeFileSync("/tmp/team-report-smoke.pdf", full);
  console.log("written /tmp/team-report-smoke.pdf");
}

main().catch((err) => {
  console.error("SMOKE FAILED", err);
  process.exit(1);
});
