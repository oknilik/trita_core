import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendTeamInviteEmail } from "@/lib/emails";
import { getServerLocale } from "@/lib/i18n-server";

const inviteSchema = z.object({
  email: z.string().email(),
});

// POST /api/team/[id]/invite — add a member to the team by email
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: teamId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });
  if (!profile || profile.role !== "MANAGER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Verify ownership
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, ownerId: true, name: true },
  });
  if (!team || team.ownerId !== profile.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const body = inviteSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  // Normalize to lowercase to prevent case-sensitive duplicates
  const email = body.data.email.toLowerCase();

  const targetUser = await prisma.userProfile.findFirst({
    where: { email, deleted: false },
    select: { id: true },
  });

  // User doesn't exist yet — create a pending invite and send email
  if (!targetUser) {
    const existingPending = await prisma.teamPendingInvite.findUnique({
      where: { teamId_email: { teamId, email } },
    });
    if (existingPending) {
      return NextResponse.json({ error: "ALREADY_MEMBER" }, { status: 409 });
    }

    await prisma.teamPendingInvite.create({
      data: { teamId, email },
    });

    const locale = await getServerLocale();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io";
    const signUpUrl = `${appUrl}/sign-up`;
    await sendTeamInviteEmail({
      to: email,
      teamName: team.name,
      signUpUrl,
      locale: (locale === "hu" || locale === "en" || locale === "de") ? locale : "en",
    });

    return NextResponse.json({ pending: true }, { status: 201 });
  }

  // Prevent duplicate membership
  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: targetUser.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "ALREADY_MEMBER" }, { status: 409 });
  }

  const member = await prisma.teamMember.create({
    data: { teamId, userId: targetUser.id },
    select: { id: true, userId: true, joinedAt: true },
  });

  return NextResponse.json({ member }, { status: 201 });
}
