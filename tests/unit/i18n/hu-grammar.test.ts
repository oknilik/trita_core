import test from "node:test";
import assert from "node:assert/strict";
import { huArticle, withHuArticle } from "@/lib/hu-grammar";

// A magyar határozott névelő feloldása — a riport-szövegek „a(z)"
// sablon-műtermékének kiváltója (riport-javítási terv P1.2). A bemenetek
// a valós tartalom-készletből jönnek (HEXACO-címkék, facet-nevek).

test("huArticle: mássalhangzóval kezdődő kifejezés → 'a'", () => {
  assert.equal(huArticle("Nyitottság"), "a");
  assert.equal(huArticle("Becsületesség-Alázat"), "a");
  assert.equal(huArticle("Lelkiismeretesség"), "a");
  assert.equal(huArticle("tervezettség"), "a");
});

test("huArticle: magánhangzóval kezdődő kifejezés → 'az'", () => {
  assert.equal(huArticle("Extraverzió"), "az");
  assert.equal(huArticle("Emocionalitás"), "az");
  assert.equal(huArticle("Óvatosság"), "az");
  assert.equal(huArticle("együttérzés"), "az");
  assert.equal(huArticle("Ötletgazda"), "az");
});

test("huArticle: körülvevő whitespace nem zavarja", () => {
  assert.equal(huArticle("  Extraverzió"), "az");
  assert.equal(huArticle("  Nyitottság  "), "a");
});

test("withHuArticle: kész névelős kifejezést ad", () => {
  assert.equal(withHuArticle("Extraverzió"), "az Extraverzió");
  assert.equal(withHuArticle("Nyitottság"), "a Nyitottság");
});

test("withHuArticle: mondatkezdő pozícióban nagybetűs", () => {
  assert.equal(withHuArticle("Extraverzió", { capitalize: true }), "Az Extraverzió");
  assert.equal(withHuArticle("Nyitottság", { capitalize: true }), "A Nyitottság");
});

test("withHuArticle: üres bemenetre nem tákol névelőt", () => {
  assert.equal(withHuArticle(""), "");
  assert.equal(withHuArticle("   "), "");
});
