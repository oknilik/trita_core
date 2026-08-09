import test from "node:test";
import assert from "node:assert/strict";
import {
  BALANCED_WATCH_MIN,
  NEAR_POLE_HIGH,
  NEAR_POLE_LOW,
  buildSimpleSummary,
} from "@/lib/results/simple-summary";
import {
  SIMPLE_DIM_SENTENCE,
  SIMPLE_PATTERN,
  SIMPLE_POLES,
  SIMPLE_STRENGTH,
  SIMPLE_WATCH,
} from "@/lib/results/simple-copy";
import { TRITAN_DIMENSIONS, TRITAN_ORDER } from "@/lib/tritan";
import type { Locale } from "@/lib/i18n";

// Az egyszerű eredmény-nézet tartalom-guardrailjei. A nézet HAT dimenzióból
// állít elő három mondható állítást — ha bármelyik dimenzióhoz hiányzik
// szöveg, a felület némán üres blokkot renderelne.

const LOCALES: Locale[] = ["hu", "en"];

function dims(scores: Partial<Record<string, number>>, locale: Locale = "hu") {
  return TRITAN_ORDER.map((code) => ({
    code,
    label: TRITAN_DIMENSIONS[code][locale === "en" ? "en" : "hu"],
    score: scores[code] ?? 50,
  }));
}

test("minden dimenzióhoz van pólus-címke, szint-mondat és mind a három állítás-szöveg (hu+en)", () => {
  for (const code of TRITAN_ORDER) {
    for (const locale of LOCALES) {
      assert.ok(SIMPLE_POLES[code]?.low[locale], `SIMPLE_POLES.${code}.low.${locale} hiányzik`);
      assert.ok(SIMPLE_POLES[code]?.high[locale], `SIMPLE_POLES.${code}.high.${locale} hiányzik`);
      for (const tier of ["high", "mid", "low"] as const) {
        assert.ok(
          SIMPLE_DIM_SENTENCE[code]?.[tier]?.[locale],
          `SIMPLE_DIM_SENTENCE.${code}.${tier}.${locale} hiányzik`,
        );
      }
      assert.ok(SIMPLE_STRENGTH[code]?.headline[locale], `SIMPLE_STRENGTH.${code}.${locale} hiányzik`);
      assert.ok(SIMPLE_STRENGTH[code]?.body[locale]);
      assert.ok(SIMPLE_PATTERN[code]?.headline[locale], `SIMPLE_PATTERN.${code}.${locale} hiányzik`);
      assert.ok(SIMPLE_PATTERN[code]?.body[locale]);
      assert.ok(SIMPLE_WATCH[code]?.headline[locale], `SIMPLE_WATCH.${code}.${locale} hiányzik`);
      assert.ok(SIMPLE_WATCH[code]?.body[locale]);
    }
  }
});

test("a felület a kanonikus H·E·X·A·C·O sorrendet kapja", () => {
  const summary = buildSimpleSummary({ dimensions: dims({}), locale: "hu" });
  assert.deepEqual(
    summary.dimensions.map((d) => d.code),
    [...TRITAN_ORDER],
  );
  assert.deepEqual(
    summary.dimensions.map((d) => d.letter),
    ["H", "E", "X", "A", "C", "O"],
  );
});

test("az állítások forrása a legerősebb, a második és a legalacsonyabb dimenzió", () => {
  const summary = buildSimpleSummary({
    dimensions: dims({ TEMP: 81, OPEN: 78, INTE: 74, ADAP: 55, THOR: 46, RESO: 38 }),
    locale: "hu",
  });
  assert.deepEqual(
    summary.statements.map((s) => s.kind),
    ["strength", "pattern", "watch"],
  );
  assert.equal(summary.statements[0].source?.code, "TEMP");
  assert.equal(summary.statements[1].source?.code, "OPEN");
  assert.equal(summary.statements[2].source?.code, "RESO");
  assert.equal(summary.statements[0].headline, SIMPLE_STRENGTH.TEMP.headline.hu);
  assert.equal(summary.statements[2].headline, SIMPLE_WATCH.RESO.headline.hu);
});

test("azonos pontszámnál a kanonikus sorrend dönt — ugyanaz a profil ugyanazt kapja", () => {
  const first = buildSimpleSummary({ dimensions: dims({}), locale: "hu" });
  const second = buildSimpleSummary({
    // ugyanaz a hat érték, fordított bemeneti sorrendben
    dimensions: dims({}).reverse(),
    locale: "hu",
  });
  assert.deepEqual(
    first.statements.map((s) => s.source?.code),
    second.statements.map((s) => s.source?.code),
  );
  assert.equal(first.statements[0].source?.code, "INTE");
});

test("kiegyensúlyozott profilnál a figyelendő-állítás nem gyárt hamis forrást", () => {
  const summary = buildSimpleSummary({
    dimensions: dims({ TEMP: 78, OPEN: 74, INTE: 72, ADAP: 70, THOR: 68, RESO: BALANCED_WATCH_MIN }),
    locale: "hu",
  });
  const watch = summary.statements.find((s) => s.kind === "watch");
  assert.ok(watch);
  assert.equal(watch.source, null);
  assert.notEqual(watch.headline, SIMPLE_WATCH.RESO.headline.hu);
});

test("a pólus-kiemelés csak a középmezőn kívül történik", () => {
  const summary = buildSimpleSummary({
    dimensions: dims({
      INTE: NEAR_POLE_HIGH,
      RESO: NEAR_POLE_LOW,
      TEMP: 50,
      ADAP: 90,
      THOR: 10,
      OPEN: 46,
    }),
    locale: "hu",
  });
  const near = Object.fromEntries(summary.dimensions.map((d) => [d.code, d.near]));
  assert.equal(near.INTE, "high");
  assert.equal(near.RESO, "low");
  assert.equal(near.TEMP, null);
  assert.equal(near.ADAP, "high");
  assert.equal(near.THOR, "low");
  assert.equal(near.OPEN, null);
});

test("az altruizmus (I) kiegészítő skála nem kerül be az egyszerű nézetbe", () => {
  const summary = buildSimpleSummary({
    dimensions: [...dims({}), { code: "I", label: "Altruizmus", score: 80 }],
    locale: "hu",
  });
  assert.equal(summary.dimensions.length, 6);
  assert.ok(!summary.dimensions.some((d) => d.code === "I"));
  assert.ok(!summary.statements.some((s) => s.source?.code === "I"));
});

test("angol nyelven angol szöveget ad vissza", () => {
  const summary = buildSimpleSummary({
    dimensions: dims({ TEMP: 81, RESO: 38 }, "en"),
    locale: "en",
  });
  assert.equal(summary.statements[0].headline, SIMPLE_STRENGTH.TEMP.headline.en);
  assert.equal(summary.dimensions[0].poleLow, SIMPLE_POLES.INTE.low.en);
  assert.ok(summary.dimensions.every((d) => d.sentence.length > 0));
});
