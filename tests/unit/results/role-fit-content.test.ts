import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkstyleContent, ROLE_TAGS, SOLO_ROLE_TAGS } from "@/lib/workstyle-content";
import { TENSION_PAIRS, runProfileEngine } from "@/lib/profile-engine";
import {
  ROLE_TEXTS,
  SOLO_DIM_ROLE_TEXTS,
  SOLO_DIM_NARRATIVES,
  getEnvRows,
  ENV_ROW_LABELS,
  ENV_ROW_POLES,
  ENV_ROW_SHORT_LABELS,
  resolveEnvRowKey,
  resolveEnvLevel,
  type EnvRowKey,
} from "@/lib/profile-content";
import { tritanConfig } from "@/lib/questions/tritan";

// Szerepkör-illeszkedés tartalom-guardrail: a profil-engine TRITAN dim-kódokat
// és pár-contentKey-ket ad ki — minden kimenethez léteznie kell tartalomnak,
// különben a "Szerep-illeszkedés" szekció üresen renderel (regresszió:
// a kód-átnevezés után a solo-tartalmak H_/E_/... kulcson maradtak).

const HEXACO_DIMS = tritanConfig.dimensions.map((d) => d.code).filter((c) => c !== "I");
const LOCALES = ["hu", "en"] as const;

test("a dim-kódok a kanonikus HEXACO-készlet", () => {
  assert.deepEqual([...HEXACO_DIMS].sort(), ["A", "C", "E", "H", "O", "X"]);
});

test("minden tension-pár contentKey-hez van ROLE_TEXTS és ROLE_TAGS (hu+en)", () => {
  for (const pair of TENSION_PAIRS) {
    for (const lang of LOCALES) {
      assert.ok(ROLE_TEXTS[pair.contentKey]?.[lang], `ROLE_TEXTS.${pair.contentKey}.${lang} hiányzik`);
      assert.ok(ROLE_TAGS[lang]?.[pair.contentKey], `ROLE_TAGS.${lang}.${pair.contentKey} hiányzik`);
    }
  }
});

test("minden HEXACO dim high/low szintjéhez van solo tartalom (hu+en)", () => {
  for (const dim of HEXACO_DIMS) {
    for (const level of ["high", "low"] as const) {
      const key = `${dim}_${level}`;
      for (const lang of LOCALES) {
        assert.ok(SOLO_DIM_ROLE_TEXTS[key]?.[lang], `SOLO_DIM_ROLE_TEXTS.${key}.${lang} hiányzik`);
        assert.ok(SOLO_DIM_NARRATIVES[key]?.[lang], `SOLO_DIM_NARRATIVES.${key}.${lang} hiányzik`);
        assert.ok(SOLO_ROLE_TAGS[lang]?.[key], `SOLO_ROLE_TAGS.${lang}.${key} hiányzik`);
      }
    }
  }
});

test("a tension-párok dim-kódjai TRITAN kódok", () => {
  for (const pair of TENSION_PAIRS) {
    assert.ok(HEXACO_DIMS.includes(pair.dimA), `ismeretlen dimA: ${pair.dimA}`);
    assert.ok(HEXACO_DIMS.includes(pair.dimB), `ismeretlen dimB: ${pair.dimB}`);
  }
});

function scores(overrides: Record<string, number>): Record<string, number> {
  const base: Record<string, number> = {};
  for (const dim of HEXACO_DIMS) base[dim] = 50;
  return { ...base, ...overrides };
}

test("pár-alapú profil: roleFit szöveg + chipek nem üresek", () => {
  // H high + O high → responsibleInnovator (nem-risk pár)
  const ws = buildWorkstyleContent(scores({ H: 80, O: 80 }), "TRITAN", "hu");
  assert.ok(ws.roleFit.strong.length > 0);
  assert.ok(ws.roleFit.might.length > 0);
  assert.ok(ws.roleFit.prep.length > 0);
  assert.ok((ws.roleFit.strongRoles ?? []).length > 0);
});

test("solo fallback profil (csak egy extrém dim): roleFit nem üres", () => {
  // A high önmagában nem alkot nem-risk párt → topSoloDims fallback
  const engine = runProfileEngine(scores({ A: 85 }), "TRITAN");
  assert.equal(engine.block6Pairs.length, 0);
  assert.ok(engine.topSoloDims.length > 0);

  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({ A: 85 }), "TRITAN", lang);
    assert.ok(ws.roleFit.strong.length > 0, `solo roleFit.strong üres (${lang})`);
    assert.ok(ws.roleFit.might.length > 0, `solo roleFit.might üres (${lang})`);
    assert.ok(ws.roleFit.prep.length > 0, `solo roleFit.prep üres (${lang})`);
    assert.ok((ws.roleFit.strongRoles ?? []).length > 0, `solo chipek üresek (${lang})`);
  }
});

test("csak nem-feloldás pár profil: solo fallback ad roleFit tartalmat", () => {
  // E high + X high → supportedVisibility. A tábla „risk"-nek deklarálja, a
  // valencia-kapu viszont „note"-ra szelídíti (fordított skála) – a
  // feloldás-slot (block6) így is üres, tehát a solo fallback fut.
  const engine = runProfileEngine(scores({ E: 80, X: 80 }), "TRITAN");
  assert.equal(engine.block6Pairs.length, 0);
  assert.equal(engine.block7Pairs.length, 0);
  assert.ok(engine.notePairs.length > 0);

  const ws = buildWorkstyleContent(scores({ E: 80, X: 80 }), "TRITAN", "hu");
  assert.ok(ws.roleFit.strong.length > 0);
});

test("csupa közepes profil: default roleFit szöveg, nem üres szekció", () => {
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({}), "TRITAN", lang);
    assert.ok(ws.roleFit.strong.length > 0, `default roleFit üres (${lang})`);
    assert.ok(ws.roleFit.might.length > 0);
    assert.ok(ws.roleFit.prep.length > 0);
  }
});

test("env-sorok TRITAN kategóriákból dolgoznak (extrém profil extra sorokat ad)", () => {
  const mediumRows = getEnvRows(runProfileEngine(scores({}), "TRITAN").categories);
  const extremeRows = getEnvRows(
    runProfileEngine(scores({ H: 90, E: 10, C: 90, X: 90, O: 90 }), "TRITAN").categories,
  );
  // Kultúra (H) és Terhelhetőség (E) csak high/low esetén jelenik meg.
  assert.ok(extremeRows.length > mediumRows.length);
  const labels = extremeRows.map((r) => r.label.hu);
  assert.ok(labels.includes("Kultúra"));
  assert.ok(labels.includes("Terhelhetőség"));
});

const ENV_KEYS = new Set<EnvRowKey>([
  "structure",
  "social",
  "change",
  "decision",
  "culture",
  "cycle",
  "load",
]);

test("minden env-sor stabil kulcsot és szintet ad, a címke a kanonikus táblából jön", () => {
  const rows = getEnvRows(
    runProfileEngine(scores({ H: 90, E: 10, C: 90, X: 90, O: 90 }), "TRITAN").categories,
  );
  const validLevels = new Set(["low", "mid", "high"]);
  for (const row of rows) {
    assert.ok(ENV_KEYS.has(row.key), `ismeretlen env kulcs: ${row.key}`);
    assert.ok(validLevels.has(row.level), `ismeretlen env szint: ${row.level}`);
    assert.equal(row.label.hu, ENV_ROW_LABELS[row.key].hu);
    assert.equal(row.label.en, ENV_ROW_LABELS[row.key].en);
  }
});

test("minden env-kulcshoz nem üres pólus-felirat HU-ban ÉS EN-ben (EN üres-pólus regresszió ellen)", () => {
  for (const key of ENV_KEYS) {
    const pole = ENV_ROW_POLES[key];
    assert.ok(pole, `nincs pólus a(z) ${key} kulcshoz`);
    for (const lang of LOCALES) {
      assert.ok(pole.low[lang].length > 0, `${key}.low.${lang} üres`);
      assert.ok(pole.high[lang].length > 0, `${key}.high.${lang} üres`);
    }
  }
});

test("Kultúra-sor rövid címkéje a kanonikus pólust adja, nem a semleges középértéket (motor-audit v3 #11)", () => {
  // H high → értékvezérelt (high pólus). A korábbi érték-prefix parser a
  // „Értékvezérelt/Values-driven" kezdetet nem ismerte → téves „Közepes" bold.
  const valuesRow = getEnvRows(
    runProfileEngine(scores({ H: 90 }), "TRITAN").categories,
  ).find((r) => r.key === "culture");
  assert.ok(valuesRow, "hiányzik a culture sor (H high)");
  assert.equal(valuesRow.level, "high");
  for (const lang of LOCALES) {
    assert.equal(resolveEnvRowKey(valuesRow.label[lang]), "culture");
    assert.equal(resolveEnvLevel("culture", valuesRow.value[lang]), "high");
  }
  assert.equal(ENV_ROW_SHORT_LABELS.culture.high.hu, "Értékvezérelt");
  assert.equal(ENV_ROW_SHORT_LABELS.culture.high.en, "Values-driven");

  // H low → pragmatikus (low pólus) – nem eshet a semleges középre.
  const pragmaticRow = getEnvRows(
    runProfileEngine(scores({ H: 10 }), "TRITAN").categories,
  ).find((r) => r.key === "culture");
  assert.ok(pragmaticRow, "hiányzik a culture sor (H low)");
  assert.equal(pragmaticRow.level, "low");
  for (const lang of LOCALES) {
    assert.equal(resolveEnvLevel("culture", pragmaticRow.value[lang]), "low");
  }
  assert.equal(ENV_ROW_SHORT_LABELS.culture.low.hu, "Pragmatikus");
  assert.equal(ENV_ROW_SHORT_LABELS.culture.low.en, "Pragmatic");

  // A rövid címke a pólus-szókincset követi (bold szó = track-vég felirat).
  assert.equal(
    ENV_ROW_SHORT_LABELS.culture.high.hu.toLowerCase(),
    ENV_ROW_POLES.culture.high.hu,
  );
  assert.equal(
    ENV_ROW_SHORT_LABELS.culture.low.en.toLowerCase(),
    ENV_ROW_POLES.culture.low.en,
  );
});

test("minden kiadható env-sor kanonikusan visszafejthető, a rövid címke sehol nem üres", () => {
  // Az öt vezérlő dimenzió összes kategória-kombinációja – minden getEnvRows-
  // ág (és minden érték-változat) legalább egyszer kiadódik. A megjelenítő
  // pontosan ezt a visszafejtést futtatja (label→kulcs, érték→szint), tehát
  // ha itt minden feloldódik, a felületen nem lehet üres/rossz pólusú címke.
  const levels = ["high", "medium", "low"] as const;
  const seen = new Set<string>();
  for (const thor of levels)
    for (const open of levels)
      for (const temp of levels)
        for (const inte of levels)
          for (const reso of levels) {
            const rows = getEnvRows({
              C: thor,
              O: open,
              X: temp,
              H: inte,
              E: reso,
              A: "medium",
            });
            for (const row of rows) {
              for (const lang of LOCALES) {
                assert.equal(
                  resolveEnvRowKey(row.label[lang]),
                  row.key,
                  `címke nem oldódik kulccsá: ${row.label[lang]}`,
                );
                assert.equal(
                  resolveEnvLevel(row.key, row.value[lang]),
                  row.level,
                  `érték nem oldódik szintté: ${row.value[lang]}`,
                );
                const short = ENV_ROW_SHORT_LABELS[row.key][row.level][lang];
                assert.ok(
                  short.length > 0,
                  `üres rövid címke: ${row.key}.${row.level}.${lang}`,
                );
              }
              seen.add(`${row.key}:${row.level}`);
            }
          }
  // A pólusos sorok mindkét iránya előfordult a bejárásban (a fordított
  // orientációjú E/load-ot is beleértve).
  assert.ok(seen.has("culture:high") && seen.has("culture:low"));
  assert.ok(seen.has("load:low") && seen.has("load:high"));
});

test("E/terhelhetőség sor a helyes pólust jelöli: E high→low, E low→high", () => {
  // E high (érzékenyebb) → alacsonyabb terhelhetőség (low pólus, bal oldal).
  const sensitive = getEnvRows(runProfileEngine(scores({ E: 90 }), "TRITAN").categories);
  const sensitiveLoad = sensitive.find((r) => r.key === "load");
  assert.ok(sensitiveLoad, "hiányzik a load sor (E high)");
  assert.equal(sensitiveLoad.level, "low");
  assert.ok(sensitiveLoad.value.hu.startsWith("Alacsony"));
  assert.ok(sensitiveLoad.value.en.startsWith("Low"));

  // E low (érzelmileg stabil) → magas terhelhetőség (high pólus, jobb oldal).
  const resilient = getEnvRows(runProfileEngine(scores({ E: 10 }), "TRITAN").categories);
  const resilientLoad = resilient.find((r) => r.key === "load");
  assert.ok(resilientLoad, "hiányzik a load sor (E low)");
  assert.equal(resilientLoad.level, "high");
  assert.ok(resilientLoad.value.hu.startsWith("Magas"));
  assert.ok(resilientLoad.value.en.startsWith("High"));
});
