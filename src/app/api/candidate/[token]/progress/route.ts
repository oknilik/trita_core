import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { TestType } from "@prisma/client";
import { resolveAcceptance } from "@/lib/acceptance/service";
import { checkTokenRateLimit } from "@/lib/rate-limit";
import { getTestConfig } from "@/lib/questions";
import { DEFAULT_ASSESSMENT_FORM } from "@/lib/operating-mode";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  answeredCount: z.number().int().min(0).max(500),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const rateLimitResponse = await checkTokenRateLimit("candidate", token);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const acceptance = await resolveAcceptance({
    token,
    routeSource: "api.candidate.progress",
    targetContext: { kind: "candidate" },
  });
  const invite = acceptance.candidateContext;

  if (!invite) return NextResponse.json({ ok: false });
  if (acceptance.acceptanceState === "APPLY_CANCELED") {
    return NextResponse.json({ ok: false, revoked: true });
  }
  if (acceptance.acceptanceState !== "APPLY_READY") {
    return NextResponse.json({ ok: false });
  }

  // A kliens által állított darabszám nem tény (2026-08-11, fix): a tárolt
  // (és a hiring-felületen tényként mutatott) érték a meghívó TÉNYLEGES
  // kérdőív-formájának itemszámára vágva kerül be — "500/60" nem létezhet.
  // A jelölt-flow a DEFAULT_ASSESSMENT_FORM-ot szolgálja ki (apply/page.tsx),
  // a plafon ugyanabból a konfigból jön.
  const totalQuestions = getTestConfig(
    invite.testType as TestType,
    "hu",
    DEFAULT_ASSESSMENT_FORM,
  ).questions.length;
  const answeredCount = Math.min(parsed.data.answeredCount, totalQuestions);

  await prisma.candidateInvite.update({
    where: { id: invite.id },
    data: {
      draftAnsweredCount: answeredCount,
      ...(invite.draftStartedAt ? {} : { draftStartedAt: new Date() }),
    },
  });

  return NextResponse.json({ ok: true });
}
