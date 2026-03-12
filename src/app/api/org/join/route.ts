import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ inviteId: z.string().min(1) });

// POST /api/org/join — add authenticated user to org via pending invite token
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const invite = await prisma.organizationPendingInvite.findUnique({
    where: { id: body.data.inviteId },
    select: { id: true, orgId: true, role: true },
  });
  if (!invite) return NextResponse.json({ error: "INVITE_NOT_FOUND" }, { status: 404 });

  // 1-org enforcement
  const existingOrg = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
  });
  if (existingOrg) return NextResponse.json({ error: "ALREADY_IN_ORG" }, { status: 409 });

  await prisma.$transaction([
    prisma.organizationMember.create({
      data: { orgId: invite.orgId, userId: profile.id, role: invite.role },
    }),
    prisma.organizationPendingInvite.delete({ where: { id: invite.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
