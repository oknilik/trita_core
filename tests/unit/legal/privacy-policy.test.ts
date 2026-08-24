import test from "node:test";
import assert from "node:assert/strict";
import { PRIVACY_POLICY, type PolicyBlock } from "@/lib/legal/privacy-policy";
import { COMPANY, SUPERVISORY_AUTHORITY } from "@/lib/legal/company";
import { SUPPORTED_LOCALES } from "@/lib/i18n/core";

// Az adatvédelmi tájékoztató nem UI-szöveg: ha a magyar és az angol változat
// szerkezetileg szétcsúszik (hiányzó szakasz, eltérő táblázat-alak), az nem
// „kozmetikai hiba", hanem az egyik nyelvű olvasó hiányos tájékoztatása.
// Ezért itt szerkezeti egyezést és kötelező tartalmi elemeket is őrzünk.

const HU = PRIVACY_POLICY.hu;
const EN = PRIVACY_POLICY.en;

function blockShape(block: PolicyBlock): string {
  switch (block.kind) {
    case "ul":
      return `ul:${block.items.length}`;
    case "dl":
      return `dl:${block.items.length}`;
    case "table":
      return `table:${block.columns.length}x${block.rows.length}`;
    default:
      return block.kind;
  }
}

test("mindkét nyelv definiálva van", () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.ok(PRIVACY_POLICY[locale], `hiányzó nyelv: ${locale}`);
  }
});

test("a szakaszok azonosítói és sorrendje megegyezik a két nyelven", () => {
  assert.deepEqual(
    HU.sections.map((s) => s.id),
    EN.sections.map((s) => s.id),
  );
});

test("a szakaszok blokk-szerkezete megegyezik a két nyelven", () => {
  for (const [index, huSection] of HU.sections.entries()) {
    const enSection = EN.sections[index];
    assert.deepEqual(
      huSection.blocks.map(blockShape),
      enSection.blocks.map(blockShape),
      `eltérő szerkezet a(z) "${huSection.id}" szakaszban`,
    );
  }
});

test("minden táblázat minden sora annyi cellát tartalmaz, ahány oszlop van", () => {
  for (const doc of [HU, EN]) {
    for (const section of doc.sections) {
      for (const block of section.blocks) {
        if (block.kind !== "table") continue;
        for (const row of block.rows) {
          assert.equal(
            row.length,
            block.columns.length,
            `hibás sor a(z) "${section.id}" szakasz táblázatában`,
          );
        }
      }
    }
  }
});

test("nincs üres szöveg a dokumentumban", () => {
  for (const doc of [HU, EN]) {
    for (const section of doc.sections) {
      assert.ok(section.title.trim(), `üres szakaszcím: ${section.id}`);
      for (const block of section.blocks) {
        const texts =
          block.kind === "ul"
            ? block.items
            : block.kind === "dl"
              ? block.items.flatMap((i) => [i.term, i.description])
              : block.kind === "table"
                ? [...block.columns, ...block.rows.flat()]
                : [block.text];
        for (const text of texts) {
          assert.ok(text.trim(), `üres szövegblokk a(z) "${section.id}" szakaszban`);
        }
      }
    }
  }
});

test("a GDPR 13-14. cikk kötelező elemei szerepelnek", () => {
  // Nem szövegegyezést ellenőrzünk, hanem hogy a téma egyáltalán szerepel-e:
  // ezek hiánya a tájékoztatót jogilag hiányossá teszi.
  const requiredSections = [
    "controller", // adatkezelő azonosítása
    "purposes", // célok + JOGALAPOK
    "recipients", // címzettek / adatfeldolgozók
    "transfers", // harmadik országba továbbítás
    "retention", // megőrzési idők
    "automated", // automatizált döntéshozatal, profilalkotás
    "rights", // érintetti jogok
    "complaint", // panaszjog a felügyeleti hatóságnál
  ];

  for (const doc of [HU, EN]) {
    const ids = doc.sections.map((s) => s.id);
    for (const id of requiredSections) {
      assert.ok(ids.includes(id), `hiányzó kötelező szakasz: ${id}`);
    }
  }
});

test("a panasz-szakasz megnevezi a felügyeleti hatóságot és az elérhetőségét", () => {
  for (const doc of [HU, EN]) {
    const complaint = doc.sections.find((s) => s.id === "complaint");
    const text = JSON.stringify(complaint);
    assert.ok(text.includes("NAIH"), "a felügyeleti hatóság neve hiányzik");
    assert.ok(text.includes(SUPERVISORY_AUTHORITY.email), "a hatóság e-mail-címe hiányzik");
  }
});

test("a kapcsolati cím a company.ts egyetlen forrásából jön", () => {
  for (const doc of [HU, EN]) {
    const contact = JSON.stringify(doc.sections.find((s) => s.id === "contact"));
    assert.ok(contact.includes(COMPANY.privacyEmail));
  }
});

test("az adatkezelő szakasza minden azonosító adatot felsorol", () => {
  for (const doc of [HU, EN]) {
    const controller = JSON.stringify(doc.sections.find((s) => s.id === "controller"));
    for (const value of [
      COMPANY.legalName.replace(/^Trita\b/, "trita"),
      COMPANY.address,
      COMPANY.registrationNumber,
      COMPANY.taxNumber,
    ]) {
      assert.ok(controller.includes(value), `hiányzó azonosító adat: ${value}`);
    }
  }
});
