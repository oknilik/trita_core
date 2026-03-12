import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";

const patchSchema = z.object({
  role: z.enum(["ORG_ADMIN", "ORG_MANAGER", "ORG_MEMBER"]),
});

// PATCH /api/org/[id]/members/[userId] — update member role (ORG_ADMIN only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: orgId, userId: targetUserId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const requesterMembership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!requesterMembership || !hasOrgRole(requesterMembership.role, "ORG_ADMIN")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const targetMembership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: targetUserId } },
    select: { role: true },
  });
  if (!targetMembership) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Prevent demoting last admin
  if (targetMembership.role === "ORG_ADMIN" && body.data.role !== "ORG_ADMIN") {
    const adminCount = await prisma.organizationMember.count({
      where: { orgId, role: "ORG_ADMIN" },
    });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "LAST_ADMIN" }, { status: 400 });
    }
  }

  const updated = await prisma.organizationMember.update({
    where: { orgId_userId: { orgId, userId: targetUserId } },
    data: { role: body.data.role },
    select: { id: true, role: true },
  });

  return NextResponse.json({ member: updated });
}

// DELETE /api/org/[id]/members/[userId] — remove a member (ORG_ADMIN only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: orgId, userId: targetUserId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const requesterMembership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!requesterMembership || !hasOrgRole(requesterMembership.role, "ORG_ADMIN")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const targetMembership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: targetUserId } },
    select: { role: true },
  });
  if (!targetMembership) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Prevent removing last admin
  if (targetMembership.role === "ORG_ADMIN") {
    const adminCount = await prisma.organizationMember.count({
      where: { orgId, role: "ORG_ADMIN" },
    });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "LAST_ADMIN" }, { status: 400 });
    }
  }

  await prisma.organizationMember.delete({
    where: { orgId_userId: { orgId, userId: targetUserId } },
  });

  return NextResponse.json({ ok: true });
}
