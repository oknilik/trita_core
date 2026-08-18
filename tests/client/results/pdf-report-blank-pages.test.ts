// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildPdfScenarios } from "../../../scripts/pdf-report-scenarios";
import { findBlankPages, renderReportBuffer } from "../../../scripts/pdf-report-render";

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
