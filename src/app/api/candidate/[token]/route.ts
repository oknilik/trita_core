import { NextResponse } from "next/server";
import { loadCandidate } from "@/lib/candidate-programs/service.server";
import { candidateError } from "@/lib/candidate-programs/http";
import { checkTokenRateLimit } from "@/lib/rate-limit";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const limited = await checkTokenRateLimit("candidate", token);
  if (limited) return limited;
  try {
    const { invite } = await loadCandidate(token);
    return NextResponse.json(
      {
        answers: invite.draftAnswers ?? {},
        revision: invite.draftRevision,
        acknowledged: Boolean(invite.acknowledgedAt),
        submitted: invite.status === "COMPLETED",
        teamRoleState: invite.teamRoleState,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return candidateError(e);
  }
}
