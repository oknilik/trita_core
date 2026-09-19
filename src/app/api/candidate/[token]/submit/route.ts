import { after, NextResponse } from "next/server";
import { draftSchema } from "@/lib/candidate-programs/core";
import { submitCandidate } from "@/lib/candidate-programs/service.server";
import { candidateError } from "@/lib/candidate-programs/http";
import { checkTokenRateLimit } from "@/lib/rate-limit";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const limited = await checkTokenRateLimit("candidate", token);
  if (limited) return limited;
  const body = draftSchema
    .omit({ acknowledge: true })
    .safeParse(await req.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  try {
    const { completedInviteId, ...result } = await submitCandidate(
      token,
      body.data,
    );
    if (completedInviteId)
      after(async () => {
        const { notifyCandidateCompleted } = await import(
          "@/lib/acceptance/service"
        );
        await notifyCandidateCompleted(completedInviteId);
      });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return candidateError(e);
  }
}
