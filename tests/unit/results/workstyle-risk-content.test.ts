import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkstyleContent } from "@/lib/workstyle-content";
import { TENSION_PAIRS } from "@/lib/profile-engine";
import {
  BLOCK3_SUMMARIES,
  RISK_TEXTS,
  DEFAULT_NARRATIVE,
  COLLAB_FRICTION,
} from "@/lib/profile-content";

// A „Ahogy működsz" tartalmi bekötések guardrailje: a kockázati párok
// mitigációs tanácsa, a kiegyensúlyozott profil narratívája és a
// súrlódás-copy elérhetősége (motor-audit 2026-08).

const LOCALES = ["hu", "en"] as const;

function scores(overrides: Record<string, number>): Record<string, number> {
  const base: Record<string, number> = {
    INTE: 50, RESO: 50, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50,
  };
  return { ...base, ...overrides };
}

test("minden risk-pár contentKey-hez van RISK_TEXTS (hu+en)", () => {
  for (const pair of TENSION_PAIRS.filter((p) => p.risk)) {
    for (const lang of LOCALES) {
      assert.ok(
        RISK_TEXTS[pair.contentKey]?.[lang],
        `RISK_TEXTS.${pair.contentKey}.${lang} hiányzik`,
      );
    }
  }
});

test("kockázati pár: az összefoglaló után a mitigációs tanács is bekerül", () => {
  // RESO high + TEMP high → supportedVisibility (risk pár)
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({ RESO: 80, TEMP: 80 }), "TRITAN", lang);
    const summary = BLOCK3_SUMMARIES.supportedVisibility[lang];
    const mitigation = RISK_TEXTS.supportedVisibility[lang];
    const summaryIdx = ws.howYouWork.indexOf(summary);
    assert.ok(summaryIdx >= 0, `összefoglaló hiányzik a howYouWork-ből (${lang})`);
    assert.equal(ws.howYouWork[summaryIdx + 1], mitigation);

    assert.equal(ws.riskParts.length, 1);
    assert.equal(ws.riskParts[0].summary, summary);
    assert.equal(ws.riskParts[0].mitigation, mitigation);
    assert.ok(ws.riskParts[0].source.length > 0);
  }
});

test("nem-risk profil: riskParts üres", () => {
  const ws = buildWorkstyleContent(scores({ INTE: 80, OPEN: 80 }), "TRITAN", "hu");
  assert.deepEqual(ws.riskParts, []);
});

test("csupa közepes profil: a DEFAULT_NARRATIVE az első howYouWork-bekezdés", () => {
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({}), "TRITAN", lang);
    assert.deepEqual(ws.howYouWork, [DEFAULT_NARRATIVE[lang]]);
  }
});

test("súrlódás-copy a gyengébb jóslókból is elérhető (RESO/TEMP/OPEN)", () => {
  // Csak RESO pólusos — a csonka [THOR, ADAP, INTE] sorrendben nem lenne találat.
  const ws = buildWorkstyleContent(scores({ RESO: 80 }), "TRITAN", "hu");
  assert.equal(ws.collaboration.friction[0]?.text, COLLAB_FRICTION.RESO_high.hu);
});

test("súrlódás: a súly-sorrend első két pólusos dimenziója, legfeljebb kettő", () => {
  const ws = buildWorkstyleContent(
    scores({ THOR: 80, ADAP: 20, RESO: 80, OPEN: 80 }),
    "TRITAN",
    "hu",
  );
  assert.deepEqual(
    ws.collaboration.friction.map((f) => f.text),
    [COLLAB_FRICTION.THOR_high.hu, COLLAB_FRICTION.ADAP_low.hu],
  );
});
