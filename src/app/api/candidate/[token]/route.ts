import { NextResponse } from "next/server";
import { resolveAcceptance } from "@/lib/acceptance/service";

// GET /api/candidate/[token] — validate token and return invite info
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const acceptance = await resolveAcceptance({
    token,
    routeSource: "api.candidate.lookup",
    targetContext: { kind: "candidate" },
  });
  const invite = acceptance.candidateContext;

  if (!invite || acceptance.acceptanceState === "APPLY_NOT_FOUND") {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 404 });
  }

  if (acceptance.acceptanceState === "APPLY_COMPLETED") {
    return NextResponse.json({ error: "ALREADY_USED", status: "COMPLETED" }, { status: 410 });
  }

  if (acceptance.acceptanceState === "APPLY_EXPIRED") {
    return NextResponse.json({ error: "INVITE_EXPIRED", status: "EXPIRED" }, { status: 410 });
  }

  if (acceptance.acceptanceState === "APPLY_CANCELED") {
    return NextResponse.json({ error: "INVITE_REVOKED", status: "CANCELED" }, { status: 410 });
  }

  return NextResponse.json({
    testType: invite.testType,
    position: invite.position,
    candidateName: invite.name,
    status: invite.status,
    expiresAt: invite.expiresAt,
  });
}
