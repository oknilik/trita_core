import test from "node:test";
import assert from "node:assert/strict";
import {
  hasAcceptedLegalVersion,
  requiresLegalAcceptance,
} from "@/lib/legal/acceptance";

const oldVersion = {
  platformTermsVersion: "PFF-v1",
  privacyNoticeVersion: "PRIVACY-v1",
};
const currentVersion = {
  platformTermsVersion: "PFF-v2",
  privacyNoticeVersion: "PRIVACY-v2",
};

test("a teljes verziópár elfogadása szükséges", () => {
  assert.equal(hasAcceptedLegalVersion(currentVersion, currentVersion), true);
  assert.equal(
    hasAcceptedLegalVersion(
      { platformTermsVersion: "PFF-v2", privacyNoticeVersion: "PRIVACY-v1" },
      currentVersion,
    ),
    false,
  );
});

test("admin aktiválás előtt nincs kötelező újbóli elfogadás", () => {
  assert.equal(
    requiresLegalAcceptance({
      accepted: oldVersion,
      activeCampaign: null,
      publishedCurrent: currentVersion,
    }),
    false,
  );
});

test("aktivált új verzió a régi elfogadást blokkolja", () => {
  assert.equal(
    requiresLegalAcceptance({
      accepted: oldVersion,
      activeCampaign: currentVersion,
      publishedCurrent: currentVersion,
    }),
    true,
  );
});

test("friss regisztrálót egy régebbi kampány nem kér vissza régi verzióra", () => {
  assert.equal(
    requiresLegalAcceptance({
      accepted: currentVersion,
      activeCampaign: oldVersion,
      publishedCurrent: currentVersion,
    }),
    false,
  );
});
