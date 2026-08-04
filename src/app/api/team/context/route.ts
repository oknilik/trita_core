import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getActiveTeamMembership,
  listTeamMemberships,
  setActiveTeamContext,
} from "@/lib/team-context";

const bodySchema = z.object({
  teamId: z.string().min(1),
});

// GET /api/team/context — kijelölt csapat + elérhető csapat-tagságok
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const [active, memberships] = await Promise.all([
    getActiveTeamMembership(profile.id),
    listTeamMemberships(profile.id),
  ]);

  return NextResponse.json({
    activeTeamId: active?.teamId ?? null,
    teams: memberships,
  });
}

// POST /api/team/context — kijelölt csapat váltása (csak saját tagságra)
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const membership = await setActiveTeamContext(profile.id, body.data.teamId);
  if (!membership) return NextResponse.json({ error: "NOT_A_MEMBER" }, { status: 403 });

  return NextResponse.json({ ok: true, activeTeamId: membership.teamId });
}
