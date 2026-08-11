import test from "node:test";
import assert from "node:assert/strict";
import { orgTranslations } from "@/lib/i18n/org";

// 2026-08-11 termékdöntés: ± jelölés (±szórás / ±eltérés szám) nem kerül a
// felületre — a diszperzió-számítás belül él tovább, de a szótár egyetlen
// megjelenő értéke sem hordozhat ± jelet. A guard a results-szótár azonos
// őrző-mintáját követi (pole-and-hedge-content.test.ts).

test("org-szótár: nem maradt megjelenő ± jel a fordítás-értékekben", () => {
  const flat = JSON.stringify(orgTranslations);
  assert.ok(!flat.includes("±"), "± jel maradt az org-szótárban");
});

test("org-szótár: a kivezetett ± kulcsok új szövege érvényes", () => {
  assert.equal(orgTranslations.org.campaign.psSpread.hu, "szóródás: {spread} pont");
  assert.equal(orgTranslations.org.campaign.psSpread.en, "spread: {spread} points");
  assert.equal(orgTranslations.hiring.avgDeviation.hu, "Átlagos eltérés: {points} pont");
  assert.equal(orgTranslations.hiring.avgDeviation.en, "Average deviation: {points} points");
  // A jelmagyarázat már nem a (kivezetett) ±-számot magyarázza.
  assert.ok(!orgTranslations.manager.teamInsights.stdDevHint.hu.includes("±"));
  assert.ok(!orgTranslations.manager.teamInsights.stdDevHint.en.includes("±"));
});
