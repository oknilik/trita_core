import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const deleteSchema = z.object({
  confirm: z.literal("DELETE"),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (profile) {
    await prisma.$transaction([
      prisma.assessmentResult.updateMany({
        where: { userProfileId: profile.id },
        data: { userProfileId: null },
      }),
      prisma.assessmentDraft.deleteMany({
        where: { userProfileId: profile.id },
      }),
      // Páros összehasonlítás: a törölt fél minden meghívója/párja azonnal
      // visszavonódik — a másik fél sem érheti el többé a szimulációt.
      prisma.compareInvite.updateMany({
        where: {
          OR: [{ inviterId: profile.id }, { partnerId: profile.id }],
          status: { in: ["PENDING", "ACCEPTED"] },
        },
        data: { status: "REVOKED" },
      }),
      prisma.userProfile.update({
        where: { id: profile.id },
        data: { clerkId: null, email: null, deleted: true },
      }),
    ]);
  }

  const client = await clerkClient();
  await client.users.deleteUser(userId);

  return NextResponse.json({ ok: true });
}
