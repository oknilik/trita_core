import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Belsős (név szerinti) meghívó: csak a bejelentkezett címzett írhatja.
// Külsős meghívónál (nincs observerProfileId) nincs ilyen validáció.
async function isAddresseeMismatch(observerProfileId: string | null): Promise<boolean> {
  if (!observerProfileId) return false;
  const { userId } = await auth();
  if (!userId) return true;
  const viewer = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  return !viewer || viewer.id !== observerProfileId;
}

const draftSchema = z.object({
  token: z.string().min(1),
  phase: z.enum(["intro", "assessment", "confidence"]),
  relationshipType: z.string().min(1),
  knownDuration: z.string().min(1),
  answers: z.record(z.string(), z.number().int().min(1).max(5)),
  currentPage: z.number().int().min(0),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { token, phase, relationshipType, knownDuration, answers, currentPage } = parsed.data;

  const invitation = await prisma.observerInvitation.findUnique({
    where: { token },
    select: { id: true, status: true, observerProfileId: true },
  });
  if (!invitation || invitation.status !== "PENDING") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  if (await isAddresseeMismatch(invitation.observerProfileId)) {
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
    select: { id: true, observerProfileId: true },
  });
  if (!invitation) {
    return NextResponse.json({ ok: true });
  }
  if (await isAddresseeMismatch(invitation.observerProfileId)) {
    return NextResponse.json({ error: "NOT_ADDRESSEE" }, { status: 403 });
  }

  await prisma.observerDraft.deleteMany({
    where: { invitationId: invitation.id },
  });

  return NextResponse.json({ ok: true });
}
