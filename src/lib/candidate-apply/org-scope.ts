// Jelölt-meghívó org-hatókör feloldása — TISZTA döntési függvény, a
// service-ből kiemelve, hogy prisma nélkül unit-tesztelhető legyen.
//
// A HIBA, amit javít (2026-08-11): a form nem küldött orgId-t, és team
// nélkül a service a LÉTREHOZÓ aktív orgjára esett vissza — egy tanácsadó a
// /hiring/A oldalon állva B org alá iktatta a meghívót (és később a jelölt
// teljes személyiség-eredményét), ha épp B volt az aktív orgja. A form
// innentől a LAP orgId-ját küldi; a kimondott org a hatókör, a hívó
// szerepét ABBAN az orgban ellenőrizzük, az eltérés rövid hibakóddal bukik.

export type CandidateInviteScopeErrorCode = "FORBIDDEN" | "ORG_SCOPE_MISMATCH";

export class CandidateInviteScopeError extends Error {
  readonly code: CandidateInviteScopeErrorCode;
  readonly status: number;

  constructor(code: CandidateInviteScopeErrorCode, status: number) {
    super(code);
    this.name = "CandidateInviteScopeError";
    this.code = code;
    this.status = status;
  }
}

export interface OrgMembershipRef {
  orgId: string;
  role: string;
}

export interface InviteOrgScopeInput {
  /** a hívó által KIMONDOTT org (a hiring lap orgId-ja); null = örökölt kliens */
  requestedOrgId: string | null;
  /** a megadott team TÉNYLEGES orgja (null = nincs team vagy nem létezik) */
  teamOrgId: string | null;
  /** volt-e egyáltalán teamId a kérésben (létező-e, azt a teamOrgId mondja) */
  teamRequested: boolean;
  /** a hívó tagsága a KÉRT orgban (leftAt: null szűréssel keresve) */
  requestedOrgMembership: OrgMembershipRef | null;
  /** a hívó tagsága a team orgjában (örökölt, orgId nélküli kérésekhez) */
  teamOrgMembership: OrgMembershipRef | null;
  /** a hívó aktív org-tagsága (örökölt, team és orgId nélküli kérésekhez) */
  activeMembership: OrgMembershipRef | null;
}

/**
 * A meghívó cél-orgjának és a hívó ottani szerepének feloldása.
 *
 *  - Explicit orgId-nál AZ a hatókör: a team-nek is oda kell tartoznia
 *    (különben ORG_SCOPE_MISMATCH), és a hívónak ott kell tagnak lennie.
 *  - orgId nélkül (örökölt kliens) a korábbi lépcső él: team orgja, különben
 *    aktív org — de az aktív-org fallback CSAK explicit orgId hiányában fut.
 */
export function resolveInviteOrgScope(input: InviteOrgScopeInput): OrgMembershipRef {
  if (input.requestedOrgId) {
    if (input.teamRequested && input.teamOrgId !== input.requestedOrgId) {
      // A team másik orgé (vagy nem létezik) — a kimondott hatókörrel ütközik.
      throw new CandidateInviteScopeError("ORG_SCOPE_MISMATCH", 400);
    }
    const membership = input.requestedOrgMembership;
    if (!membership || membership.orgId !== input.requestedOrgId) {
      throw new CandidateInviteScopeError("FORBIDDEN", 403);
    }
    return membership;
  }
  if (input.teamRequested) {
    if (!input.teamOrgId || !input.teamOrgMembership) {
      throw new CandidateInviteScopeError("FORBIDDEN", 403);
    }
    return input.teamOrgMembership;
  }
  if (!input.activeMembership) {
    throw new CandidateInviteScopeError("FORBIDDEN", 403);
  }
  return input.activeMembership;
}
