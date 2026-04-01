import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveAcceptance } from "@/lib/acceptance/service";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  answeredCount: z.number().int().min(0).max(500),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

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

  await prisma.candidateInvite.update({
    where: { id: invite.id },
    data: {
      draftAnsweredCount: parsed.data.answeredCount,
      ...(invite.draftStartedAt ? {} : { draftStartedAt: new Date() }),
    },
  });

  return NextResponse.json({ ok: true });
}
