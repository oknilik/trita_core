import { NextResponse } from "next/server";
import { CandidateProgramError } from "./service.server";
export function candidateError(error: unknown) {
  if (error instanceof CandidateProgramError)
    return NextResponse.json(
      { error: error.code },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  throw error;
}
