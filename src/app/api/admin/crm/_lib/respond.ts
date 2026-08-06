import { NextResponse } from "next/server";
import { CrmServiceError, isCrmNotFoundCode } from "@/lib/crm/errors";

// Közös hibaválasz-réteg a CRM admin-route-okhoz: a service CrmServiceError
// kódját HTTP-státuszra képezi (NOT_FOUND → 404, üzleti szabály → 400),
// minden más hibát tovább dob (500-ként bukik ki, ahogy a többi route-nál).

export function crmErrorResponse(error: unknown): NextResponse {
  if (error instanceof CrmServiceError) {
    return NextResponse.json(
      { error: error.code },
      { status: isCrmNotFoundCode(error.code) ? 404 : 400 },
    );
  }
  throw error;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}

export function validationError(): NextResponse {
  return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
}
