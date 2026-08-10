import test from "node:test";
import assert from "node:assert/strict";
import {
  CHOICE_WEIGHTS,
  computeCareerFit,
  diversify,
  generalWorkPropensity,
  interestWeightFor,
  RANK_WEIGHTS,
} from "@/lib/career/engine";
import { getOccupations, CATALOG_VERSION } from "@/lib/career/catalog";
import {
  alphaFromItems,
  bandFor,
  blendedStandardError,
  clusterByOverlap,
  dimStandardError,
  facetStandardError,
  observerWeight,
} from "@/lib/career/psychometrics";
import {
  interestCongruence,
  interestDifferentiation,
  isCompleteRiasecVector,
} from "@/lib/career/interests";
import { feasibilityFor } from "@/lib/career/feasibility";
import { AXIS_KEYS, DIM_CODES, RIASEC_LETTERS, type OccupationFit } from "@/lib/career/types";

const balanced = { INTE: 55, RESO: 50, TEMP: 55, ADAP: 55, THOR: 60, OPEN: 60 };

// ── katalógus-integritás ────────────────────────────────────────────────────

test("katalógus: minden tétel teljes és konzisztens", () => {
  const catalog = getOccupations();
  assert.ok(catalog.length > 400, `túl kevés tétel: ${catalog.length}`);
  assert.match(CATALOG_VERSION, /^\d{4}-\d{2}-\d{2}$/);
  for (const occupation of catalog) {
    assert.ok(occupation.hu.length > 0, `${occupation.id}: nincs magyar név`);
    assert.ok(occupation.demand.length > 0, `${occupation.id}: nincs demand`);
    const weightSum = occupation.demand.reduce((sum, c) => sum + c.w, 0);
    assert.ok(weightSum > 0.8 && weightSum <= 1.05, `${occupation.id}: súlyösszeg ${weightSum}`);
    for (const component of occupation.demand) {
      assert.ok(DIM_CODES.includes(component.dim));
      assert.ok(component.target >= 0 && component.target <= 100);
      assert.ok(component.tol >= 5 && component.tol <= 40);
    }
    for (const letter of RIASEC_LETTERS) {
      assert.equal(typeof occupation.riasec[letter], "number", `${occupation.id}: hiányzó ${letter}`);
    }
    for (const axis of AXIS_KEYS) {
      const value = occupation.axes[axis];
      assert.ok(value >= -1 && value <= 1, `${occupation.id}: ${axis} = ${value}`);
    }
    for (const dim of DIM_CODES) {
      assert.equal(typeof occupation.abs[dim], "number");
    }
  }
});

test("katalógus: nincs duplikált azonosító és magyar név", () => {
  const catalog = getOccupations();
  const ids = new Set(catalog.map((o) => o.id));
  assert.equal(ids.size, catalog.length);
  const names = new Set(catalog.map((o) => o.hu.toLowerCase()));
  assert.equal(names.size, catalog.length);
});

// ── pszichometria ───────────────────────────────────────────────────────────

test("reliabilitás: több item = magasabb alfa, kisebb hiba", () => {
  assert.ok(alphaFromItems(16) > alphaFromItems(9));
  assert.ok(dimStandardError("full") < dimStandardError("short"));
  // A facet-szint MINDIG bizonytalanabb, mint a dimenzió — a v1 fordítva mutatta.
  assert.ok(facetStandardError("short") > dimStandardError("short"));
  assert.ok(facetStandardError("full") > dimStandardError("full"));
});

test("observer-súly: értékelő-számmal nő, de a self megtartja a felét", () => {
  assert.equal(observerWeight(0), 0);
  assert.ok(observerWeight(1) < observerWeight(5));
  assert.ok(observerWeight(50) <= 0.5);
  const selfSe = dimStandardError("short");
  assert.ok(blendedStandardError(selfSe, 3, observerWeight(3)) < selfSe);
  assert.equal(blendedStandardError(selfSe, 0, 0), selfSe);
});

test("sáv: a pontszám körül szimmetrikus, 0-100 közé vágva", () => {
  assert.deepEqual(bandFor(50, 8), { low: 42, high: 58 });
  assert.deepEqual(bandFor(97, 8), { low: 89, high: 100 });
  assert.deepEqual(bandFor(3, 8), { low: 0, high: 11 });
});

test("klaszterezés: az átfedő pontszámok egy csoportba kerülnek", () => {
  const make = (rank: number, rankSe: number, ready = true, tier = 1): OccupationFit =>
    ({
      rank,
      rankSe,
      se: rankSe,
      hu: `x${rank}`,
      tier,
      demandFit: rank,
      feasibility: { gap: ready ? "ready" : "degree", ready },
    }) as unknown as OccupationFit;
  const clusters = clusterByOverlap([make(90, 5), make(88, 5), make(60, 5)]);
  assert.equal(clusters.length, 2);
  assert.equal(clusters[0].length, 2);
  assert.equal(clusters[1].length, 1);

  // Klaszteren belül a megvalósíthatóság kerül előre (a pontszám-sorrend ott
  // nem értelmezhető), majd a gyakoribb (alacsonyabb tier) foglalkozás.
  const mixed = clusterByOverlap([make(90, 6, false, 1), make(88, 6, true, 2)]);
  assert.equal(mixed.length, 1);
  assert.equal(mixed[0][0].feasibility.ready, true, "az elérhető szerep kerül előre");
});

// ── érdeklődés ──────────────────────────────────────────────────────────────

test("Holland-congruence: azonos alak 100, ellentétes alacsony", () => {
  const role = { R: 20, I: 90, A: 40, S: 10, E: 30, C: 70 };
  assert.equal(interestCongruence(role, role), 100);
  const inverted = { R: 80, I: 10, A: 60, S: 90, E: 70, C: 30 };
  const score = interestCongruence(inverted, role);
  assert.ok(score !== null && score < 30, `ellentétes profil túl magas: ${score}`);
});

test("differenciáltság: lapos profil = gyenge jel", () => {
  assert.equal(interestDifferentiation({ R: 50, I: 52, A: 48, S: 51, E: 49, C: 50 }), "low");
  assert.equal(interestDifferentiation({ R: 20, I: 85, A: 40, S: 30, E: 25, C: 60 }), "ok");
  assert.equal(interestDifferentiation({ R: 20 }), null);
});

test("measured RIASEC csak HIÁNYTALAN vektorból (E4)", () => {
  // A scoreRiasec-kel AZONOS teljességi szabály: mind a hat betű kell. Ezt a
  // predikátumot használja a person.ts forrás-létrája ÉS a career-background
  // route validációja is — egy parciális, kliens-állított vektor nem mérés.
  assert.equal(isCompleteRiasecVector({ R: 60, I: 75, A: 66, S: 42, E: 48, C: 64 }), true);
  assert.equal(isCompleteRiasecVector({ R: 60, I: 75, A: 66, S: 42 }), false, "négybetűs nem mérés");
  assert.equal(isCompleteRiasecVector({ R: 60, I: 75, A: 66, S: 42, E: 48 }), false, "ötbetűs sem");
  assert.equal(isCompleteRiasecVector({}), false);
});

// ── megvalósíthatóság ───────────────────────────────────────────────────────

test("hozzáférés: a SZINT és a SZAKIRÁNY külön kérdés", () => {
  // szint megvan, de nincs szakirány-adat → nem állítjuk, hogy „elég"
  const levelOnly = feasibilityFor("higher", "higher");
  assert.equal(levelOnly.ready, true);
  assert.equal(levelOnly.state, "level-only");
  assert.equal(levelOnly.fieldMatch, null);
  assert.equal(levelOnly.licence, false, "nem szabályozott szakma nem licenc-köteles");

  // szint + egyező szakirány
  const matched = feasibilityFor("higher", "higher", ["health"], ["health", "natural_science"]);
  assert.equal(matched.state, "field-match");
  assert.equal(matched.fieldMatch, true);
  assert.equal(matched.licence, false, "a nem-specialized field-match nem licenc-köteles");

  // szint megvan, de MÁS szakirány — ez a leggyakoribb félreértés forrása
  const otherField = feasibilityFor("higher", "higher", ["economics"], ["health"]);
  assert.equal(otherField.state, "level-only");
  assert.equal(otherField.fieldMatch, false);

  // szabályozott szakma: diplomával, DE szakvizsga nélkül nem lehet belépni
  const withoutLicence = feasibilityFor("specialized", "higher", ["health"], ["health"]);
  assert.equal(withoutLicence.state, "licence-needed");
  assert.equal(withoutLicence.gap, "licence");
  assert.equal(withoutLicence.licence, true);

  // szakvizsgával és egyező szakiránnyal a SZINT és a SZAKIRÁNY megfelel
  // (state="field-match"), de a licenc-jelzés akkor sem tűnhet el: a szakma
  // engedély-/kamarai kötelezettséggel jár (E3).
  const withLicence = feasibilityFor("specialized", "specialized", ["health"], ["health"]);
  assert.equal(withLicence.state, "field-match");
  assert.equal(withLicence.licence, true, "a szabályozott szakma field-matchnél is licenc-köteles");
  assert.equal(withLicence.gap, "licence", "a gap a licenc-igenyt tukrozi, nem ready");

  // szakvizsga MÁS szakirányban nem nyit meg egy szabályozott szakmát
  const wrongLicence = feasibilityFor("specialized", "specialized", ["legal"], ["health"]);
  assert.equal(wrongLicence.state, "licence-needed");

  // a szint alatt: képzés kell
  assert.equal(feasibilityFor("vocational", "secondary").state, "training-needed");
  assert.equal(feasibilityFor("open", null).ready, true);
});

test("licenc-caveat: szabályozott szakma field-matchnél is jelzi a licencet (E3)", () => {
  // Szabályozott (specialized) szakma, amire a szint ÉS a szakirány is stimmel:
  // state="field-match", de a licenc-jelzés (flag + feasibility.licence) megmarad.
  const doctor = computeCareerFit(
    { dims: balanced, form: "short", eduLevel: "specialized", eduFields: ["health"] },
    { only: ["29-1215.00"] }, // Háziorvos — entry=specialized, eduFields=["health"]
  ).ranked[0];
  assert.ok(doctor, "nincs teszt-foglalkozás");
  assert.equal(doctor.feasibility.state, "field-match");
  assert.equal(doctor.feasibility.licence, true);
  assert.ok(
    doctor.flags.includes("licence-ready"),
    "a szabályozott szakma field-matchnél sem kapott licenc-flaget",
  );

  // Nem szabályozott (higher) szakma, szintén field-match: NINCS licenc-caveat —
  // a nem-specialized ág változatlan.
  const manager = computeCareerFit(
    { dims: balanced, form: "short", eduLevel: "higher", eduFields: ["economics"] },
    { only: ["11-1021.00"] }, // Ügyvezető — entry=higher, eduFields=["economics"]
  ).ranked[0];
  assert.ok(manager);
  assert.equal(manager.feasibility.state, "field-match");
  assert.equal(manager.feasibility.licence, false);
  assert.ok(
    !manager.flags.includes("licence-ready"),
    "nem-specialized field-match licenc-flaget kapott",
  );
});

test("katalógus: a tételek többségéhez van képzési terület", () => {
  const withFields = getOccupations().filter((occupation) => occupation.eduFields?.length);
  assert.ok(
    withFields.length / getOccupations().length > 0.7,
    `csak ${withFields.length} tételnek van szakirány-adata`,
  );
});

// ── motor ───────────────────────────────────────────────────────────────────

test("általános munkahelyi alap: C és H súlyozott átlaga", () => {
  assert.equal(generalWorkPropensity({ THOR: 80, INTE: 60 }), 72);
  assert.equal(generalWorkPropensity({}), 50);
});

test("differenciál rangsor: a profil szintje nem tolja el a sorrendet", () => {
  const low = computeCareerFit({ dims: balanced, form: "short" }, { limit: 10 });
  const raised = Object.fromEntries(
    Object.entries(balanced).map(([dim, value]) => [dim, value + 12]),
  ) as typeof balanced;
  const high = computeCareerFit({ dims: raised, form: "short" }, { limit: 10 });
  assert.deepEqual(
    high.ranked.map((f) => f.id),
    low.ranked.map((f) => f.id),
    "az egyenletesen magasabb profil ugyanazt a sorrendet kapja",
  );
  // ...az általános szint viszont IGENIS különbözik
  assert.ok(high.general > low.general);
});

test("ideal-point: a cél FÖLÖTTI eltérés is csökkenti az illeszkedést", () => {
  const occupation = getOccupations().find((o) =>
    o.demand.some((c) => c.w > 0.3 && c.target > 55 && c.target < 75),
  );
  assert.ok(occupation, "nincs alkalmas teszt-foglalkozás");
  const driver = occupation.demand.find((c) => c.w > 0.3)!;
  const onTarget = { ...balanced, [driver.dim]: driver.target } as typeof balanced;
  const wayOver = { ...balanced, [driver.dim]: 99 } as typeof balanced;
  const fitOn = computeCareerFit({ dims: onTarget, form: "short" }, { only: [occupation.id] });
  const fitOver = computeCareerFit({ dims: wayOver, form: "short" }, { only: [occupation.id] });
  const componentOn = fitOn.ranked[0].components.find((c) => c.dim === driver.dim)!;
  const componentOver = fitOver.ranked[0].components.find((c) => c.dim === driver.dim)!;
  assert.ok(
    componentOver.alignment < componentOn.alignment,
    `a túlzás nem csökkentette az illeszkedést (${componentOver.alignment} vs ${componentOn.alignment})`,
  );
  assert.equal(componentOver.position, "over");
});

test("H-padló: magas becsületesség-alázat nem büntethető, alacsony nem jutalmazható", () => {
  const occupation = getOccupations().find((o) =>
    o.demand.some((c) => c.dim === "INTE" && c.target < 45 && c.w > 0.15),
  );
  assert.ok(occupation, "nincs alacsony H-célú foglalkozás a katalógusban");
  const run = (h: number) =>
    computeCareerFit({ dims: { ...balanced, INTE: h }, form: "short" }, { only: [occupation.id] })
      .ranked[0];
  const honest = run(92);
  const opportunist = run(15);
  const componentHonest = honest.components.find((c) => c.dim === "INTE")!;
  assert.equal(componentHonest.note, "h-floor");
  assert.equal(componentHonest.alignment, 100, "a magas H nem kaphat büntetést");
  const componentOpportunist = opportunist.components.find((c) => c.dim === "INTE")!;
  assert.ok(
    componentOpportunist.alignment < componentHonest.alignment,
    "az alacsony H nem illeszkedhet jobban",
  );
  assert.ok(honest.flags.includes("h-floor"));
});

test("kétlépcsős rendezés: mért érdeklődésnél a lista érdeklődés-vezérelt", () => {
  const measured = {
    dims: balanced,
    form: "short" as const,
    interests: {
      vector: { R: 15, I: 20, A: 40, S: 30, E: 85, C: 25 },
      source: "measured" as const,
    },
    prefs: { people: 1 as const, variety: 1 as const },
  };
  const result = computeCareerFit(measured, { limit: 10 });
  assert.equal(result.meta.strategy, "interest-led");
  assert.ok(result.meta.candidatePool !== null && result.meta.candidatePool >= 20);
  // a sorrendet a személyiség adja...
  assert.ok(result.ranked.every((fit) => fit.orderedBy === "demandFit"));
  assert.deepEqual(
    result.ranked.map((fit) => fit.rank),
    result.ranked.map((fit) => fit.demandFit),
  );
  // ...de a listára csak az érdeklődéshez közeli tételek kerülnek
  const scores = result.ranked.map((fit) => fit.choiceScore ?? 0);
  assert.ok(Math.min(...scores) >= 45, `gyenge érdeklődésű tétel a listán: ${Math.min(...scores)}`);
});

test("becsült érdeklődésnél NEM indul a kétlépcsős rendezés (körkörös lenne)", () => {
  const estimated = computeCareerFit(
    {
      dims: balanced,
      form: "short",
      interests: { vector: { R: 40, I: 55, A: 50, S: 45, E: 60, C: 52 }, source: "estimated" },
    },
    { limit: 5 },
  );
  assert.equal(estimated.meta.strategy, "composite");
  assert.ok(estimated.ranked.every((fit) => fit.orderedBy === "composite"));
});

test("scope: a bejelölt terület kemény szűrő, univerzális szerepekkel", () => {
  const interests = {
    vector: { R: 20, I: 60, A: 40, S: 30, E: 70, C: 45 },
    source: "measured" as const,
  };
  const scoped = computeCareerFit(
    { dims: balanced, form: "short", interests },
    { limit: 20, scope: ["tech"], industries: ["tech"] },
  );
  assert.equal(scoped.meta.strategy, "scoped");
  assert.ok(scoped.ranked.length > 0);
  for (const fit of scoped.ranked) {
    const occupation = getOccupations().find((o) => o.id === fit.id)!;
    const tags = occupation.industries ?? [];
    assert.ok(
      tags.length === 0 || tags.includes("tech"),
      `${fit.hu}: nem tech és nem univerzális (${tags.join(",")})`,
    );
  }
  // a sorrendet az érdeklődés adja, a személyiség nem szűr
  assert.ok(scoped.ranked.every((fit) => fit.orderedBy === "interest"));
});

// ── vétó: kizárt munka-tulajdonság = kemény szűrő ───────────────────────────

test("vétó: a children-vétó mellett SOHA nincs dadus/tanító a listában", () => {
  const result = computeCareerFit(
    { dims: balanced, form: "short", vetoes: ["children"] },
    { limit: 477, diversify: false },
  );
  const byId = new Map(getOccupations().map((o) => [o.id, o]));
  for (const fit of result.ranked) {
    const attrs = byId.get(fit.id)?.attrs ?? [];
    assert.ok(!attrs.includes("children"), `${fit.hu}: children-címkés szerep a listában`);
  }
  assert.ok((result.meta.vetoExcluded ?? 0) > 0, "a kizárt szám a metában van");
  const names = new Set(result.ranked.map((fit) => fit.hu));
  assert.ok(!names.has("Bébiszitter (dadus)"), "a dadus nem jelenhet meg");
  assert.ok(!names.has("Óvodapedagógus"));
});

test("vétó: több vétó uniója szűr, és scope mellett is érvényes", () => {
  const result = computeCareerFit(
    { dims: balanced, form: "short", vetoes: ["blood", "sales"] },
    { limit: 477, diversify: false, scope: ["health"], industries: ["health"] },
  );
  const byId = new Map(getOccupations().map((o) => [o.id, o]));
  for (const fit of result.ranked) {
    const attrs = byId.get(fit.id)?.attrs ?? [];
    assert.ok(
      !attrs.includes("blood") && !attrs.includes("sales"),
      `${fit.hu}: vétózott címkével a listában (${attrs.join(",")})`,
    );
  }
  assert.ok(result.ranked.length > 0, "a vétó nem üríthette ki a health-scope-ot");
});

test("vétó: `only` szűkítésnél (összevetés) nem lép életbe", () => {
  const dadus = getOccupations().find((o) => o.hu.startsWith("Bébiszitter"))!;
  const result = computeCareerFit(
    { dims: balanced, form: "short", vetoes: ["children"] },
    { only: [dadus.id] },
  );
  assert.equal(result.ranked.length, 1, "a kifejezetten kért összevetést nem vétózzuk el");
});

test("scope: kevés találatnál nem szűrünk, hanem jelezzük a bővítést", () => {
  const widened = computeCareerFit(
    { dims: balanced, form: "short" },
    { limit: 10, scope: ["nincs-ilyen-iparag"], industries: ["nincs-ilyen-iparag"] },
  );
  assert.equal(widened.meta.scopeWidened, true);
  assert.notEqual(widened.meta.strategy, "scoped");
  assert.ok(widened.ranked.length > 0, "a padló nem hagyhat üres listát");
});

test("scope: több bejelölt terület metszete kiemelést kap", () => {
  const both = computeCareerFit(
    { dims: balanced, form: "short" },
    { limit: 40, scope: ["tech", "health"], industries: ["tech", "health"] },
  );
  const intersect = both.ranked.filter((fit) => fit.flags.includes("industry-intersect"));
  assert.ok(intersect.length > 0, "nincs metszet-tétel (pl. eü. informatikus)");
  for (const fit of intersect) {
    const occupation = getOccupations().find((o) => o.id === fit.id)!;
    const tags = occupation.industries ?? [];
    assert.ok(tags.includes("tech") && tags.includes("health"));
  }
});

test("scoped: az ipari evidencia EGYSZER számít — nincs +5 és +6 kétszerezés (E2)", () => {
  const interests = {
    vector: { R: 20, I: 60, A: 40, S: 30, E: 70, C: 45 },
    source: "measured" as const,
  };
  // Egyetlen bejelölt terület (max. 1 átfedés → nincs metszet-bónusz) és nincs
  // szakirány-adat (nincs field-match bónusz): a rangnak a tiszta, bónusz-mentes
  // választási alappal kell egyeznie. Preferencia nélkül ez maga az érdeklődés.
  const scoped = computeCareerFit(
    { dims: balanced, form: "short", interests },
    { limit: 20, scope: ["tech"], industries: ["tech"] },
  );
  assert.equal(scoped.meta.strategy, "scoped");
  assert.ok(scoped.ranked.length > 0);
  for (const fit of scoped.ranked) {
    // A régi kód a choiceScore +5 INDUSTRY_PICK_BONUS-át örökölte a tech-címkés
    // tételekre (rank = interest + 5). A javítás után az alap bónusz-mentes.
    assert.equal(fit.interest !== null, true, `${fit.hu}: hiányzó érdeklődés-pontszám`);
    assert.equal(fit.rank, fit.interest, `${fit.hu}: az ipari bónusz kétszer számított`);
  }
});

test("scoped: lapos érdeklődésnél a Holland-súly feleződik, nem nyers 0.35 (E2)", () => {
  const flatInterest = {
    vector: { R: 50, I: 51, A: 49, S: 50, E: 52, C: 48 }, // low differentiation
    source: "measured" as const,
  };
  const scoped = computeCareerFit(
    {
      dims: balanced,
      form: "short",
      interests: flatInterest,
      prefs: { people: 1, structure: 1 },
    },
    { limit: 20, scope: ["tech"], industries: ["tech"] },
  );
  assert.equal(scoped.meta.strategy, "scoped");
  // A scoped ág is alkalmazza a low-differentiation felezőt (megkerülte a
  // canUseInterestLed kaput): a meta a felezett súlyt hordozza.
  assert.equal(scoped.meta.interestWeight, interestWeightFor("measured") * 0.5);
  // A scoped rang a felezett érdeklődés-súlyú, bónusz-mentes alapot használja.
  // Egy scope + nincs szakirány → nincs metszet/field bónusz, a rang = alap.
  const wi = scoped.meta.interestWeight;
  let checked = 0;
  for (const fit of scoped.ranked) {
    if (fit.interest === null || fit.preference === null) continue;
    const expected = Math.min(
      100,
      Math.round(
        (fit.interest * wi + fit.preference * CHOICE_WEIGHTS.preference) /
          (wi + CHOICE_WEIGHTS.preference),
      ),
    );
    assert.equal(fit.rank, expected, `${fit.hu}: a scoped rang nem a felezett súlyú alap`);
    checked += 1;
  }
  assert.ok(checked > 0, "nem volt teljes komponensű scoped tétel az ellenőrzéshez");
});

test("kompozit: az érdeklődés és a preferencia módosítja a rangsort, a demandFit nem változik", () => {
  const base = computeCareerFit({ dims: balanced, form: "short" }, { limit: 20 });
  const withInterest = computeCareerFit(
    {
      dims: balanced,
      form: "short",
      interests: { vector: { R: 85, I: 60, A: 20, S: 25, E: 30, C: 55 }, source: "measured" },
    },
    { limit: 20, strategy: "composite" },
  );
  const sample = base.ranked[0];
  const same = withInterest.ranked.find((f) => f.id === sample.id);
  if (same) assert.equal(same.demandFit, sample.demandFit);
  assert.notDeepEqual(
    withInterest.ranked.map((f) => f.id),
    base.ranked.map((f) => f.id),
    "a mért érdeklődés nem hatott a rangsorra",
  );
  assert.equal(withInterest.interestSource, "measured");
});

test("a rangsor-súlyok sorrendje: kimondott szándék → személyiség → érdeklődés", () => {
  // Ez a termék egyik alapdöntése (2026-07-31), nem hangolási részlet: a
  // preferencia az EGYETLEN komponens, amit a felhasználó kimondott — a
  // személyiség mért becslés, a Holland-kód sokszor maga is becsült.
  assert.ok(
    RANK_WEIGHTS.preference > RANK_WEIGHTS.demand,
    "a kimondott preferencia nem erősebb a személyiségnél",
  );
  // Az érdeklődés súlya forrás-függő (interestWeightFor) — a legerősebb (mért)
  // forma sem előzheti meg a személyiséget, és a lépcső monoton csökken.
  assert.ok(
    RANK_WEIGHTS.demand >= interestWeightFor("measured"),
    "a személyiség nem erősebb az érdeklődésnél",
  );
  assert.ok(interestWeightFor("measured") > interestWeightFor("tags"));
  assert.ok(interestWeightFor("tags") > interestWeightFor("estimated"));
});

test("meta.interestWeight: a közölt súly azonos a rangsorban ténylegesen használttal", () => {
  const interests = {
    vector: { R: 85, I: 60, A: 20, S: 25, E: 30, C: 55 },
    source: "measured" as const,
  };
  const result = computeCareerFit(
    { dims: balanced, form: "short", interests, prefs: { people: 1 } },
    { limit: 10, strategy: "composite" },
  );
  assert.equal(result.meta.interestWeight, interestWeightFor("measured"));
  // Rekonstruáljuk a rangot a meta-súlyból — ha a motor belül más súllyal
  // számolna, az itt eltérést adna (a UI ezt a meta-értéket mutatja).
  const fit = result.ranked.find(
    (f) => f.interest !== null && f.preference !== null && !f.flags.includes("industry-pick"),
  );
  assert.ok(fit, "nincs teljes komponensű tétel a rangsorban");
  const wi = result.meta.interestWeight;
  const weightSum = RANK_WEIGHTS.demand + wi + RANK_WEIGHTS.preference;
  const expected = Math.min(
    100,
    Math.round(
      (fit.demandFit * RANK_WEIGHTS.demand +
        (fit.interest ?? 0) * wi +
        (fit.preference ?? 0) * RANK_WEIGHTS.preference) /
        weightSum,
    ),
  );
  assert.equal(fit.rank, expected);

  // Lapos érdeklődés-profilnál a súly feleződik — a metának EZT kell mutatnia.
  const flat = computeCareerFit(
    {
      dims: balanced,
      form: "short",
      interests: { vector: { R: 50, I: 51, A: 49, S: 50, E: 52, C: 48 }, source: "measured" },
    },
    { limit: 5 },
  );
  assert.equal(flat.meta.interestWeight, interestWeightFor("measured") * 0.5);

  // Érdeklődés-adat nélkül a súly nulla.
  const none = computeCareerFit({ dims: balanced, form: "short" }, { limit: 5 });
  assert.equal(none.meta.interestWeight, 0);
});

test("preferencia nélkül a másik két komponens viszi a rangsort", () => {
  // A központba helyezés nem büntetheti azt, aki egy tengelyt sem állított be:
  // a súlyok a MEGLÉVŐ komponensekre normálódnak újra.
  const withoutPrefs = computeCareerFit({ dims: balanced, form: "short" });
  assert.ok(withoutPrefs.ranked.length > 0, "üres rangsor preferencia nélkül");
  for (const fit of withoutPrefs.ranked) {
    assert.equal(fit.preference, null, `${fit.hu}: preferencia-pontszám beállítás nélkül`);
    assert.ok(fit.rank > 0, `${fit.hu}: nulla rang preferencia nélkül`);
  }
});

test("lapos érdeklődés-profil: gyengébb súllyal számít", () => {
  const flat = computeCareerFit(
    {
      dims: balanced,
      form: "short",
      interests: { vector: { R: 50, I: 51, A: 49, S: 50, E: 52, C: 48 }, source: "measured" },
    },
    { limit: 5 },
  );
  assert.equal(flat.interestDifferentiation, "low");
});

test("diverzifikálás: egy ISCO-alcsoportból legfeljebb kettő", () => {
  const result = computeCareerFit({ dims: balanced, form: "short" }, { limit: 12 });
  const counts = new Map<string, number>();
  for (const fit of result.ranked.slice(0, 12)) {
    const family = (fit.isco ?? "").slice(0, 2);
    counts.set(family, (counts.get(family) ?? 0) + 1);
  }
  const worst = Math.max(...counts.values());
  assert.ok(worst <= 3, `egy szakmacsalád túl sokszor szerepel: ${worst}`);
  // A diverzifikált lista is RANG-MONOTON (E1): a családonkénti sapka nem
  // tolhat magasabb rangú tételt egy alacsonyabb mögé.
  for (let i = 1; i < result.ranked.length; i += 1) {
    assert.ok(
      result.ranked[i - 1].rank >= result.ranked[i].rank,
      `a diverzifikált rangsor nem monoton: ${result.ranked.map((f) => f.rank).join(",")}`,
    );
  }
});

test("diverzifikálás: a családonkénti sapka nem töri meg a rang-monotonitást (E1)", () => {
  // Két családból (X, Y) építünk rangsort úgy, hogy a sapka (perFamily=2) X
  // magas rangú tételeit overflow-ba tolja, és egy alacsonyabb rangú Y-t vesz
  // be helyettük. A régi `[...picked, ...overflow]` az overflow-ba került magas
  // rangú X-et az alacsony Y MÖGÉ fűzte → a clusterByOverlap negatív gapet
  // számolt, és az X a legalsó (Y-vezette) klaszterbe olvadt.
  const make = (id: string, family: string, rank: number): OccupationFit =>
    ({
      id,
      hu: id,
      family,
      rank,
      rankSe: 1,
      se: 1,
      demandFit: rank,
      tier: 1,
      feasibility: { ready: true },
    }) as unknown as OccupationFit;
  const sorted = [
    make("X1", "X", 95),
    make("X2", "X", 90),
    make("X3", "X", 85), // sapka miatt overflow
    make("Y1", "Y", 60), // alacsonyabb, de a sapka miatt a picked-be kerül
    make("X4", "X", 55),
  ];
  const out = diversify(sorted, 4, 2);

  // 1) a visszaadott lista rang-monoton
  for (let i = 1; i < out.length; i += 1) {
    assert.ok(
      out[i - 1].rank >= out[i].rank,
      `nem monoton: ${out.map((f) => f.rank).join(",")}`,
    );
  }
  // 2) a diverzitás-szándék megmaradt: limit-feltöltésnél a maradékból a
  //    LEGMAGASABB rangú jön (X3=85), nem a legalsó (X4=55).
  assert.ok(out.some((f) => f.id === "X3"), "a feltöltés nem a legmagasabb rangú maradékot vette");
  assert.ok(!out.some((f) => f.id === "X4"), "a limit fölötti alacsony tétel bekerült");

  // 3) a klaszterezés ép: egyetlen klaszter-tag rangja sem előzi meg a vezetőét
  const clusters = clusterByOverlap(out);
  for (const cluster of clusters) {
    const leaderRank = cluster[0].rank;
    for (const fit of cluster) {
      assert.ok(fit.rank <= leaderRank, `magas rangú (${fit.rank}) tétel az alsó klaszterben`);
    }
  }
});

test("readyOnly: csak a végzettséggel elérhető szerepek maradnak", () => {
  const result = computeCareerFit(
    { dims: balanced, form: "short", eduLevel: "secondary" },
    { limit: 15, readyOnly: true },
  );
  assert.ok(result.ranked.length > 0);
  assert.ok(result.ranked.every((f) => f.feasibility.ready));
});

test("observer: az értékelők számával csökken a hibasáv", () => {
  const solo = computeCareerFit(
    { dims: balanced, form: "short", observer: { dims: { THOR: 70 }, raterCount: 1 } },
    { limit: 3 },
  );
  const many = computeCareerFit(
    { dims: balanced, form: "short", observer: { dims: { THOR: 70 }, raterCount: 6 } },
    { limit: 3 },
  );
  assert.ok(many.meta.dimSe < solo.meta.dimSe);
  assert.ok(many.observerWeight > solo.observerWeight);
});

test("rövid forma szélesebb sávot ad, mint a teljes", () => {
  const short = computeCareerFit({ dims: balanced, form: "short" }, { limit: 1 });
  const full = computeCareerFit({ dims: balanced, form: "full" }, { limit: 1 });
  assert.ok(full.meta.dimSe < short.meta.dimSe);
  assert.ok(full.ranked[0].se < short.ranked[0].se);
});

test("hiányzó dimenziók: üres profil nem dob, üres listát ad", () => {
  const result = computeCareerFit({ dims: {}, form: "short" }, { limit: 5 });
  assert.equal(result.ranked.length, 0);
  assert.equal(result.clusters.length, 0);
});

test("klaszterek lefedik a rangsort, és sorrendben csökkennek", () => {
  const result = computeCareerFit(
    { dims: balanced, form: "short", prefs: { people: 1, variety: 1 } },
    { limit: 12 },
  );
  assert.equal(
    result.clusters.reduce((sum, cluster) => sum + cluster.length, 0),
    result.ranked.length,
  );
  const leaders = result.clusters.map((cluster) => cluster[0].rank);
  for (let i = 1; i < leaders.length; i += 1) {
    assert.ok(leaders[i - 1] > leaders[i], "a klaszter-vezetők nem csökkenő sorrendben vannak");
  }
});
