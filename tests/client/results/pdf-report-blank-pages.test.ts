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
import { TritaReportDocument } from "@/components/pdf/TritaPdf";
import { chrome } from "@/components/pdf/styles";

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
    "%s – nincs üres, lebegő lap",
    async (_id, scenario) => {
      const buffer = await renderReportBuffer(scenario.input);
      expect(findBlankPages(buffer)).toEqual([]);
    },
    60_000,
  );
});

// Inspect the actual renderer layout, not source styles: a flex block can
// report a small height while painting its text over the following card.
interface RenderedPdfNode {
  type: string;
  value?: string;
  box?: { top: number; height: number };
  props?: { fixed?: boolean; bookmark?: { title?: string } };
  children?: RenderedPdfNode[];
  lines?: { box: { y: number; height: number } }[];
}

function renderedText(node: RenderedPdfNode): string {
  return node.value ?? node.children?.map(renderedText).join("") ?? "";
}

function findClippedText(layout: RenderedPdfNode): string[] {
  const failures: string[] = [];
  for (const [pageIndex, page] of (layout.children ?? []).entries()) {
    const pageBottom = (page.box?.height ?? 0) - chrome.footerHeight;
    const walk = (node: RenderedPdfNode, parent: RenderedPdfNode, parentTop: number) => {
      if (node.props?.fixed) return; // Deliberate page header/footer placement.
      const box = node.box;
      const top = parentTop + (box?.top ?? 0);
      if (node.type === "TEXT" && box && node.lines?.length) {
        // Yoga may collapse a text box to zero while textkit still paints every
        // line. Measure those actual lines rather than trusting box.height.
        const firstLineTop = Math.min(...node.lines.map((line) => line.box.y));
        const textHeight = Math.max(...node.lines.map((line) => line.box.y + line.box.height)) - firstLineTop;
        const label = `page ${pageIndex + 1}: ${renderedText(node).slice(0, 80)}`;
        if (textHeight > box.height + 0.5) failures.push(`${label} overflows its text box`);
        if (top < chrome.headerHeight + 10 - 0.5 || top + textHeight > pageBottom + 0.5) {
          failures.push(`${label} escapes the page body`);
        }
        if (parent.box && (box.top < -0.5 || box.top + textHeight > parent.box.height + 0.5)) {
          failures.push(`${label} escapes its containing block`);
        }
      }
      // Nested TEXT nodes are inline runs, not separately positioned boxes.
      if (node.type !== "TEXT") {
        for (const child of node.children ?? []) walk(child, node, top);
      }
    };
    for (const child of page.children ?? []) walk(child, page, 0);
  }
  return failures;
}

describe("a személyes PDF hosszú szövegek mellett", () => {
  const ids = ["plus-hu-many-high", "plus-hu-many-low", "plus-hu-long-copy"];
  const scenarios = buildPdfScenarios().filter((s) => ids.includes(s.id));

  it.each(scenarios.map((s) => [s.id, s] as const))("%s – nincs túlfolyás, a tartalomjegyzék a valós kezdőlapra mutat", async (_id, scenario) => {
    registerPdfFonts();
    let layout: RenderedPdfNode | undefined;
    const document = TritaReportDocument({ data: scenario.input });
    const buffer = await renderToBuffer(React.cloneElement(document, {
      onRender: (result: unknown) => {
        // react-pdf exposes the completed, paginated layout on render.
        layout = (result as { _INTERNAL__LAYOUT__DATA_: RenderedPdfNode })._INTERNAL__LAYOUT__DATA_;
      },
    }));
    expect(layout?.children?.length).toBeGreaterThan(0);
    const pages = layout!.children!;
    const start = pages.findIndex((page) => page.props?.bookmark?.title?.startsWith("03 ·"));
    expect(start).toBeGreaterThan(0);
    const nextChapter = pages.findIndex((page, index) => index > start && page.props?.bookmark);
    const chapter = { type: "DOCUMENT", children: pages.slice(start, nextChapter < 0 ? undefined : nextChapter) };
    expect(renderedText(chapter)).toContain("Munkastílus és fejlődés");
    expect(renderedText(chapter)).toContain("Kontextus");
    expect(findClippedText(chapter)).toEqual([]);
    expect(findBlankPages(buffer)).toEqual([]);

    const descendants = (node: RenderedPdfNode): RenderedPdfNode[] =>
      [node, ...(node.children ?? []).flatMap(descendants)];
    for (const number of ["01", "02", "03"]) {
      const actualPage = pages.findIndex((page) => page.props?.bookmark?.title?.startsWith(`${number} ·`));
      expect(actualPage).toBeGreaterThan(0);
      const title = pages[actualPage].props!.bookmark!.title!.slice(5);
      const tocRow = descendants(pages[1]).find((node) =>
        node.type === "VIEW" && node.children?.length === 3 &&
        renderedText(node.children[0]) === number && renderedText(node.children[1]) === title,
      );
      expect(tocRow, `Missing TOC row for ${title}`).toBeDefined();
      // Page index already excludes the unnumbered cover, matching the footer.
      expect(renderedText(tocRow!.children![2]), `Wrong TOC page for ${title}`).toBe(String(actualPage));
    }
  }, 60_000);
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
    // Mért csapatkép + személyiség-réteg + értelmezés + utánkövetés + melléklet.
    // Rövid akció vagy forrásjegyzet nem hozhat létre külön, üres lapot.
    expect(pageTextOperatorCounts(buffer)).toHaveLength(5);
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
    expect(pageTextOperatorCounts(buffer)).toHaveLength(1); // compact legacy report, no empty cover
  }, 60_000);
});

// New reader: charts first, comparison next, exact statistics in the appendix.
describe("csapatriport olvasói nézet", () => {
  it.each([true, false])("eltérő tengelylétszámok esetén sem keletkezik üres lap (HU=%s)", async (isHu) => {
    const { makeReaderReport } = await import("../../../scripts/fixtures/team-report-reader");
    registerPdfFonts();
    const buffer = await renderToBuffer(React.createElement(TeamReportDocument, { report: makeReaderReport(true), isHu }) as never);
    expect(findBlankPages(buffer)).toEqual([]);
    expect(pageTextOperatorCounts(buffer)).toHaveLength(4);
  }, 60_000);

  it("hosszú tanácsadói szöveget és akciót is végig tördel, tartalom nélküli folytatólap nélkül", async () => {
    const { makeReaderReport } = await import("../../../scripts/fixtures/team-report-reader");
    const report = makeReaderReport(true);
    report.risks = Array.from({ length: 70 }, (_, i) => `${i + 1}. Megbeszélendő helyzet: hogyan jut el a közös információ minden érintetthez?`).join("\n");
    report.actionItems = [{ title: "Közös gyakorlat kialakítása", description: "A részletesen megbeszélt helyzeteket és tapasztalatokat közösen rögzítjük. ".repeat(80), timeframe: "30" }];
    const buffer = await renderTeamReport(report);
    expect(findBlankPages(buffer)).toEqual([]);
    expect(pageTextOperatorCounts(buffer).length).toBeGreaterThan(5);
  }, 60_000);
});


describe("team pattern illustration in PDF", () => {
  it("renders the descriptive pattern with native artwork and no empty continuation page", async () => {
    const { makeReaderReport } = await import("../../../scripts/fixtures/team-report-reader");
    registerPdfFonts();
    const buffer = await renderToBuffer(React.createElement(TeamReportDocument, { report: makeReaderReport(), isHu: true }) as never);
    expect(findBlankPages(buffer)).toEqual([]);
    expect(pageTextOperatorCounts(buffer)).toHaveLength(4);
  }, 60_000);
});
