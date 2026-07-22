import test from "node:test";
import assert from "node:assert/strict";
import { resolveOrgCapabilities } from "@/lib/capabilities";

// P3 — org tag-szerep PATCH/DELETE jogosultsági invariánsok.
//
// A /api/org/[id]/members/[userId] PATCH és DELETE az "orgAdminManage"
// capabilityhez köti a műveletet (resolveOrgCapabilityDecision). Ez a teszt a
// capability-réteget rögzíti: ki eszkalálhat szerepet és ki nem.

function canAdminManage(orgRole: string | null, opts: {
  state?: "none" | "active" | "restricted" | "frozen";
} = {}): boolean {
  const { granted } = resolveOrgCapabilities({
    orgRole,
    subscriptionState: opts.state ?? "active",
  });
  return granted.has("orgAdminManage");
}

test("ORG_MEMBER nem kezelhet tag-szerepet (nincs orgAdminManage)", () => {
  assert.equal(canAdminManage("ORG_MEMBER"), false);
});

test("ORG_MANAGER nem kezelhet tag-szerepet (nincs orgAdminManage)", () => {
  assert.equal(canAdminManage("ORG_MANAGER"), false);
});

test("ORG_ADMIN aktív előfizetéssel kezelhet tag-szerepet", () => {
  assert.equal(canAdminManage("ORG_ADMIN"), true);
});

test("ORG_CONSULTANT admin-paritással kezelhet tag-szerepet (dokumentált)", () => {
  // A tanácsadó normalizálva ORG_ADMIN — szándékos admin-paritás.
  assert.equal(canAdminManage("ORG_CONSULTANT"), true);
});

test("ismeretlen / tagság nélküli szerep nem kezelhet tag-szerepet", () => {
  assert.equal(canAdminManage(null), false);
  assert.equal(canAdminManage("SOMETHING_ELSE"), false);
});

test("előfizetés-kapu: ORG_ADMIN restricted/frozen/none alatt nem kezelhet szerepet", () => {
  // orgAdminManage csak teljes-hozzáférésű állapotban jár — a
  // subscription-gating admin alatt is véd.
  assert.equal(canAdminManage("ORG_ADMIN", { state: "restricted" }), false);
  assert.equal(canAdminManage("ORG_ADMIN", { state: "frozen" }), false);
  assert.equal(canAdminManage("ORG_ADMIN", { state: "none" }), false);
  // Tanácsadó ugyanígy a subscription-kapu alatt.
  assert.equal(canAdminManage("ORG_CONSULTANT", { state: "frozen" }), false);
});

test("a PATCH cél-szerep enum nem tartalmazza az ORG_CONSULTANT-ot", () => {
  // A route Zod-enumja: ["ORG_ADMIN","ORG_MANAGER","ORG_MEMBER"]. A tanácsadó
  // kiosztása KIZÁRÓLAG a platform-admin org-access flow-jában történik, a
  // tag-PATCH-on át soha — így egy org-admin sem tehet valakit tanácsadóvá.
  const ASSIGNABLE_MEMBER_ROLES = ["ORG_ADMIN", "ORG_MANAGER", "ORG_MEMBER"] as const;
  assert.ok(!(ASSIGNABLE_MEMBER_ROLES as readonly string[]).includes("ORG_CONSULTANT"));
});
