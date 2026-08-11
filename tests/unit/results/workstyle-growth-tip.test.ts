import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkstyleContent } from "@/lib/workstyle-content";
import { DIMENSION_GROWTH_TIPS } from "@/lib/profile-content";

// Fejlődési tipp / fejlődési ív kiválasztása (motor-audit v6, M4a): a
// fordított Emocionalitás (RESO) KIMARAD a „legalacsonyabb = fejlesztendő"
// választásból — egy stabil (alacsony RESO) kitöltő korábban „Fejlődési
// fókusz · Emocionalitás · alacsony" forrás-chipet kapott, pedig az alacsony
// érték ott erőforrás. A kiválasztás a legalacsonyabb NEM-RESO dimenzióra
// esik (a selectGrowthFocusItems már élő pólus-szabályának testvére).

const LOCALES = ["hu", "en"] as const;

function scores(overrides: Record<string, number>): Record<string, number> {
  const base: Record<string, number> = {
    INTE: 50, RESO: 50, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50,
  };
  return { ...base, ...overrides };
}

test("RESO a legalacsonyabb: a tipp a legalacsonyabb NEM-RESO dimenzióé", () => {
  for (const lang of LOCALES) {
    // RESO 20 a nyers minimum, de fordított skála → a 35-ös THOR a valódi
    // fejlődési terület.
    const ws = buildWorkstyleContent(scores({ RESO: 20, THOR: 35 }), "TRITAN", lang);
    assert.equal(ws.growthTip, DIMENSION_GROWTH_TIPS.THOR[lang].behavior);
    assert.ok(ws.growthPlan, "growthPlan hiányzik");
    assert.ok(
      !ws.growthPlan.source.includes(lang === "hu" ? "Emocionalitás" : "Emotionality"),
      `RESO forrás-chip a fejlődési ívben: ${ws.growthPlan.source}`,
    );
  }
});

test("csak a RESO alacsony (<40): nincs kitalált fejlődési tipp", () => {
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({ RESO: 20 }), "TRITAN", lang);
    assert.equal(ws.growthTip, undefined);
    assert.equal(ws.growthPlan, undefined);
  }
});

test("nem-RESO alacsony dimenzió: a viselkedés változatlan (regresszió-őr)", () => {
  const ws = buildWorkstyleContent(scores({ THOR: 30 }), "TRITAN", "hu");
  assert.equal(ws.growthTip, DIMENSION_GROWTH_TIPS.THOR.hu.behavior);
  assert.ok(ws.growthPlan?.source.includes("Lelkiismeretesség"));
});

test("kiegyensúlyozott profil (minden ≥40): továbbra sincs tipp", () => {
  const ws = buildWorkstyleContent(scores({}), "TRITAN", "hu");
  assert.equal(ws.growthTip, undefined);
  assert.equal(ws.growthPlan, undefined);
});
