import test from "node:test";
import assert from "node:assert/strict";
import {
  CandidateInviteScopeError,
  resolveInviteOrgScope,
  type InviteOrgScopeInput,
} from "@/lib/candidate-apply/org-scope";

// Jelölt-meghívó org-hatókör (2026-08-11, fix): a form a hiring lap orgId-ját
// küldi, és a service EZ alá iktat — a korábbi aktív-org fallback a
// LÉTREHOZÓ aktív orgja alá tette a meghívót (és a jelölt eredményét), ha a
// tanácsadó egy másik org lapján állt.

const base: InviteOrgScopeInput = {
  requestedOrgId: null,
  teamOrgId: null,
  teamRequested: false,
  requestedOrgMembership: null,
  teamOrgMembership: null,
  activeMembership: null,
};

function expectScopeError(
  input: InviteOrgScopeInput,
  code: "FORBIDDEN" | "ORG_SCOPE_MISMATCH",
  status: number,
) {
  assert.throws(
    () => resolveInviteOrgScope(input),
    (error: unknown) => {
      assert.ok(error instanceof CandidateInviteScopeError);
      assert.equal(error.code, code);
      assert.equal(error.status, status);
      return true;
    },
  );
}

test("a kimondott org nyer az aktív org fölött (a hibás fallback regressziója)", () => {
  // Tanácsadó a /hiring/org-a lapon áll, de az aktív orgja org-b: a meghívó
  // org-a alá kerül, az ottani szereppel.
  const scope = resolveInviteOrgScope({
    ...base,
    requestedOrgId: "org-a",
    requestedOrgMembership: { orgId: "org-a", role: "ORG_CONSULTANT" },
    activeMembership: { orgId: "org-b", role: "ORG_ADMIN" },
  });
  assert.equal(scope.orgId, "org-a");
  assert.equal(scope.role, "ORG_CONSULTANT");
});

test("kimondott org tagság nélkül: FORBIDDEN (aktív orgra nem esik vissza)", () => {
  expectScopeError(
    {
      ...base,
      requestedOrgId: "org-a",
      requestedOrgMembership: null,
      // Az aktív tagság NEM menti meg — a kimondott hatókör a kérdés.
      activeMembership: { orgId: "org-b", role: "ORG_ADMIN" },
    },
    "FORBIDDEN",
    403,
  );
});

test("team másik orgból a kimondott org mellett: ORG_SCOPE_MISMATCH", () => {
  expectScopeError(
    {
      ...base,
      requestedOrgId: "org-a",
      teamRequested: true,
      teamOrgId: "org-b",
      requestedOrgMembership: { orgId: "org-a", role: "ORG_CONSULTANT" },
    },
    "ORG_SCOPE_MISMATCH",
    400,
  );
  // Nem létező team (teamOrgId=null) ugyanígy ütközés.
  expectScopeError(
    {
      ...base,
      requestedOrgId: "org-a",
      teamRequested: true,
      teamOrgId: null,
      requestedOrgMembership: { orgId: "org-a", role: "ORG_CONSULTANT" },
    },
    "ORG_SCOPE_MISMATCH",
    400,
  );
});

test("kimondott org + odatartozó team: a kimondott org szerepe jön vissza", () => {
  const scope = resolveInviteOrgScope({
    ...base,
    requestedOrgId: "org-a",
    teamRequested: true,
    teamOrgId: "org-a",
    requestedOrgMembership: { orgId: "org-a", role: "ORG_ADMIN" },
  });
  assert.equal(scope.orgId, "org-a");
  assert.equal(scope.role, "ORG_ADMIN");
});

test("örökölt kliens (nincs orgId): team orgja, különben aktív org", () => {
  const viaTeam = resolveInviteOrgScope({
    ...base,
    teamRequested: true,
    teamOrgId: "org-t",
    teamOrgMembership: { orgId: "org-t", role: "ORG_CONSULTANT" },
  });
  assert.equal(viaTeam.orgId, "org-t");

  const viaActive = resolveInviteOrgScope({
    ...base,
    activeMembership: { orgId: "org-b", role: "ORG_CONSULTANT" },
  });
  assert.equal(viaActive.orgId, "org-b");

  expectScopeError({ ...base }, "FORBIDDEN", 403);
  expectScopeError(
    { ...base, teamRequested: true, teamOrgId: "org-t", teamOrgMembership: null },
    "FORBIDDEN",
    403,
  );
});
