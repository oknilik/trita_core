import test from "node:test";
import assert from "node:assert/strict";
import { UserRole } from "@prisma/client";
import { resolveOrganizationExitProfileState } from "@/lib/org-membership-lifecycle.server";

const EARLIER = new Date("2026-01-01T00:00:00.000Z");
const LATER = new Date("2026-02-01T00:00:00.000Z");

test("org exit: membership nélkül a profil self-only INDIVIDUAL állapotba kerül", () => {
  assert.deepEqual(
    resolveOrganizationExitProfileState({
      currentActiveOrgId: "removed-org",
      remainingMemberships: [],
    }),
    { activeOrgId: null, role: UserRole.INDIVIDUAL },
  );
});

test("org exit: több orgnál az aktív megmarad és a profil szervezeti marad", () => {
  assert.deepEqual(
    resolveOrganizationExitProfileState({
      currentActiveOrgId: "existing-org",
      remainingMemberships: [
        { orgId: "newest-org", role: "ORG_MEMBER", joinedAt: LATER },
        { orgId: "existing-org", role: "ORG_MANAGER", joinedAt: EARLIER },
      ],
    }),
    { activeOrgId: "existing-org", role: UserRole.ORG_MEMBER },
  );
});

test("org exit: elavult aktív orgnál a legfrissebb megmaradt tagság a fallback", () => {
  assert.deepEqual(
    resolveOrganizationExitProfileState({
      currentActiveOrgId: "removed-org",
      remainingMemberships: [
        { orgId: "newest-org", role: "ORG_ADMIN", joinedAt: LATER },
        { orgId: "older-org", role: "ORG_MEMBER", joinedAt: EARLIER },
      ],
    }),
    { activeOrgId: "newest-org", role: UserRole.ORG_ADMIN },
  );
});

test("org exit: a tisztán tanácsadói hozzárendelés nem teszi org-userré a self-profilt", () => {
  assert.deepEqual(
    resolveOrganizationExitProfileState({
      currentActiveOrgId: null,
      remainingMemberships: [
        { orgId: "client-org", role: "ORG_CONSULTANT", joinedAt: LATER },
      ],
    }),
    { activeOrgId: "client-org", role: UserRole.INDIVIDUAL },
  );
});
