import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createRegistrationLegalAcceptance,
  PLATFORM_TERMS_VERSION,
  PRIVACY_NOTICE_VERSION,
} from "@/lib/legal/versions";

test("a regisztrációs elfogadás pontos jogi verziókat és időpontot rögzít", () => {
  const acceptance = createRegistrationLegalAcceptance();

  assert.equal(acceptance.accepted, true);
  assert.equal(acceptance.platformTermsVersion, PLATFORM_TERMS_VERSION);
  assert.equal(acceptance.privacyNoticeVersion, PRIVACY_NOTICE_VERSION);
  assert.ok(Number.isFinite(Date.parse(acceptance.acceptedAt)));
});

test("az e-mailes és Google-regisztráció is a kötelező checkboxhoz kötött", () => {
  const source = readFileSync("src/app/(auth)/sign-up/page.tsx", "utf8");

  assert.match(source, /type="checkbox"/);
  assert.match(source, /href="\/legal\/platform-terms"/);
  assert.match(source, /href="\/privacy"/);
  assert.equal(source.match(/legalAcceptance: createRegistrationLegalAcceptance\(\)/g)?.length, 2);
  assert.ok((source.match(/!hasAcceptedLegal/g)?.length ?? 0) >= 4);
});

test("a Clerk webhook és az adatmodell megőrzi az elfogadási bizonyítékot", () => {
  const webhook = readFileSync("src/app/api/webhooks/clerk/route.ts", "utf8");
  const schema = readFileSync("prisma/schema.prisma", "utf8");

  for (const field of [
    "platformTermsVersion",
    "platformTermsAcceptedAt",
    "privacyNoticeVersion",
    "privacyNoticeAcceptedAt",
  ]) {
    assert.match(webhook, new RegExp(field));
    assert.match(schema, new RegExp(field));
  }
  assert.match(webhook, /legalAcceptanceRecord\.upsert/);
  assert.match(schema, /model LegalAcceptanceRecord/);
  assert.match(schema, /@@unique\(\[userId, platformTermsVersion, privacyNoticeVersion\]\)/);
});
