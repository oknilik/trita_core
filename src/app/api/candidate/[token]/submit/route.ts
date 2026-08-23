import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { completeAcceptance } from "@/lib/acceptance/service";
import { checkTokenRateLimit } from "@/lib/rate-limit";

const answerSchema = z.object({
  questionId: z.number().int().positive(),
  value: z.number().int().min(1).max(5),
});

const submitSchema = z.object({
  // Felső mérethatár: a legnagyobb élő forma 100 item; 150 elég a valós
  // beküldésnek, de kizárja a memória-terhelő túlméretes tömböt.
  answers: z.array(answerSchema).max(150),
});

// POST /api/candidate/[token]/submit — submit candidate assessment answers
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const rateLimitResponse = await checkTokenRateLimit("candidate", token);
  if (rateLimitResponse) return rateLimitResponse;
  const { userId } = await auth();

  const body = submitSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", details: body.error.flatten() },
      { status: 400 }
    );
  }

  const result = await completeAcceptance({
    token,
    routeSource: "api.candidate.submit",
    targetContext: { kind: "candidate" },
    authState: {
      clerkId: userId ?? null,
      authenticated: Boolean(userId),
    },
    answers: body.data.answers,
  });

  if (result.errorState) {
    return NextResponse.json(
      {
        error: result.errorState.code,
        ...(result.errorState.details ? { details: result.errorState.details } : {}),
      },
      { status: result.errorState.status },
    );
  }

  return NextResponse.json({
    ok: true,
    acceptanceState: result.acceptanceState,
    nextPath: result.handoffContext.nextPath,
  });
}
