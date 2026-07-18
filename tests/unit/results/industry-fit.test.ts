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

const detailOriented = { INTE: 60, RESO: 40, TEMP: 30, ADAP: 55, THOR: 90, OPEN: 45 };
const socialExplorer = { INTE: 50, RESO: 35, TEMP: 88, ADAP: 45, THOR: 40, OPEN: 80 };

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
  const calm = scoreRoleFit({ INTE: 50, RESO: 20, THOR: 70 }, risk)!;
  const reactive = scoreRoleFit({ INTE: 50, RESO: 80, THOR: 70 }, risk)!;
  assert.ok(calm.score > reactive.score);
});

test("watchDim: 55 alatti komponensnél jelez, felette null", () => {
  const qa = INDUSTRIES.find((i) => i.key === "tech")!.roles.find(
    (r) => r.key === "qa",
  )!;
  const weakH = scoreRoleFit({ THOR: 90, INTE: 30, OPEN: 40 }, qa)!;
  assert.equal(weakH.watchDim, "INTE");
  const strong = scoreRoleFit({ THOR: 90, INTE: 80, OPEN: 20 }, qa)!;
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
  assert.ok(adjusted.some((w) => w.dim === "TEMP" && w.direction === "high"));
});

test("vezetői fókusz: magas X profil pontszáma nő a dev szerepen", () => {
  const dev = INDUSTRIES.find((i) => i.key === "tech")!.roles.find((r) => r.key === "dev")!;
  const highX = { INTE: 50, RESO: 30, TEMP: 90, ADAP: 60, THOR: 70, OPEN: 60 };
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
  const balanced = { INTE: 55, RESO: 45, TEMP: 55, ADAP: 55, THOR: 60, OPEN: 55 };
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
  const lopsided = { INTE: 30, RESO: 80, TEMP: 25, ADAP: 35, THOR: 90, OPEN: 30 };
  const result = rankCareerSuggestions(lopsided, baseBackground);
  assert.ok(result.developDims.length <= 2);
});

test("explainRoleFit: súly szerint rendezett, alignment konzisztens", () => {
  const qa = INDUSTRIES.find((i) => i.key === "tech")!.roles.find((r) => r.key === "qa")!;
  const breakdown = explainRoleFit({ THOR: 80, INTE: 60, OPEN: 30 }, qa);
  assert.equal(breakdown.length, 3);
  assert.ok(breakdown[0].weight >= breakdown[1].weight);
  const oEntry = breakdown.find((b) => b.dim === "OPEN")!;
  assert.equal(oEntry.alignment, 70); // low irány: 100-30
});
