import test from "node:test";
import assert from "node:assert/strict";
import { computeCareerFit } from "@/lib/career/engine";
import { getOccupations } from "@/lib/career/catalog";
import {
  calibrateFeedback,
  ownOccupationPercentile,
  runKnownGroups,
  wilsonLowerBound,
} from "@/lib/career/calibration";
import { DIM_CODES, type DimCode, type PersonInput } from "@/lib/career/types";

// F3 — a motor viselkedésének regressziós korlátai. Ezek a tesztek nem azt
// mondják meg, hogy a modell IGAZ-e (azt csak valódi adat mondhatja meg), hanem
// hogy nem torzít szisztematikusan, és hogy a validációs számítások helyesek.

/** Determinisztikus ál-véletlen, hogy a teszt ne legyen flaky. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomProfile(random: () => number): Partial<Record<DimCode, number>> {
  const profile: Partial<Record<DimCode, number>> = {};
  for (const dim of DIM_CODES) {
    // normál-szerű eloszlás 6 egyenletes összegéből
    let sum = 0;
    for (let i = 0; i < 6; i += 1) sum += random();
    profile[dim] = Math.round((sum / 6) * 100);
  }
  return profile;
}

test("fairness: nincs olyan szakmacsalád, amit a motor mindenkinek ajánl", () => {
  const random = makeRandom(20260730);
  const winners = new Map<string, number>();
  const runs = 400;
  for (let i = 0; i < runs; i += 1) {
    const person: PersonInput = { dims: randomProfile(random), form: "short" };
    for (const fit of computeCareerFit(person, { limit: 3 }).ranked) {
      const family = (fit.isco ?? "??").slice(0, 2);
      winners.set(family, (winners.get(family) ?? 0) + 1);
    }
  }
  const total = [...winners.values()].reduce((a, b) => a + b, 0);
  const worstShare = Math.max(...winners.values()) / total;
  assert.ok(
    worstShare < 0.25,
    `egy szakmacsalád a top-3-ak ${Math.round(worstShare * 100)}%-át viszi`,
  );
  assert.ok(winners.size >= 15, `csak ${winners.size} szakmacsalád jelenik meg egyáltalán`);
});

test("fairness: a katalógus nagy része elérhető valamilyen profillal", () => {
  const random = makeRandom(4242);
  const seen = new Set<string>();
  for (let i = 0; i < 300; i += 1) {
    const person: PersonInput = { dims: randomProfile(random), form: "short" };
    for (const fit of computeCareerFit(person, { limit: 12 }).ranked) seen.add(fit.id);
  }
  const coverage = seen.size / getOccupations().length;
  assert.ok(coverage > 0.35, `a katalógus csak ${Math.round(coverage * 100)}%-a jelenik meg`);
});

test("differenciálás: a rangsor tetején valódi különbség van a profilok között", () => {
  const analytical = { H: 55, E: 40, X: 30, A: 45, C: 75, O: 85 };
  const caring = { H: 85, E: 70, X: 55, A: 85, C: 60, O: 45 };
  const a = computeCareerFit({ dims: analytical, form: "short" }, { limit: 10 }).ranked;
  const b = computeCareerFit({ dims: caring, form: "short" }, { limit: 10 }).ranked;
  const overlap = a.filter((fit) => b.some((other) => other.id === fit.id)).length;
  assert.ok(overlap <= 3, `két ellentétes profil top-10-e ${overlap} tételben fedi egymást`);
});

test("Wilson-korlát: kis mintánál óvatos, nagy mintánál közelít az aránytól", () => {
  assert.ok(wilsonLowerBound(1, 1) < 0.3, "1/1 nem lehet erős bizonyíték");
  assert.ok(wilsonLowerBound(90, 100) > 0.8);
  assert.ok(wilsonLowerBound(90, 100) < 0.9);
  assert.equal(wilsonLowerBound(0, 0), 0);
});

test("kalibráció: aggregál, és csak elég mintánál jelez véletlen alatti szerepet", () => {
  const rows = [
    ...Array.from({ length: 8 }, () => ({
      occupationId: "15-1252.00",
      verdict: "inaccurate" as const,
      fitScore: 80,
    })),
    { occupationId: "29-1141.00", verdict: "accurate" as const, fitScore: 70 },
    { occupationId: "29-1141.00", verdict: "inaccurate" as const, fitScore: 60 },
  ];
  const result = calibrateFeedback(rows);
  const dev = result.find((row) => row.occupationId === "15-1252.00")!;
  const nurse = result.find((row) => row.occupationId === "29-1141.00")!;
  assert.equal(dev.total, 8);
  assert.equal(dev.hitRate, 0);
  assert.ok(dev.belowChance, "8/8 nem-találó esetén jeleznie kell");
  assert.equal(nurse.total, 2);
  assert.ok(!nurse.belowChance, "2 szavazatból nem vonunk le következtetést");
});

test("known-groups: a validáció a TELJES katalóguson fut, nem a motor saját pool-ján (körkörösség)", () => {
  // Mért érdeklődésnél az alapértelmezett ág (interest-led) 30–60 tételre
  // csonkolja a rangsort. Ha a validáció ezen futna, egy pool-on kívüli saját
  // foglalkozás null-ként kiesne, a percentilis pedig egy ELŐSZŰRT halmazon
  // számolódna — a nevező pont azokból a súlyokból származna, amiket validálunk.
  const person: PersonInput = {
    dims: { H: 55, E: 45, X: 70, A: 60, C: 55, O: 50 },
    form: "short",
    interests: {
      vector: { R: 15, I: 20, A: 40, S: 30, E: 85, C: 25 },
      source: "measured",
    },
    prefs: { people: 1, variety: 1 },
  };
  const defaultRun = computeCareerFit(person, { limit: 10_000, diversify: false });
  assert.equal(defaultRun.meta.strategy, "interest-led");
  assert.ok(
    defaultRun.ranked.length < getOccupations().length,
    "az interest-led ág nem csonkolt — a teszt előfeltétele sérült",
  );
  const inPool = new Set(defaultRun.ranked.map((fit) => fit.id));
  const outsider = getOccupations().find((occupation) => !inPool.has(occupation.id));
  assert.ok(outsider, "nincs pool-on kívüli foglalkozás");

  // A pool-on kívüli saját foglalkozás NEM eshet ki: a kényszerített kompozit
  // futásban valódi percentilist kap.
  const percentile = ownOccupationPercentile(person, outsider.id);
  assert.notEqual(percentile, null, "a pool-on kívüli saját szerep kiesett (körkörös validáció)");
  assert.ok(percentile !== null && percentile >= 0 && percentile <= 100);

  // A vétó sem dobhat ki esetet: a validációs futás a vétókat is figyelmen
  // kívül hagyja (a saját szerep kizárása a statisztikát javítaná).
  const babysitter = getOccupations().find((occupation) =>
    (occupation.attrs ?? []).includes("children"),
  );
  assert.ok(babysitter, "nincs children-címkés foglalkozás");
  const vetoed = ownOccupationPercentile(
    { ...person, vetoes: ["children"] },
    babysitter.id,
  );
  assert.notEqual(vetoed, null, "a vétózott saját szerep kiesett a validációból");

  // Katalóguson kívüli azonosító (adathiba) viszont továbbra sem eset.
  assert.equal(ownOccupationPercentile(person, "no-such-occupation"), null);
});

test("known-groups: a saját foglalkozás percentilise számolható, üres bemenetnél nulla", () => {
  const empty = runKnownGroups([]);
  assert.equal(empty.n, 0);

  // Szintetikus eset: a profilt a szerep cél-értékeire állítjuk, így a saját
  // foglalkozásnak a rangsor tetején kell lennie.
  const occupation = getOccupations().find((o) => o.demand.length >= 3)!;
  const dims: Partial<Record<DimCode, number>> = {};
  for (const dim of DIM_CODES) dims[dim] = 50;
  for (const component of occupation.demand) dims[component.dim] = component.target;
  const result = runKnownGroups([
    { occupationId: occupation.id, person: { dims, form: "short" } },
  ]);
  assert.equal(result.n, 1);
  assert.ok(
    result.meanPercentile > 50,
    `a cél-profilra állított személy sem került a felső felébe (${result.meanPercentile})`,
  );
});
