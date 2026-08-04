import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { ScoreResult } from "@/lib/scoring";
import { resolveCompareInviteState } from "@/lib/compare-invite";

// Kölcsönös consent: a partner elfogadja az összehasonlítást. Feltételek:
// belépett user, SAJÁT kitöltött eredmény (a jutalom kitöltéshez kötött),
// nem a saját linkje, és a meghívó él. Idempotens: ugyanaz a partner
// újra-elfogadhatja (pl. dupla kattintás) — más partner már nem.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  const { token } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const latest = await prisma.assessmentResult.findFirst({
    where: { userProfileId: profile.id, isSelfAssessment: true },
    orderBy: { createdAt: "desc" },
    select: { scores: true },
  });
  const scores = latest?.scores as ScoreResult | undefined;
  if (!scores || scores.type !== "likert") {
    return NextResponse.json({ error: "NO_RESULT" }, { status: 409 });
  }

  const invite = await prisma.compareInvite.findUnique({
    where: { token },
    select: {
      id: true,
      inviterId: true,
      partnerId: true,
      status: true,
      expiresAt: true,
    },
  });
  if (!invite) {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 404 });
  }
  if (invite.inviterId === profile.id) {
    return NextResponse.json({ error: "SELF_COMPARE" }, { status: 409 });
  }

  const state = resolveCompareInviteState(invite);
  if (state === "REVOKED") {
    return NextResponse.json({ error: "COMPARE_REVOKED" }, { status: 410 });
  }
  if (state === "EXPIRED") {
    return NextResponse.json({ error: "COMPARE_EXPIRED" }, { status: 410 });
  }
  if (state === "ACCEPTED") {
    if (invite.partnerId === profile.id) {
      return NextResponse.json({ id: invite.id, ok: true });
    }
    return NextResponse.json({ error: "ALREADY_ACCEPTED" }, { status: 409 });
  }

  await prisma.compareInvite.update({
    where: { id: invite.id },
    data: {
      partnerId: profile.id,
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
  });

  return NextResponse.json({ id: invite.id, ok: true });
}
