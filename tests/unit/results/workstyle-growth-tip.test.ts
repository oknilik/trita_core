import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkstyleContent } from "@/lib/workstyle-content";
import { DIMENSION_GROWTH_TIPS } from "@/lib/profile-content";

// Fejlődési tipp / fejlődési ív kiválasztása (motor-audit v6, M4a): a
// fordított Emocionalitás (E) KIMARAD a „legalacsonyabb = fejlesztendő"
// választásból — egy stabil (alacsony E) kitöltő korábban „Fejlődési
// fókusz · Emocionalitás · alacsony" forrás-chipet kapott, pedig az alacsony
// érték ott erőforrás. A kiválasztás a legalacsonyabb NEM-E dimenzióra
// esik (a selectGrowthFocusItems már élő pólus-szabályának testvére).

const LOCALES = ["hu", "en"] as const;

function scores(overrides: Record<string, number>): Record<string, number> {
  const base: Record<string, number> = {
    H: 50, E: 50, X: 50, A: 50, C: 50, O: 50,
  };
  return { ...base, ...overrides };
}

test("E a legalacsonyabb: a tipp a legalacsonyabb NEM-E dimenzióé", () => {
  for (const lang of LOCALES) {
    // E 20 a nyers minimum, de fordított skála → a 35-ös C a valódi
    // fejlődési terület.
    const ws = buildWorkstyleContent(scores({ E: 20, C: 35 }), "TRITAN", lang);
    assert.equal(ws.growthTip, DIMENSION_GROWTH_TIPS.C[lang].behavior);
    assert.ok(ws.growthPlan, "growthPlan hiányzik");
    assert.ok(
      !ws.growthPlan.source.includes(lang === "hu" ? "Emocionalitás" : "Emotionality"),
      `E forrás-chip a fejlődési ívben: ${ws.growthPlan.source}`,
    );
  }
});

test("csak a E alacsony (<40): nincs kitalált fejlődési tipp", () => {
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({ E: 20 }), "TRITAN", lang);
    assert.equal(ws.growthTip, undefined);
    assert.equal(ws.growthPlan, undefined);
  }
});

test("nem-E alacsony dimenzió: a viselkedés változatlan (regresszió-őr)", () => {
  const ws = buildWorkstyleContent(scores({ C: 30 }), "TRITAN", "hu");
  assert.equal(ws.growthTip, DIMENSION_GROWTH_TIPS.C.hu.behavior);
  assert.ok(ws.growthPlan?.source.includes("Lelkiismeretesség"));
});

test("kiegyensúlyozott profil (minden ≥40): továbbra sincs tipp", () => {
  const ws = buildWorkstyleContent(scores({}), "TRITAN", "hu");
  assert.equal(ws.growthTip, undefined);
  assert.equal(ws.growthPlan, undefined);
});
