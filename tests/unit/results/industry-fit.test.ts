import test from "node:test";
import assert from "node:assert/strict";
import {
  INDUSTRIES,
  applyLeadFocus,
  explainRoleFit,
  rankCareerSuggestions,
  rankIndustryFit,
  scorePrefMatch,
  scoreRoleFit,
  type CareerBackground,
} from "@/lib/industry-fit";

const baseBackground: CareerBackground = {
  status: "working",
  eduLevel: "higher",
  eduField: null,
  ageBand: null,
  currentIndustry: null,
  interests: [],
};

const detailOriented = { H: 60, E: 40, X: 30, A: 55, C: 90, O: 45 };
const socialExplorer = { H: 50, E: 35, X: 88, A: 45, C: 40, O: 80 };

test("katalógus: minden szerep súlyai 1-re összegződnek", () => {
  for (const industry of INDUSTRIES) {
    for (const role of industry.roles) {
      const total = role.weights.reduce((sum, w) => sum + w.weight, 0);
      assert.ok(
        Math.abs(total - 1) < 0.001,
        `${industry.key}/${role.key} súlyösszeg: ${total}`,
      );
    }
  }
});

test("magas C profil: QA a fejlesztői rangsor elején, PM hátrébb", () => {
  const ranked = rankIndustryFit(detailOriented, "tech");
  assert.ok(ranked.length >= 3);
  const qaIdx = ranked.findIndex((r) => r.role.key === "qa");
  const pmIdx = ranked.findIndex((r) => r.role.key === "pm");
  assert.ok(qaIdx < pmIdx, `qa (${qaIdx}) legyen pm (${pmIdx}) előtt`);
});

test("társas-explorer profil: sales/bizdev élen az értékesítésben", () => {
  const ranked = rankIndustryFit(socialExplorer, "sales");
  assert.ok(["sales", "bizdev"].includes(ranked[0].role.key));
  assert.ok(ranked[0].score > ranked[ranked.length - 1].score);
});

test("low irány: alacsony E növeli a nyomásálló szerep pontszámát", () => {
  const risk = INDUSTRIES.find((i) => i.key === "finance")!.roles.find(
    (r) => r.key === "risk",
  )!;
  const calm = scoreRoleFit({ H: 50, E: 20, C: 70 }, risk)!;
  const reactive = scoreRoleFit({ H: 50, E: 80, C: 70 }, risk)!;
  assert.ok(calm.score > reactive.score);
});

test("watchDim: 55 alatti komponensnél jelez, felette null", () => {
  const qa = INDUSTRIES.find((i) => i.key === "tech")!.roles.find(
    (r) => r.key === "qa",
  )!;
  const weakH = scoreRoleFit({ C: 90, H: 30, O: 40 }, qa)!;
  assert.equal(weakH.watchDim, "H");
  const strong = scoreRoleFit({ C: 90, H: 80, O: 20 }, qa)!;
  assert.equal(strong.watchDim, null);
});

test("hiányzó dimenziók: üres scores null-t ad", () => {
  const role = INDUSTRIES[0].roles[0];
  assert.equal(scoreRoleFit({}, role), null);
});

test("ismeretlen iparág: üres lista", () => {
  assert.deepEqual(rankIndustryFit(detailOriented, "nope"), []);
});

test("applyLeadFocus: súlyok 1-re normalizálódnak, X-komponens bekerül", () => {
  const dev = INDUSTRIES.find((i) => i.key === "tech")!.roles.find((r) => r.key === "dev")!;
  const adjusted = applyLeadFocus(dev.weights);
  const total = adjusted.reduce((sum, w) => sum + w.weight, 0);
  assert.ok(Math.abs(total - 1) < 0.001);
  assert.ok(adjusted.some((w) => w.dim === "X" && w.direction === "high"));
});

test("vezetői fókusz: magas X profil pontszáma nő a dev szerepen", () => {
  const dev = INDUSTRIES.find((i) => i.key === "tech")!.roles.find((r) => r.key === "dev")!;
  const highX = { H: 50, E: 30, X: 90, A: 60, C: 70, O: 60 };
  const base = scoreRoleFit(highX, dev)!;
  const lead = scoreRoleFit(highX, dev, { leadFocus: true })!;
  assert.ok(lead.score > base.score, `lead ${lead.score} > base ${base.score}`);
});

test("preferencia: egyező tengely 100, ellentétes 0, beállítás nélkül null", () => {
  const dev = INDUSTRIES.find((i) => i.key === "tech")!.roles.find((r) => r.key === "dev")!;
  // dev prefs: people -1, autonomy 1
  assert.equal(scorePrefMatch({ people: -1 }, dev), 100);
  assert.equal(scorePrefMatch({ people: 1 }, dev), 0);
  assert.equal(scorePrefMatch({}, dev), null);
  assert.equal(scorePrefMatch({ people: 0 }, dev), null);
});

test("preferencia átrendezi a rangsort (combined), de a score marad", () => {
  const balanced = { H: 55, E: 45, X: 55, A: 55, C: 60, O: 55 };
  const noPref = rankIndustryFit(balanced, "tech");
  const peoplePref = rankIndustryFit(balanced, "tech", { prefs: { people: 1 } });
  const devNoPref = noPref.find((r) => r.role.key === "dev")!;
  const devPeople = peoplePref.find((r) => r.role.key === "dev")!;
  assert.equal(devNoPref.score, devPeople.score);
  assert.ok(devPeople.combined < devPeople.score, "ember-preferencia bünteti a dev combined-ját");
});

test("karrier-javaslat: érdeklődés szűkíti a kört", () => {
  const result = rankCareerSuggestions(detailOriented, {
    ...baseBackground,
    interests: ["finance"],
  });
  assert.ok(result.suggestions.length > 3, "több mint 3 javaslat");
  assert.ok(result.suggestions.every((s) => s.industryKey === "finance"));
});

test("karrier-javaslat: végzettség-affinitás boost + jelölés", () => {
  const noEdu = rankCareerSuggestions(detailOriented, baseBackground);
  const withEdu = rankCareerSuggestions(detailOriented, {
    ...baseBackground,
    eduField: "economics",
  });
  const financeNoEdu = noEdu.suggestions.find((s) => s.industryKey === "finance");
  const financeWithEdu = withEdu.suggestions.find((s) => s.industryKey === "finance");
  assert.ok(financeWithEdu, "gazdasági végzettséggel finance a topban");
  assert.ok(financeWithEdu!.eduBoosted);
  if (financeNoEdu) {
    assert.equal(financeWithEdu!.combined, financeNoEdu.combined + 6);
    assert.equal(financeWithEdu!.score, financeNoEdu.score, "a nyers score nem változik");
  }
});

test("karrier-javaslat: jelenlegi iparág külön top 3", () => {
  const result = rankCareerSuggestions(socialExplorer, {
    ...baseBackground,
    currentIndustry: "hospitality",
  });
  assert.equal(result.currentIndustryTop.length, 3);
  assert.ok(result.currentIndustryTop.every((s) => s.industryKey === "hospitality"));
  assert.ok(result.currentIndustryTop[0].combined >= result.currentIndustryTop[2].combined);
});

test("karrier-javaslat: developDims a watch-dimenziókból, max 2", () => {
  const lopsided = { H: 30, E: 80, X: 25, A: 35, C: 90, O: 30 };
  const result = rankCareerSuggestions(lopsided, baseBackground);
  assert.ok(result.developDims.length <= 2);
});

test("explainRoleFit: súly szerint rendezett, alignment konzisztens", () => {
  const qa = INDUSTRIES.find((i) => i.key === "tech")!.roles.find((r) => r.key === "qa")!;
  const breakdown = explainRoleFit({ C: 80, H: 60, O: 30 }, qa);
  assert.equal(breakdown.length, 3);
  assert.ok(breakdown[0].weight >= breakdown[1].weight);
  const oEntry = breakdown.find((b) => b.dim === "O")!;
  assert.equal(oEntry.alignment, 70); // low irány: 100-30
});
