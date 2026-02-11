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
    await prisma.assessmentResult.updateMany({
      where: { userProfileId: profile.id },
      data: { userProfileId: null },
    });
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { clerkId: null, email: null, deleted: true },
    });
  }

  const client = await clerkClient();
  await client.users.deleteUser(userId);

  return NextResponse.json({ ok: true });
}
