// CRM service-hibák: rövid, gépi kód a szerverről — a kliens lokalizálja
// (a meglévő API-hibakód-mintát követve). Az API-réteg a kódot státuszra
// képezi le (NOT_FOUND → 404, minden más üzleti szabálysértés → 400).

export type CrmErrorCode =
  | "DEAL_NOT_FOUND"
  | "INQUIRY_NOT_FOUND"
  | "QUOTE_NOT_FOUND"
  | "ACTIVITY_NOT_FOUND"
  | "ORG_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "INVALID_STAGE"
  | "INVALID_TRANSITION"
  | "LOST_REASON_REQUIRED"
  | "QUOTE_NOT_DRAFT"
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
