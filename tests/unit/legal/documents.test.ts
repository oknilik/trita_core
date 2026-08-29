import test from "node:test";
import assert from "node:assert/strict";
import { LEGAL_DOCUMENTS } from "@/lib/legal/documents";
import { SUPPORTED_LOCALES } from "@/lib/i18n/core";

test("mindhárom jogi dokumentum stabil és egyedi v1 azonosítóval szerepel", () => {
  assert.deepEqual(
    LEGAL_DOCUMENTS.map(({ slug }) => slug),
    ["platform-terms", "business-terms", "dpa"],
  );
  assert.equal(new Set(LEGAL_DOCUMENTS.map(({ documentId }) => documentId)).size, 3);
  assert.ok(LEGAL_DOCUMENTS.every(({ documentId }) => documentId.endsWith("-v1")));
});

test("minden dokumentum teljes HU/EN felületi tartalommal rendelkezik", () => {
  for (const document of LEGAL_DOCUMENTS) {
    for (const locale of SUPPORTED_LOCALES) {
      assert.ok(document.title[locale].trim());
      assert.ok(document.description[locale].trim());
      assert.ok(document.scope[locale].trim());
      assert.ok(document.highlights[locale].length >= 3);
    }
  }
});

test("mindhárom dokumentum teljes, weben renderelhető jogi törzsszöveget tartalmaz", () => {
  for (const document of LEGAL_DOCUMENTS) {
    assert.ok(document.content.length >= 59, `${document.slug}: hiányos dokumentumtörzs`);
    assert.ok(document.content.some((block) => block.kind === "heading" && block.level === 1));
    assert.ok(document.content.some((block) => block.kind === "table"));
  }
});

test("a webes törzsszöveg megőrzi a dokumentumok kritikus szerződéses mondatait", () => {
  const content = Object.fromEntries(
    LEGAL_DOCUMENTS.map((document) => [document.slug, JSON.stringify(document.content)]),
  );

  assert.match(content["platform-terms"], /A jelen Feltételek szerinti egyéni szolgáltatás díjmentes/);
  assert.match(content["business-terms"], /Adatvédelmi tárgyban a DPA élvez elsőbbséget/);
  assert.match(content.dpa, /kizárólag az Adatkezelő dokumentált utasításai alapján/);
});

test("a nyilvános dokumentumok nem tartalmaznak belső review-jelölést vagy nyitott kérdést", () => {
  const text = JSON.stringify(LEGAL_DOCUMENTS);
  for (const forbidden of ["DÖNTENDŐ", "ÜGYVÉDI ELLENŐRZÉS", "ÖSSZEHANGOLANDÓ", "review-draft", "RD1"]) {
    assert.ok(!text.includes(forbidden), `belső jelölés maradt a szövegben: ${forbidden}`);
  }
});
