// CRM service-hibák: rövid, gépi kód a szerverről — a kliens lokalizálja
// (a meglévő API-hibakód-mintát követve). Az API-réteg a kódot státuszra
// képezi le (NOT_FOUND → 404, minden más üzleti szabálysértés → 400).

export type CrmErrorCode =
  | "DEAL_NOT_FOUND"
  | "INQUIRY_NOT_FOUND"
  | "QUOTE_NOT_FOUND"
  | "DOCUMENT_NOT_FOUND"
  | "ACTIVITY_NOT_FOUND"
  | "ORG_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "INVALID_STAGE"
  | "INVALID_TRANSITION"
  | "LOST_REASON_REQUIRED"
  | "QUOTE_NOT_DRAFT"
  | "ORDER_FORM_REQUIRES_ACCEPTED_QUOTE"
  | "TEAM_HEADCOUNT_MISMATCH"
  | "QUOTE_SNAPSHOT_MISMATCH"
  | "ONLY_DRAFT_DELETABLE"
  | "NOT_EDITABLE"
  | "INQUIRY_ALREADY_LINKED"
  | "VALIDATION_ERROR";

export class CrmServiceError extends Error {
  readonly code: CrmErrorCode;

  constructor(code: CrmErrorCode, message?: string) {
    super(message ?? code);
    this.name = "CrmServiceError";
    this.code = code;
  }
}

/** 404-et érdemlő kódok — minden más üzleti szabálysértés (400). */
export function isCrmNotFoundCode(code: CrmErrorCode): boolean {
  return code.endsWith("_NOT_FOUND");
}

export interface SchemaOutOfSyncDetail {
  code: string;
  target: string | null; // hiányzó tábla vagy oszlop neve, ha a hibából kiderül
}

/**
 * Migráció-lemaradás felismerése (az org-context activeOrgId-guard mintája):
 * a futó DB-ből hiányzik a CRM-séma egy táblája/oszlopa — P2021 (tábla) vagy
 * P2022 (oszlop). Ilyenkor az admin-felület nem az általános hibaoldalra
 * fut, hanem megmondja a teendőt (prisma migrate deploy ezen a környezeten).
 */
export function schemaOutOfSyncDetail(error: unknown): SchemaOutOfSyncDetail | null {
  if (!(error instanceof Error)) return null;
  const maybePrisma = error as Error & {
    code?: string;
    meta?: { table?: string; column?: string; modelName?: string };
  };
  if (maybePrisma.name !== "PrismaClientKnownRequestError") return null;
  if (maybePrisma.code !== "P2021" && maybePrisma.code !== "P2022") return null;
  return {
    code: maybePrisma.code,
    target: maybePrisma.meta?.table ?? maybePrisma.meta?.column ?? maybePrisma.meta?.modelName ?? null,
  };
}
