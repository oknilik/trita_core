import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/manager/candidates/[id] — revoke a PENDING candidate invite
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;

  const invite = await prisma.candidateInvite.findUnique({
    where: { id },
    select: { id: true, managerId: true, status: true },
  });

  if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (invite.managerId !== profile.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (invite.status !== "PENDING") return NextResponse.json({ error: "ALREADY_USED" }, { status: 409 });

  await prisma.candidateInvite.update({
    where: { id },
    data: { status: "CANCELED" },
  });

  return NextResponse.json({ ok: true });
}
