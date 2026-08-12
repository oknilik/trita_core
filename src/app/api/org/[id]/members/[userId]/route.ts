import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveOrgCapabilityDecision, resolveOrgPolicySnapshot } from "@/lib/policy-service";
import { exitOrganizationMember } from "@/lib/org-membership-lifecycle.server";

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
    select: { role: true, leftAt: true },
  });
  if (!requesterMembership || requesterMembership.leftAt) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const patchPolicySnapshot = await resolveOrgPolicySnapshot({
    orgId,
    orgRole: requesterMembership.role,
  });
  const patchDecision = resolveOrgCapabilityDecision(patchPolicySnapshot, "orgAdminManage");
  if (!patchDecision.allowed) {
    return NextResponse.json(
      {
        error: "CAPABILITY_DENIED",
        reason: patchDecision.reason,
        upgradeHint: patchDecision.upgradeHint?.code ?? null,
      },
      { status: 403 },
    );
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const targetMembership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: targetUserId } },
    select: { role: true, leftAt: true },
  });
  if (!targetMembership || targetMembership.leftAt) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Prevent demoting last admin
  if (targetMembership.role === "ORG_ADMIN" && body.data.role !== "ORG_ADMIN") {
    const adminCount = await prisma.organizationMember.count({
      where: { orgId, role: "ORG_ADMIN", leftAt: null },
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
    select: { role: true, leftAt: true },
  });
  if (!requesterMembership || requesterMembership.leftAt) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const deletePolicySnapshot = await resolveOrgPolicySnapshot({
    orgId,
    orgRole: requesterMembership.role,
  });
  const deleteDecision = resolveOrgCapabilityDecision(deletePolicySnapshot, "orgAdminManage");
  if (!deleteDecision.allowed) {
    return NextResponse.json(
      {
        error: "CAPABILITY_DENIED",
        reason: deleteDecision.reason,
        upgradeHint: deleteDecision.upgradeHint?.code ?? null,
      },
      { status: 403 },
    );
  }

  const targetMembership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: targetUserId } },
    select: { role: true, leftAt: true },
  });
  if (!targetMembership || targetMembership.leftAt) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Prevent removing last admin
  if (targetMembership.role === "ORG_ADMIN") {
    const adminCount = await prisma.organizationMember.count({
      where: { orgId, role: "ORG_ADMIN", leftAt: null },
    });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "LAST_ADMIN" }, { status: 400 });
    }
  }

  const exit = await exitOrganizationMember({ orgId, userId: targetUserId });
  if (!exit) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true, exit });
}
