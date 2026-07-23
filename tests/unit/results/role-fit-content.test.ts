import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkstyleContent, ROLE_TAGS, SOLO_ROLE_TAGS } from "@/lib/workstyle-content";
import { TENSION_PAIRS, runProfileEngine } from "@/lib/profile-engine";
import { ROLE_TEXTS, SOLO_DIM_ROLE_TEXTS, SOLO_DIM_NARRATIVES, getEnvRows } from "@/lib/profile-content";
import { tritanConfig } from "@/lib/questions/tritan";

// Szerepkör-illeszkedés tartalom-guardrail: a profil-engine TRITAN dim-kódokat
// és pár-contentKey-ket ad ki — minden kimenethez léteznie kell tartalomnak,
// különben a "Szerep-illeszkedés" szekció üresen renderel (regresszió:
// TRITAN-átnevezés után a solo-tartalmak H_/E_/... kulcson maradtak).

const TRITAN_DIMS = tritanConfig.dimensions.map((d) => d.code).filter((c) => c !== "I");
const LOCALES = ["hu", "en"] as const;

test("TRITAN dim-kódok a várt készlet", () => {
  assert.deepEqual([...TRITAN_DIMS].sort(), ["ADAP", "INTE", "OPEN", "RESO", "TEMP", "THOR"]);
});

test("minden tension-pár contentKey-hez van ROLE_TEXTS és ROLE_TAGS (hu+en)", () => {
  for (const pair of TENSION_PAIRS) {
    for (const lang of LOCALES) {
      assert.ok(ROLE_TEXTS[pair.contentKey]?.[lang], `ROLE_TEXTS.${pair.contentKey}.${lang} hiányzik`);
      assert.ok(ROLE_TAGS[lang]?.[pair.contentKey], `ROLE_TAGS.${lang}.${pair.contentKey} hiányzik`);
    }
  }
});

test("minden TRITAN dim high/low szintjéhez van solo tartalom (hu+en)", () => {
  for (const dim of TRITAN_DIMS) {
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
    assert.ok(TRITAN_DIMS.includes(pair.dimA), `ismeretlen dimA: ${pair.dimA}`);
    assert.ok(TRITAN_DIMS.includes(pair.dimB), `ismeretlen dimB: ${pair.dimB}`);
  }
});

function scores(overrides: Record<string, number>): Record<string, number> {
  const base: Record<string, number> = {};
  for (const dim of TRITAN_DIMS) base[dim] = 50;
  return { ...base, ...overrides };
}

test("pár-alapú profil: roleFit szöveg + chipek nem üresek", () => {
  // INTE high + OPEN high → responsibleInnovator (nem-risk pár)
  const ws = buildWorkstyleContent(scores({ INTE: 80, OPEN: 80 }), "TRITAN", "hu");
  assert.ok(ws.roleFit.strong.length > 0);
  assert.ok(ws.roleFit.might.length > 0);
  assert.ok(ws.roleFit.prep.length > 0);
  assert.ok((ws.roleFit.strongRoles ?? []).length > 0);
});

test("solo fallback profil (csak egy extrém dim): roleFit nem üres", () => {
  // ADAP high önmagában nem alkot nem-risk párt → topSoloDims fallback
  const engine = runProfileEngine(scores({ ADAP: 85 }), "TRITAN");
  assert.equal(engine.block6Pairs.length, 0);
  assert.ok(engine.topSoloDims.length > 0);

  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({ ADAP: 85 }), "TRITAN", lang);
    assert.ok(ws.roleFit.strong.length > 0, `solo roleFit.strong üres (${lang})`);
    assert.ok(ws.roleFit.might.length > 0, `solo roleFit.might üres (${lang})`);
    assert.ok(ws.roleFit.prep.length > 0, `solo roleFit.prep üres (${lang})`);
    assert.ok((ws.roleFit.strongRoles ?? []).length > 0, `solo chipek üresek (${lang})`);
  }
});

test("csak risk-pár profil: solo fallback ad roleFit tartalmat", () => {
  // RESO high + TEMP high → supportedVisibility (risk) — block6 üres
  const engine = runProfileEngine(scores({ RESO: 80, TEMP: 80 }), "TRITAN");
  assert.equal(engine.block6Pairs.length, 0);
  assert.ok(engine.block7Pairs.length > 0);

  const ws = buildWorkstyleContent(scores({ RESO: 80, TEMP: 80 }), "TRITAN", "hu");
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
    runProfileEngine(scores({ INTE: 90, RESO: 10, THOR: 90, TEMP: 90, OPEN: 90 }), "TRITAN").categories,
  );
  // Kultúra (INTE) és Stressztűrés (RESO) csak high/low esetén jelenik meg.
  assert.ok(extremeRows.length > mediumRows.length);
  const labels = extremeRows.map((r) => r.label.hu);
  assert.ok(labels.includes("Kultúra"));
  assert.ok(labels.includes("Stressztűrés"));
});
