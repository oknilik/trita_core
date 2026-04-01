import { NextResponse } from "next/server";
import { z } from "zod";
import { completeAcceptance } from "@/lib/acceptance/service";

const answerSchema = z.object({
  questionId: z.number().int().positive(),
  value: z.number().int().min(1).max(5),
});

const submitSchema = z.object({
  answers: z.array(answerSchema),
});

// POST /api/candidate/[token]/submit — submit candidate assessment answers
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

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

  return NextResponse.json({ ok: true, acceptanceState: result.acceptanceState });
}
