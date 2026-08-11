import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Blokkoljuk-e a draft olvasását/írását (403)?
 * (1) Self-guard: a bejelentkezett MEGHÍVÓ (értékelt) SOHA nem férhet a rater
 *     draftjához — sem olvasni (a rater nyers válaszai), sem írni (doctored
 *     draftot a rater helyett). Ez a submit self-guard megfelelője a draftra
 *     (motor-audit: külső tokennél az addressee-ellenőrzés nem fogta meg).
 * (2) Belsős (név szerinti) meghívó: csak a bejelentkezett címzett írhat.
 * A best-effort viewer-feloldás hibát null-ra nyel (a publikus draft-út nem
 * dobhat 500-at); kijelentkezve a külső-token self-eset a W2-vel közös maradék.
 */
async function shouldBlockDraftAccess(
  inviterId: string,
  observerProfileId: string | null,
): Promise<boolean> {
  let viewerId: string | null = null;
  try {
    const { userId } = await auth();
    if (userId) {
      const viewer = await prisma.userProfile.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });
      viewerId = viewer?.id ?? null;
    }
  } catch {
    viewerId = null;
  }
  if (viewerId && viewerId === inviterId) return true; // self-guard
  if (observerProfileId) {
    if (!viewerId || viewerId !== observerProfileId) return true; // not addressee
  }
  return false;
}

const draftSchema = z.object({
  token: z.string().min(1),
  phase: z.enum(["intro", "assessment", "confidence"]),
  relationshipType: z.string().min(1).max(40),
  knownDuration: z.string().min(1).max(40),
  // Méret-korlát: a legnagyobb élő forma 100 item — a felső határ kizárja a
  // memória-terhelő, hitelesítés nélküli publikus endpointra küldött túlméretes
  // JSON-blobot (motor-audit W11).
  answers: z.record(z.string().max(64), z.number().int().min(1).max(5)),
  currentPage: z.number().int().min(0).max(1000),
});

export async function POST(req: Request) {
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json().catch(() => null);
  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { token, phase, relationshipType, knownDuration, answers, currentPage } = parsed.data;
  if (Object.keys(answers).length > 150) {
    return NextResponse.json({ error: "TOO_MANY_ANSWERS" }, { status: 400 });
  }

  const invitation = await prisma.observerInvitation.findUnique({
    where: { token },
    select: { id: true, status: true, inviterId: true, observerProfileId: true },
  });
  if (!invitation || invitation.status !== "PENDING") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  if (await shouldBlockDraftAccess(invitation.inviterId, invitation.observerProfileId)) {
    return NextResponse.json({ error: "NOT_ADDRESSEE" }, { status: 403 });
  }

  await prisma.observerDraft.upsert({
    where: { invitationId: invitation.id },
    create: {
      invitationId: invitation.id,
      phase,
      relationshipType,
      knownDuration,
      answers,
      currentPage,
    },
    update: {
      phase,
      relationshipType,
      knownDuration,
      answers,
      currentPage,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const token = body?.token;
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const invitation = await prisma.observerInvitation.findUnique({
    where: { token },
    select: { id: true, inviterId: true, observerProfileId: true },
  });
  if (!invitation) {
    return NextResponse.json({ ok: true });
  }
  if (await shouldBlockDraftAccess(invitation.inviterId, invitation.observerProfileId)) {
    return NextResponse.json({ error: "NOT_ADDRESSEE" }, { status: 403 });
  }

  await prisma.observerDraft.deleteMany({
    where: { invitationId: invitation.id },
  });

  return NextResponse.json({ ok: true });
}
