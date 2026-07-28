import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canViewMemberDossier } from "@/lib/measurement-auth";

// A tag-dossié hozzáférés KŐBE VÉSETT (2026-07-28): kizárólag org admin +
// tanácsadói kör. A manager NEM, a tag a sajátját SEM. Explicit allowlist.
describe("canViewMemberDossier — hozzáférési allowlist", () => {
  it("ORG_ADMIN → true", () => {
    assert.equal(canViewMemberDossier("ORG_ADMIN"), true);
  });

  it("ORG_CONSULTANT → true", () => {
    assert.equal(canViewMemberDossier("ORG_CONSULTANT"), true);
  });

  it("isConsultant=true bármely (nem-privilegizált) szereppel → true", () => {
    assert.equal(canViewMemberDossier("ORG_MEMBER", null, true), true);
    assert.equal(canViewMemberDossier("ORG_MANAGER", null, true), true);
    assert.equal(canViewMemberDossier(null, null, true), true);
  });

  it("ORG_MANAGER (tanácsadói jel nélkül) → false", () => {
    assert.equal(canViewMemberDossier("ORG_MANAGER"), false);
    assert.equal(canViewMemberDossier("ORG_MANAGER", "manager@x.io", false), false);
  });

  it("ORG_MEMBER → false (a tag a sajátját sem éri el)", () => {
    assert.equal(canViewMemberDossier("ORG_MEMBER"), false);
    assert.equal(canViewMemberDossier("ORG_MEMBER", "member@x.io", false), false);
  });

  it("null / undefined / üres szerep → false", () => {
    assert.equal(canViewMemberDossier(null), false);
    assert.equal(canViewMemberDossier(undefined), false);
    assert.equal(canViewMemberDossier(""), false);
  });

  it("ismeretlen / rossz alakú szerep-string → false", () => {
    assert.equal(canViewMemberDossier("ORG_OWNER"), false);
    assert.equal(canViewMemberDossier("org_admin"), false); // kisbetűs nem egyezik
    assert.equal(canViewMemberDossier("ADMIN"), false);
  });
});
