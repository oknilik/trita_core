import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const paramsSchema = z.object({
  id: z.string().min(1),
});

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const params = await context.params;
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid params", details: parsed.error.flatten() },
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
    where: { id: parsed.data.id },
  });
  if (!invitation || invitation.inviterId !== profile.id) {
    return NextResponse.json({ error: "Meghívó nem található." }, { status: 404 });
  }

  if (invitation.status === "COMPLETED") {
    return NextResponse.json(
      { error: "A kitöltött meghívó nem törölhető." },
      { status: 400 }
    );
  }

  await prisma.observerInvitation.update({
    where: { id: invitation.id },
    data: { status: "CANCELED" },
  });

  return NextResponse.json({ ok: true });
}
