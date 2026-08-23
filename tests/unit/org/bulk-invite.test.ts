import test from "node:test";
import assert from "node:assert/strict";
import {
  BULK_INVITE_BATCH_SIZE,
  chunkEmails,
  parseEmailList,
  summarizeBulkInvite,
} from "@/lib/bulk-invite";

// ─────────────────────────────────────────────────────────────────────
// A tömeges meghívás listaelemzője. Ugyanez a modul fut a kliens előnézetén
// és a szerver validálása mellett, tehát amit itt rögzítünk, az MINDKÉT
// oldalon érvényes.
//
// Az esetek a valós beillesztési módokból jönnek: Excel-oszlop (sortörés),
// levelező „címzettek" mezője (`Név <cím>`, pontosvessző), kézzel gépelt
// vesszős lista.
// ─────────────────────────────────────────────────────────────────────

test("sortöréssel elválasztott listát felismer", () => {
  const { emails, invalid } = parseEmailList("anna@ceg.hu\nbela@ceg.hu\ncili@ceg.hu");
  assert.deepEqual(emails, ["anna@ceg.hu", "bela@ceg.hu", "cili@ceg.hu"]);
  assert.deepEqual(invalid, []);
});

test("vessző, pontosvessző, tabulátor és szóköz is elválasztó", () => {
  const { emails } = parseEmailList("anna@ceg.hu, bela@ceg.hu; cili@ceg.hu\tdora@ceg.hu emo@ceg.hu");
  assert.deepEqual(emails, [
    "anna@ceg.hu",
    "bela@ceg.hu",
    "cili@ceg.hu",
    "dora@ceg.hu",
    "emo@ceg.hu",
  ]);
});

test("a levelezőből másolt `Név <cím>` alakból a címet veszi", () => {
  const { emails, invalid } = parseEmailList("Kovacs Bela <bela@ceg.hu>");
  assert.deepEqual(emails, ["bela@ceg.hu"]);
  assert.deepEqual(invalid, []);
});

test("több megjelenítési neves címet nem jelez fals hibának", () => {
  const { emails, invalid } = parseEmailList(
    "Kovács Béla <bela@ceg.hu>; Nagy Anna <anna@ceg.hu>",
  );
  assert.deepEqual(emails, ["bela@ceg.hu", "anna@ceg.hu"]);
  assert.deepEqual(invalid, []);
});

test("kisbetűsít és duplikátumot szűr", () => {
  const { emails } = parseEmailList("Anna@Ceg.hu\nanna@ceg.hu\nANNA@CEG.HU");
  assert.deepEqual(emails, ["anna@ceg.hu"]);
});

test("az értelmezhetetlen tokeneket külön adja vissza, nem dobja el némán", () => {
  const { emails, invalid } = parseEmailList("anna@ceg.hu\nnem-email\nbela@ceg.hu");
  assert.deepEqual(emails, ["anna@ceg.hu", "bela@ceg.hu"]);
  assert.deepEqual(invalid, ["nem-email"]);
});

test("záró írásjelet levág (másolt listák tipikus vége)", () => {
  const { emails, invalid } = parseEmailList("anna@ceg.hu, bela@ceg.hu.");
  assert.deepEqual(emails, ["anna@ceg.hu", "bela@ceg.hu"]);
  assert.deepEqual(invalid, []);
});

test("üres bemenetre üres listát ad", () => {
  assert.deepEqual(parseEmailList("   \n\n  ").emails, []);
});

test("a kötegelés a szerver-korlátot követi, és nem veszít elemet", () => {
  const emails = Array.from({ length: 57 }, (_, i) => `user${i}@ceg.hu`);
  const chunks = chunkEmails(emails);

  assert.equal(chunks.length, Math.ceil(57 / BULK_INVITE_BATCH_SIZE));
  for (const chunk of chunks) {
    assert.ok(chunk.length <= BULK_INVITE_BATCH_SIZE, "köteg túllépte a szerver-korlátot");
  }
  assert.deepEqual(chunks.flat(), emails);
});

test("az összegzés minden státuszt megszámol", () => {
  const summary = summarizeBulkInvite([
    { email: "a@ceg.hu", status: "added" },
    { email: "b@ceg.hu", status: "invited" },
    { email: "c@ceg.hu", status: "invited" },
    { email: "d@ceg.hu", status: "already_member" },
    { email: "e@ceg.hu", status: "invited_no_email" },
  ]);

  assert.equal(summary.added, 1);
  assert.equal(summary.invited, 2);
  assert.equal(summary.already_member, 1);
  assert.equal(summary.invited_no_email, 1);
  assert.equal(summary.self_invite, 0);
  assert.equal(summary.failed, 0);
});
