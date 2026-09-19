import { NextResponse } from "next/server";
import { z } from "zod";
import { completeCandidateRole } from "@/lib/candidate-programs/service.server";
import { candidateError } from "@/lib/candidate-programs/http";
import { checkTokenRateLimit } from "@/lib/rate-limit";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const limited = await checkTokenRateLimit("candidate", token);
  if (limited) return limited;
  const body = z
    .object({ selections: z.record(z.string(), z.number()).nullable() })
    .strict()
    .safeParse(await req.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  try {
    return NextResponse.json(
      await completeCandidateRole(token, body.data.selections),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return candidateError(e);
  }
}
