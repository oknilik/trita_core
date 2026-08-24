import test from "node:test";
import assert from "node:assert/strict";
import { t } from "@/lib/i18n/public";

test("a Team Scan ajánlati oldalai ugyanazt a három alapréteget ígérik", () => {
  for (const locale of ["hu", "en"] as const) {
    const pricing = t("pricing.teamBody", locale);
    const pilot = t("pilot.benefit1Desc", locale);

    const expectedLayerCount = locale === "hu" ? "három" : "three";
    const obsoleteLayerCount = locale === "hu" ? "négy" : "four";

    assert.match(pricing.toLocaleLowerCase(locale), new RegExp(expectedLayerCount));
    assert.match(pilot.toLocaleLowerCase(locale), new RegExp(expectedLayerCount));

    assert.doesNotMatch(pricing.toLocaleLowerCase(locale), new RegExp(obsoleteLayerCount));
    assert.doesNotMatch(pilot.toLocaleLowerCase(locale), new RegExp(obsoleteLayerCount));
  }
});

test("a teljes Team Scan nem kap félrevezető per-fő időígéretet", () => {
  for (const locale of ["hu", "en"] as const) {
    const teamSummary = t("pricing.teamBody", locale);
    assert.doesNotMatch(teamSummary, /(?:~|about|approximately)\s*10/i);

  }
});

test("a csapatszerepek opcionális modulként jelennek meg", () => {
  assert.match(t("pilot.benefit1Desc", "hu"), /külön kiegészítő/);
  assert.match(t("pilot.benefit1Desc", "en"), /separate add-ons/);
});
