import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const linkSchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profil nem található." }, { status: 404 });
  }

  const invitation = await prisma.observerInvitation.findUnique({
    where: { token: parsed.data.token },
  });
  if (!invitation) {
    return NextResponse.json({ error: "Meghívó nem található." }, { status: 404 });
  }
  if (invitation.status === "CANCELED") {
    return NextResponse.json(
      { error: "A meghívó már nem aktív." },
      { status: 400 }
    );
  }

  await prisma.observerInvitation.update({
    where: { id: invitation.id },
    data: { observerProfileId: profile.id },
  });

  return NextResponse.json({ ok: true });
}
