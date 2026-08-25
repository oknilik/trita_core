// @vitest-environment node
import { describe, expect, it } from "vitest";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import { buildPdfScenarios } from "../../../scripts/pdf-report-scenarios";
import {
  findBlankPages,
  pageTextOperatorCounts,
  registerPdfFonts,
  renderReportBuffer,
} from "../../../scripts/pdf-report-render";
import { TeamReportDocument } from "@/components/pdf/TeamReportPdf";
import type { SerializedTeamReport } from "@/lib/team-report";

// ─────────────────────────────────────────────────────────────────────────────
// „Üresen lebegő lap" — éles riport-visszajelzés, 2026-08-18.
//
// Az utolsó kártya `marginBottom`-ja éppen túllógott a tartalom-dobozon (a
// törzs 795,9 pt-nál ért véget, +12 pt margó = 808 = a doboz alja), és a
// react-pdf tartalom nélküli folytatás-lapot nyitott: csak a fixed fejléc és
// lábléc látszott rajta. Ezt csak VALÓDI rendereléssel lehet kimutatni.
//
// Miért a client rétegben fut? A unit réteg `--conditions=react-server`
// alatt indul (scripts/run-tests.mjs), ahol a react-pdf reconcilere nem
// működik. A szerkezeti ok (gap vs. marginBottom, törhető kártya) forrás-
// szinten a unit rétegben őrzött: tests/unit/results/pdf-report-pagination.
//
// A teljes, 12 forgatókönyves készlet: `pnpm report:pdf-snapshots`.
// ─────────────────────────────────────────────────────────────────────────────

// A mellékleteket is felvonultató esetek — a lapok végén ezek torlódtak.
const RENDERED_SCENARIO_IDS = [
  "plus-hu-observer-aligned",
  "plus-hu-mixed-full",
  "plus-hu-with-supplementary-scale",
];

describe("riport-PDF tördelés", () => {
  const scenarios = buildPdfScenarios().filter((s) => RENDERED_SCENARIO_IDS.includes(s.id));

  it("lefedi mindhárom renderelendő forgatókönyvet", () => {
    expect(scenarios.map((s) => s.id).sort()).toEqual([...RENDERED_SCENARIO_IDS].sort());
  });

  it.each(scenarios.map((s) => [s.id, s] as const))(
    "%s — nincs üres, lebegő lap",
    async (_id, scenario) => {
      const buffer = await renderReportBuffer(scenario.input);
      expect(findBlankPages(buffer)).toEqual([]);
    },
    60_000,
  );
});

const TEAM_REPORT_FIXTURE = {
  id: "report_pdf_fixture",
  teamId: "team_pdf_fixture",
  status: "PUBLISHED",
  title: "Termékfejlesztés - őszi kör",
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
      stability: "közepes",
      stabilityNote: "A Nyitottság-tengely küszöb-közeli, ezért a mintázat kontextusfüggő lehet.",
      unstableAxes: ["openness"],
      tensionMemberCount: 2,
    },
    roleDistribution: null,
    roleGaps: [],
    evidence: { quality: "partial", measuredEdgeCount: 14, estimatedEdgeCount: 22 },
    dynamics: {
      alignedCount: 9,
      complementaryCount: 15,
      frictionCount: 4,
      topFrictionDims: ["E"],
      source: "mixed",
    },
    trustHighlights: {
      source: "trust_round",
      measuredPairCount: 14,
      possiblePairCount: 36,
      coveragePct: 39,
      hubs: ["Anna"],
      isolated: ["Béla"],
    },
    psychSafety: {
      index: 68,
      band: "mid",
      count: 7,
      spread: 0.6,
      itemMeans: { PS1: 4.1, PS2: 3.2 },
      weakItemIds: ["PS2"],
      campaignName: "Scan v1",
      campaignStatus: "CLOSED",
      measuredAt: "2026-08-10T09:00:00.000Z",
    },
    pressure: null,
    peerRoles: null,
    feedbackCulture: null,
  },
  summary: "• A csapat magja stabil és lelkiismeretes.",
  strengths: "• Erős végrehajtás\n• Magas kohézió a magban",
  risks: "• A visszajelzési kultúra törékeny",
  recommendations: "• Kétheti retrospektív ritmus bevezetése",
  interviewFindings: null,
  leadershipGuide: "• A vezető tegye láthatóvá a döntési szempontokat.",
  actionItems: [
    {
      title: "Retró-ritmus bevezetése",
      description: "Kéthetente 30 perc, rotáló facilitátorral.",
      timeframe: "30",
      owner: "Kata",
      status: "in_progress",
      targetMetric: { kind: "psych_safety_item", itemId: "PS2" },
    },
  ],
  internalNotes: null,
  translationsEn: null,
  publishedAt: "2026-08-16T08:00:00.000Z",
  createdAt: "2026-08-01T08:00:00.000Z",
  updatedAt: "2026-08-16T08:00:00.000Z",
} as unknown as SerializedTeamReport;

async function renderTeamReport(report: SerializedTeamReport): Promise<Buffer> {
  registerPdfFonts();
  return renderToBuffer(
    React.createElement(TeamReportDocument, { report, isHu: true }) as never,
  );
}

describe("szervezeti riport-PDF tördelés", () => {
  it("a teljes riportban nincs üres, lebegő lap", async () => {
    const buffer = await renderTeamReport(TEAM_REPORT_FIXTURE);
    expect(findBlankPages(buffer)).toEqual([]);
    // Borító + 01 összkép + 02 kapcsolati kép + 03 tanácsadói értékelés.
    // A módszertan nem csúszhat külön, gyakorlatilag üres ötödik oldalra.
    expect(pageTextOperatorCounts(buffer)).toHaveLength(4);
  }, 60_000);

  it("üres örökség-riportnál nem készít külön, tartalom nélküli értékelés-oldalt", async () => {
    const report = {
      ...TEAM_REPORT_FIXTURE,
      aggregates: null,
      summary: null,
      strengths: null,
      risks: null,
      recommendations: null,
      leadershipGuide: null,
      actionItems: null,
    };
    const buffer = await renderTeamReport(report);
    expect(findBlankPages(buffer)).toEqual([]);
    expect(pageTextOperatorCounts(buffer)).toHaveLength(2); // borító + 01 összkép
  }, 60_000);
});
