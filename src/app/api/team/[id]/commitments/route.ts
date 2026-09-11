import { getServerAuth } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commitmentMutationSchema, commitmentPatchSchema } from "@/lib/team-commitment-schema";
import { getTeamCommitmentsWorkspace, mutateTeamCommitments } from "@/lib/team-commitments.server";

type RouteContext = { params: Promise<{ id: string }> };

async function profileId() {
  const { userId } = await getServerAuth();
  if (!userId) return null;
  const profile = await prisma.userProfile.findUnique({ where: { clerkId: userId }, select: { id: true, deleted: true } });
  return profile && !profile.deleted ? profile.id : null;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const [viewerId, { id }] = await Promise.all([profileId(), params]);
  if (!viewerId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const result = await getTeamCommitmentsWorkspace(id, viewerId);
  return "error" in result
    ? NextResponse.json({ error: result.error }, { status: result.status })
    : NextResponse.json(result.workspace);
}

async function mutate(request: Request, { params }: RouteContext, method: "POST" | "PATCH") {
  const [viewerId, { id }] = await Promise.all([profileId(), params]);
  if (!viewerId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const schema = method === "POST" ? commitmentMutationSchema : commitmentPatchSchema;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const result = await mutateTeamCommitments(id, viewerId, parsed.data);
  return "error" in result
    ? NextResponse.json({ error: result.error }, { status: result.status })
    : NextResponse.json({ ok: true, workspace: result.workspace });
}

export async function POST(request: Request, context: RouteContext) { return mutate(request, context, "POST"); }
export async function PATCH(request: Request, context: RouteContext) { return mutate(request, context, "PATCH"); }
