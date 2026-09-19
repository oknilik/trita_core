import { NextResponse } from "next/server";
import { draftSchema } from "@/lib/candidate-programs/core";
import { saveCandidateDraft } from "@/lib/candidate-programs/service.server";
import { candidateError } from "@/lib/candidate-programs/http";
import { checkTokenRateLimit } from "@/lib/rate-limit";
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const limited = await checkTokenRateLimit("candidate", token);
  if (limited) return limited;
  const body = draftSchema.safeParse(await req.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  try {
    return NextResponse.json(await saveCandidateDraft(token, body.data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return candidateError(e);
  }
}
