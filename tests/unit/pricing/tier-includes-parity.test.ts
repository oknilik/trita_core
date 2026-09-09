/**
 * A szintek tartalma KÉT helyen él: a publikus i18n-kulcsokban
 * (`pricing.tier_*_item*`) és az admin/PDF oldali `QUOTE_TIER_INCLUDES`-ban.
 * Ez a teszt nem a szövegek egyezését kéri számon (az admin-lista magyar és
 * tömörebb), hanem azt, hogy ne csússzon szét a TÉTELEK SZÁMA: ha az egyik
 * helyre új sor kerül, a másik is kapjon.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { t } from "@/lib/i18n";
import { QUOTE_TIER_INCLUDES } from "@/lib/quote/rate-card";

function publicItems(prefix: "kep" | "prog"): string[] {
  const items: string[] = [];
  for (let index = 1; index <= 30; index += 1) {
    const key = `pricing.tier_${prefix}_item${index}`;
    const value = t(key, "hu");
    // A hiányzó kulcsot a t() magával a kulccsal adja vissza.
    if (value === key) break;
    items.push(value);
  }
  return items;
}

test("a publikus és az admin tartalom-lista együtt mozog", async (subtest) => {
  const kep = publicItems("kep");
  const prog = publicItems("prog");

  await subtest.test("a Csapatkép tételei egyeznek", () => {
    assert.ok(kep.length > 0, "a publikus lista nem lehet üres");
    assert.equal(QUOTE_TIER_INCLUDES.kep.length, kep.length);
  });

  await subtest.test("a Csapatprogram az „minden, ami a Csapatképben” sorral kezd", () => {
    assert.ok(prog.length > 0);
    // Az admin-lista első sora a visszautalás, utána jönnek a saját tételek.
    assert.equal(QUOTE_TIER_INCLUDES.prog.length, prog.length + 1);
    assert.match(QUOTE_TIER_INCLUDES.prog[0], /Csapatkép/);
  });

  await subtest.test("minden publikus tételnek van angol párja", () => {
    for (let index = 1; index <= kep.length; index += 1) {
      const key = `pricing.tier_kep_item${index}`;
      assert.notEqual(t(key, "en"), key, `hiányzó EN: ${key}`);
    }
    for (let index = 1; index <= prog.length; index += 1) {
      const key = `pricing.tier_prog_item${index}`;
      assert.notEqual(t(key, "en"), key, `hiányzó EN: ${key}`);
    }
  });
});
