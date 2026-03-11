import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendCandidateInviteEmail } from "@/lib/emails";

const createSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(200).optional(),
  position: z.string().min(1).max(200).optional(),
  teamId: z.string().min(1).optional(),
  testType: z.enum(["HEXACO", "HEXACO_MODIFIED", "BIG_FIVE"]).default("HEXACO"),
});

// POST /api/manager/candidates — create a new candidate invite
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const manager = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true, username: true, email: true },
  });
  if (!manager || manager.role !== "MANAGER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = createSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: body.error.flatten() }, { status: 400 });
  }

  const { email, name, position, teamId, testType } = body.data;

  // Verify team ownership if teamId provided
  if (teamId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true },
    });
    if (!team || team.ownerId !== manager.id) {
      return NextResponse.json({ error: "TEAM_NOT_FOUND" }, { status: 404 });
    }
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const invite = await prisma.candidateInvite.create({
    data: {
      managerId: manager.id,
      teamId: teamId ?? null,
      email: email ?? null,
      name: name ?? null,
      position: position ?? null,
      testType,
      expiresAt,
    },
    select: {
      id: true,
      token: true,
      email: true,
      name: true,
      position: true,
      testType: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      teamId: true,
    },
  });

  let emailSent = false;
  if (email) {
    const managerName = manager.username ?? manager.email ?? "HR";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io";
    emailSent = await sendCandidateInviteEmail({
      to: email,
      managerName,
      token: invite.token,
      position: position,
      applyUrl: `${appUrl}/apply/${invite.token}`,
    });
  }

  return NextResponse.json({ invite, emailSent }, { status: 201 });
}

// GET /api/manager/candidates — list all candidate invites for this manager
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const manager = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });
  if (!manager || manager.role !== "MANAGER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const invites = await prisma.candidateInvite.findMany({
    where: { managerId: manager.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      email: true,
      name: true,
      position: true,
      testType: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      completedAt: true,
      teamId: true,
      team: { select: { id: true, name: true } },
      result: {
        select: { id: true, scores: true, testType: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ invites });
}
