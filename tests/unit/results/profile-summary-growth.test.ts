import assert from "node:assert/strict";
import test from "node:test";
import { buildProfileSummaryInsights, type ReportInputDimension } from "@/lib/profile-report-view-model";
import { DIMENSION_GROWTH_TIPS } from "@/lib/profile-content";
import { t } from "@/lib/i18n";

const dimensions = (overrides: Record<string, number> = {}): ReportInputDimension[] =>
  ["H", "E", "X", "A", "C", "O"].map((code) => ({
    code, label: code, score: overrides[code] ?? 55,
    insight: `Interpretation: ${code}`, description: `Textbook definition: ${code}`,
  }));

for (const locale of ["hu", "en"] as const) {
  test(`${locale}: missing growth copy uses a concrete low-dimension behavior`, () => {
    const growth = buildProfileSummaryInsights(dimensions({ E: 10, C: 25 }), undefined, locale)[2];
    assert.equal(growth.text, DIMENSION_GROWTH_TIPS.C[locale].behavior);
    assert.equal(growth.label, t("results.summaryGrowth", locale));
    assert.ok(!growth.text.includes("Textbook"));
  });

  test(`${locale}: balanced and only-low-E profiles get an experiment without a false deficit`, () => {
    for (const scores of [{}, { E: 10 }, { H: 90, O: 90 }]) {
      const growth = buildProfileSummaryInsights(dimensions(scores), undefined, locale)[2];
      assert.equal(growth.text, t("results.summaryGrowthExperiment", locale));
      assert.notEqual(growth.text, DIMENSION_GROWTH_TIPS.E[locale].behavior);
    }
  });

  test(`${locale}: preserves a supplied personal growth tip and replaces blank tips`, () => {
    const plusContent = {
      howYouWorkParts: { main: "Main", watch: "Watch", notes: [], context: [] },
      growthTip: "A personal, actionable tip.",
    };
    assert.equal(buildProfileSummaryInsights(dimensions(), plusContent, locale)[2].text, plusContent.growthTip);
    assert.equal(buildProfileSummaryInsights(dimensions(), { ...plusContent, growthTip: "  " }, locale)[2].text,
      t("results.summaryGrowthExperiment", locale));
  });
}
