import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getActiveOrgMembership,
  listActiveOrgMemberships,
  setActiveOrgContext,
} from "@/lib/org-context";

const bodySchema = z.object({
  orgId: z.string().min(1),
});

// GET /api/org/context — returns active org context + accessible org memberships
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const [activeMembership, memberships] = await Promise.all([
    getActiveOrgMembership(profile.id),
    listActiveOrgMemberships(profile.id),
  ]);

  const orgIds = [...new Set(memberships.map((m) => m.orgId))];
  const [orgs, teamMemberships] = await Promise.all([
    orgIds.length > 0
      ? prisma.organization.findMany({
          where: { id: { in: orgIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    prisma.teamMember.findMany({
      where: { userId: profile.id },
      select: { team: { select: { id: true, name: true, orgId: true } } },
    }),
  ]);
  const orgNameById = new Map(orgs.map((org) => [org.id, org.name]));

  return NextResponse.json({
    activeOrgId: activeMembership?.orgId ?? null,
    memberships: memberships.map((m) => ({
      ...m,
      orgName: orgNameById.get(m.orgId) ?? null,
    })),
    teams: teamMemberships.map(({ team }) => ({
      id: team.id,
      name: team.name,
      orgId: team.orgId,
    })),
  });
}

// POST /api/org/context — sets active org context if the user has membership in that org
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const membership = await setActiveOrgContext(profile.id, parsed.data.orgId);
  if (!membership) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  return NextResponse.json({
    ok: true,
    activeOrgId: membership.orgId,
    role: membership.role,
  });
}
