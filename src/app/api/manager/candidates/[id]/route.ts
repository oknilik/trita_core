import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  teamId: z.string().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;

  const manager = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });
  if (!manager || manager.role !== "MANAGER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const invite = await prisma.candidateInvite.findUnique({
    where: { id },
    select: { id: true, managerId: true },
  });
  if (!invite || invite.managerId !== manager.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { teamId } = body.data;

  // If teamId provided, verify manager owns it
  if (teamId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true },
    });
    if (!team || team.ownerId !== manager.id) {
      return NextResponse.json({ error: "TEAM_NOT_FOUND" }, { status: 404 });
    }
  }

  await prisma.candidateInvite.update({
    where: { id },
    data: { teamId },
  });

  return NextResponse.json({ ok: true });
}
