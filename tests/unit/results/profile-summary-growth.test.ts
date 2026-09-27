import test from "node:test";
import assert from "node:assert/strict";
import { buildProfileReportViewModel, buildProfileSummaryInsights } from "@/lib/profile-report-view-model";
import { DIMENSION_GROWTH_TIPS } from "@/lib/profile-content";
import { getTestConfig } from "@/lib/questions";
import { t, type Locale } from "@/lib/i18n";

function dimensions(scores: Record<string, number>, locale: Locale) {
  return getTestConfig("TRITAN", locale).dimensions.flatMap((dim) => {
    const score = scores[dim.code];
    if (score === undefined) return [];
    const insights = dim.insightsByLocale?.[locale] ?? dim.insights;
    return [{
      code: dim.code,
      label: dim.labelByLocale?.[locale] ?? dim.label,
      score,
      insight: insights[score < 40 ? "low" : score < 70 ? "mid" : "high"],
      description: dim.descriptionByLocale?.[locale] ?? dim.description,
    }];
  });
}

for (const locale of ["hu", "en"] as const) {
  for (const plan of ["start", "plus"] as const) {
    test(`${locale}/${plan}: magas O, kiemelt gyakorlási terület nélkül konkrét önmegfigyelési feladatot ad`, () => {
      // A bejelentett hiba: a legmagasabb dimenzió teljes tankönyvi
      // leírása került a „kipróbálnod” kártyára, ha nem volt growthTip.
      const dims = dimensions({ H: 55, E: 20, X: 55, A: 55, C: 55, O: 85 }, locale);
      const expected = t("results.summaryGrowthExperiment", locale);
      const web = buildProfileSummaryInsights(dims, undefined, locale);
      const pdf = buildProfileReportViewModel({
        locale, plan, dimensions: dims, userName: "Teszt Elek",
        completedAt: "2026-09-27", personalityType: "", heroInsight: "",
      });
      assert.equal(web[2].text, expected);
      assert.equal(pdf.quickOverview.insights[2].text, expected);
      for (const dim of dims) {
        assert.notEqual(web[2].text, dim.description);
        assert.notEqual(web[2].text, dim.insight);
      }
    });
  }

  test(`${locale}: Plus-tartalom nélkül is az alacsony dimenzióhoz illő gyakorlatot választja`, () => {
    const dims = dimensions({ H: 60, E: 10, X: 60, A: 60, C: 25, O: 30 }, locale);
    const growth = buildProfileSummaryInsights(dims, undefined, locale)[2];
    assert.equal(growth.text, DIMENSION_GROWTH_TIPS.C[locale].behavior);
  });

  test(`${locale}: az üres külön javaslat helyére is valódi gyakorlat kerül`, () => {
    const dims = dimensions({ H: 60, E: 50, X: 60, A: 60, C: 60, O: 30 }, locale);
    const content = { growthTip: "  ", howYouWorkParts: { main: "", watch: null, notes: [], context: [] } };
    assert.equal(buildProfileSummaryInsights(dims, content, locale)[2].text, DIMENSION_GROWTH_TIPS.O[locale].behavior);
  });

  test(`${locale}: a meglévő személyre szabott javaslat elsőbbséget élvez`, () => {
    const dims = dimensions({ C: 25, O: 85 }, locale);
    const content = { growthTip: "Egy konkrét kipróbálható lépés.", howYouWorkParts: { main: "", watch: null, notes: [], context: [] } };
    assert.equal(buildProfileSummaryInsights(dims, content, locale)[2].text, content.growthTip);
  });
}
