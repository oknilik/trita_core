import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  username: z.string().min(2).max(20),
});

// PATCH /api/profile/username — update display name only (no onboardedAt side-effect)
export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const profile = await prisma.userProfile.upsert({
    where: { clerkId: userId },
    update: { username: body.data.username },
    create: { clerkId: userId, username: body.data.username },
    select: { id: true, username: true },
  });

  return NextResponse.json({ profile });
}
