import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendOrgInviteEmail } from "@/lib/emails";
import { hasOrgRole } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.app";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ORG_ADMIN", "ORG_MANAGER", "ORG_MEMBER"]).default("ORG_MEMBER"),
});

// POST /api/org/[id]/invite — invite a member by email (ORG_ADMIN or ORG_MANAGER)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: orgId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // ORG_MANAGER and above may invite
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership || !hasOrgRole(membership.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Verify org exists and is active
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, status: true },
  });
  if (!org) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (org.status === "INACTIVE") return NextResponse.json({ error: "ORG_INACTIVE" }, { status: 403 });

  const body = inviteSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const email = body.data.email.toLowerCase();
  let role = body.data.role;

  // ORG_MANAGER can only invite ORG_MEMBER (not higher)
  if (!hasOrgRole(membership.role, "ORG_ADMIN") && role !== "ORG_MEMBER") {
    role = "ORG_MEMBER";
  }

  // Prevent self-invite
  if (profile.email?.toLowerCase() === email) {
    return NextResponse.json({ error: "SELF_INVITE" }, { status: 400 });
  }

  const targetUser = await prisma.userProfile.findFirst({
    where: { email, deleted: false },
    select: { id: true },
  });

  if (!targetUser) {
    // User doesn't exist — create pending invite + send email
    const existing = await prisma.organizationPendingInvite.findUnique({
      where: { orgId_email: { orgId, email } },
    });
    if (existing) return NextResponse.json({ error: "ALREADY_MEMBER" }, { status: 409 });

    const invite = await prisma.organizationPendingInvite.create({
      data: { orgId, email, role },
      select: { id: true },
    });

    const emailSent = await sendOrgInviteEmail({
      to: email,
      orgName: org.name,
      role,
      signUpUrl: `${APP_URL}/join/org/${invite.id}`,
    });

    return NextResponse.json({ pending: true, emailSent }, { status: 201 });
  }

  // 1-org enforcement: check if target user already belongs to an org
  const targetExistingMembership = await prisma.organizationMember.findUnique({
    where: { userId: targetUser.id },
  });
  if (targetExistingMembership) {
    return NextResponse.json({ error: "ALREADY_IN_ORG" }, { status: 409 });
  }

  const member = await prisma.organizationMember.create({
    data: { orgId, userId: targetUser.id, role },
    select: { id: true, role: true, joinedAt: true },
  });

  return NextResponse.json({ member }, { status: 201 });
}
