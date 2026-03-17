import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCandidateInviteEmail } from "@/lib/emails";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.app";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true, email: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;

  const invite = await prisma.candidateInvite.findUnique({
    where: { id },
    select: {
      id: true,
      managerId: true,
      status: true,
      expiresAt: true,
      email: true,
      token: true,
      position: true,
    },
  });

  if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (invite.managerId !== profile.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (invite.status !== "PENDING") return NextResponse.json({ error: "ALREADY_USED" }, { status: 409 });
  if (!invite.email) return NextResponse.json({ error: "NO_EMAIL" }, { status: 400 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "EXPIRED" }, { status: 409 });

  const managerName = profile.username ?? profile.email ?? "Manager";
  const emailSent = await sendCandidateInviteEmail({
    to: invite.email,
    managerName,
    token: invite.token,
    position: invite.position ?? undefined,
    applyUrl: `${APP_URL}/apply/${invite.token}`,
  });

  return NextResponse.json({ ok: true, emailSent });
}
