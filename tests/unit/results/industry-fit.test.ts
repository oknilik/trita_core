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

// ── Karrier-modul felújítás (2026-07-29): facet, sáv, RIASEC, vezetői közeg ──

test("FACET_REFINEMENTS: súlyok 1-re összegződnek, kódok validak", async () => {
  const { FACET_REFINEMENTS, INDUSTRIES: inds } = await import("@/lib/industry-fit");
  const { TRITAN_FACETS } = await import("@/lib/tritan");
  const validFacets = new Set([...Object.keys(TRITAN_FACETS), "altruism"]);
  const roleKeys = new Set(inds.flatMap((i) => i.roles.map((r) => r.key)));
  for (const [roleKey, weights] of Object.entries(FACET_REFINEMENTS)) {
    assert.ok(roleKeys.has(roleKey), `ismeretlen szerep: ${roleKey}`);
    const total = weights.reduce((sum, w) => sum + w.weight, 0);
    assert.ok(Math.abs(total - 1) < 0.001, `${roleKey} súlyösszeg: ${total}`);
    for (const w of weights) {
      if (w.facet) assert.ok(validFacets.has(w.facet), `${roleKey}: érvénytelen facet ${w.facet}`);
    }
  }
});

test("facet-pontszám felülírja a dimenzió-átlagot a finomított szerepeknél", () => {
  const dev = INDUSTRIES.find((i) => i.key === "tech")!.roles.find((r) => r.key === "dev")!;
  // Ugyanaz a C-átlag (70), de az egyiknél a perfekcionizmus viszi (90),
  // a másiknál a szorgalom (a perfekcionizmus gyenge, 50).
  const scores = { INTE: 50, RESO: 50, TEMP: 40, ADAP: 50, THOR: 70, OPEN: 60 };
  const precise = scoreRoleFit(scores, dev, {
    facetScores: { perfectionism: 90, prudence: 80, inquisitiveness: 70 },
  })!;
  const sloppy = scoreRoleFit(scores, dev, {
    facetScores: { perfectionism: 50, prudence: 55, inquisitiveness: 70 },
  })!;
  assert.ok(precise.facetPrecision && sloppy.facetPrecision);
  assert.ok(precise.score > sloppy.score + 5, `${precise.score} vs ${sloppy.score}`);
  // Facet-pontszám nélkül a dim-súlyokra esik vissza
  const fallback = scoreRoleFit(scores, dev)!;
  assert.equal(fallback.facetPrecision, false);
});

test("altruizmus beszámít a segítő szerepeknél", () => {
  const care = INDUSTRIES.find((i) => i.key === "health")!.roles.find((r) => r.key === "care")!;
  const scores = { INTE: 50, RESO: 60, TEMP: 45, ADAP: 65, THOR: 55, OPEN: 50 };
  const helper = scoreRoleFit(scores, care, {
    facetScores: { patience: 65, sentimentality: 60, diligence: 55, altruism: 95 },
  })!;
  const nonHelper = scoreRoleFit(scores, care, {
    facetScores: { patience: 65, sentimentality: 60, diligence: 55, altruism: 30 },
  })!;
  assert.ok(helper.score > nonHelper.score + 8, `${helper.score} vs ${nonHelper.score}`);
});

test("konfidencia-sáv: rövid forma szélesebb, observer szűkíti", async () => {
  const { computeFitBand } = await import("@/lib/industry-fit");
  const short = computeFitBand(70, { form: "short" });
  const full = computeFitBand(70, { form: "full" });
  const backed = computeFitBand(70, { form: "short", observerBacked: true });
  assert.deepEqual(short, { low: 62, high: 78 });
  assert.deepEqual(full, { low: 65, high: 75 });
  assert.deepEqual(backed, { low: 64, high: 76 });
  // Skála-határ levágás
  assert.equal(computeFitBand(97, { form: "short" }).high, 100);
});

test("RIASEC: szerep-kód létezik, user-becslés determinisztikus, bónusz rangsorol", async () => {
  const { roleRiasec, estimateUserRiasec } = await import("@/lib/industry-fit");
  assert.equal(roleRiasec("tech", "dev"), "IR");
  assert.equal(roleRiasec("health", "care"), "SI"); // iparági default
  const letters = estimateUserRiasec(socialExplorer, { people: 1, creation: 1 });
  assert.equal(letters.length, 2);
  assert.ok(letters.includes("E") || letters.includes("A"), `kapott: ${letters.join(",")}`);
  const result = rankCareerSuggestions(socialExplorer, baseBackground, {
    prefs: { people: 1, creation: 1 },
  });
  assert.equal(result.userRiasec.length, 2);
  for (const s of result.suggestions) {
    assert.ok(typeof s.riasec === "string");
    assert.ok(s.riasecOverlap >= 0 && s.riasecOverlap <= 2);
  }
});

test("vezetői közeg: minden iparághoz van kontextus", async () => {
  const { INDUSTRY_LEADER_CONTEXT, INDUSTRIES: inds } = await import("@/lib/industry-fit");
  for (const industry of inds) {
    assert.ok(INDUSTRY_LEADER_CONTEXT[industry.key], `hiányzó vezető-kontextus: ${industry.key}`);
  }
});

test("explainRoleFit facet-tudatos: facet-komponens jelölve", () => {
  const dev = INDUSTRIES.find((i) => i.key === "tech")!.roles.find((r) => r.key === "dev")!;
  const scores = { INTE: 50, RESO: 50, TEMP: 40, ADAP: 50, THOR: 70, OPEN: 60 };
  const breakdown = explainRoleFit(scores, dev, {
    facetScores: { perfectionism: 90, prudence: 80, inquisitiveness: 70 },
  });
  assert.ok(breakdown.some((e) => e.facet === "perfectionism"));
  assert.ok(breakdown.every((e) => e.facet === null || typeof e.userValue === "number"));
});

// ── 2. ütem: bővített katalógus + env-tengelyek + edu ────────────────────────

test("bővített katalógus: minden szerepnek van edu + env + riasec + vezető-kontextus", async () => {
  const { INDUSTRY_LEADER_CONTEXT, roleRiasec } = await import("@/lib/industry-fit");
  const eduValues = new Set(["open", "course", "vocational", "higher", "specialized"]);
  let roleCount = 0;
  for (const industry of INDUSTRIES) {
    assert.ok(INDUSTRY_LEADER_CONTEXT[industry.key], `vezető-kontextus hiányzik: ${industry.key}`);
    for (const role of industry.roles) {
      roleCount++;
      assert.ok(eduValues.has(role.edu), `${industry.key}/${role.key}: hiányzó/rossz edu`);
      assert.ok(role.env, `${role.key}: hiányzó env-profil`);
      for (const axis of ["pace", "structure", "setting"] as const) {
        const v = role.env![axis];
        assert.ok(v >= -1 && v <= 1, `${role.key}.${axis}: ${v}`);
      }
      assert.ok(roleRiasec(industry.key, role.key).length >= 1, `${role.key}: nincs riasec`);
      const total = role.weights.reduce((sum, w) => sum + w.weight, 0);
      assert.ok(Math.abs(total - 1) < 0.001, `${industry.key}/${role.key} súlyösszeg: ${total}`);
    }
  }
  assert.ok(roleCount >= 95, `szerep-szám: ${roleCount}`);
  assert.ok(INDUSTRIES.some((i) => i.key === "trades"));
  assert.ok(INDUSTRIES.some((i) => i.key === "transport"));
  assert.ok(INDUSTRIES.some((i) => i.key === "services"));
});

test("env-tengelyek beszámítanak a preferencia-egyezésbe", () => {
  const emergency = INDUSTRIES.find((i) => i.key === "health")!.roles.find((r) => r.key === "emergency")!;
  const fastLover = scorePrefMatch({ pace: 1 }, emergency);
  const calmLover = scorePrefMatch({ pace: -1 }, emergency);
  assert.ok(fastLover !== null && calmLover !== null);
  assert.ok(fastLover! > calmLover!, `${fastLover} vs ${calmLover}`);
  // Terep-preferencia: villanyszerelő (setting=1) vs fejlesztő (setting=-1)
  const electrician = INDUSTRIES.find((i) => i.key === "trades")!.roles.find((r) => r.key === "electrician")!;
  const dev = INDUSTRIES.find((i) => i.key === "tech")!.roles.find((r) => r.key === "dev")!;
  assert.ok(scorePrefMatch({ setting: 1 }, electrician)! > scorePrefMatch({ setting: 1 }, dev)!);
});

// ── 3. ütem: címkék, mért RIASEC, eduFields ─────────────────────────────────

test("resolveUserRiasec lépcső: mért > címkék > becslés", async () => {
  const { resolveUserRiasec } = await import("@/lib/industry-fit");
  const scores = { INTE: 50, RESO: 50, TEMP: 80, ADAP: 50, THOR: 50, OPEN: 50 };
  const estimated = resolveUserRiasec(scores, {}, {});
  assert.equal(estimated.source, "estimated");
  const tagged = resolveUserRiasec(scores, {}, { interestTags: ["building", "nature"] });
  assert.equal(tagged.source, "tags");
  assert.ok(tagged.letters.includes("R"), `címkés kód: ${tagged.letters.join("")}`);
  const measured = resolveUserRiasec(scores, {}, {
    interestTags: ["building"],
    riasecScores: { R: 10, I: 20, A: 95, S: 90, E: 30, C: 40 },
  });
  assert.equal(measured.source, "measured");
  assert.deepEqual(measured.letters, ["A", "S"]);
});

test("mért interest-match valódi komponensként rangsorol", async () => {
  const { measuredInterestMatch } = await import("@/lib/industry-fit");
  assert.equal(measuredInterestMatch({ I: 90, R: 70 }, "IR"), 80);
  assert.equal(measuredInterestMatch({}, "IR"), null);
  const background = {
    ...baseBackground,
    riasecScores: { R: 5, I: 10, A: 95, S: 90, E: 20, C: 15 },
  };
  const result = rankCareerSuggestions(socialExplorer, background, {});
  assert.equal(result.riasecSource, "measured");
  for (const s of result.suggestions) {
    assert.ok(typeof s.interestMatch === "number", `${s.role.key}: nincs interestMatch`);
  }
  // A/S-nehéz mért profil mellett a top-lista elején A/S-kódú szerep álljon
  assert.ok(
    result.suggestions[0].riasec.split("").some((l) => "AS".includes(l)),
    `top: ${result.suggestions[0].role.key} (${result.suggestions[0].riasec})`,
  );
});

test("címke-boost megjelöli és emeli az affin iparág szerepeit", () => {
  const background = { ...baseBackground, interestTags: ["building"] };
  const result = rankCareerSuggestions(detailOriented, background, {});
  const boosted = result.suggestions.filter((s) => s.tagBoosted);
  assert.ok(boosted.length > 0);
  for (const s of boosted) {
    assert.ok(["trades", "engineering", "transport"].includes(s.industryKey));
  }
});

test("normalizedEduFields: örökölt egyérték + több terület uniós boost", async () => {
  const { normalizedEduFields } = await import("@/lib/industry-fit");
  assert.deepEqual(
    normalizedEduFields({ ...baseBackground, eduField: "health" }),
    ["health"],
  );
  assert.deepEqual(
    normalizedEduFields({ ...baseBackground, eduField: "health", eduFields: ["arts", "trade"] }),
    ["arts", "trade"],
  );
});

test("scoreRiasec: teljes kitöltésből betűnkénti 0-100, hiányosból null", async () => {
  const { RIASEC_ITEMS, scoreRiasec } = await import("@/lib/questions/riasec");
  assert.equal(RIASEC_ITEMS.length, 30);
  const full = Object.fromEntries(RIASEC_ITEMS.map((item) => [item.id, item.letter === "A" ? 5 : 1]));
  const scores = scoreRiasec(full)!;
  assert.equal(scores.A, 100);
  assert.equal(scores.R, 0);
  assert.equal(scoreRiasec({ 1: 3 }), null);
});
