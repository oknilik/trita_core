import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

// Kollégai köszönet (kudos) — peer feedback F1 (terv:
// docs/product/peer-feedback-terv.md). Nevesített, csapaton belüli,
// címzett-privát elismerés; a fejlesztő visszajelzés (F2/F3) külön kör.

const KUDOS_EMOJIS = ["🙌", "👏", "🙏", "🚀", "💡", "❤️", "🎯", "🏆"] as const;

const postSchema = z.object({
  toUserId: z.string().min(1),
  message: z.string().trim().min(3).max(400),
  emoji: z.enum(KUDOS_EMOJIS).optional(),
});

async function resolveMember(teamId: string, clerkId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId },
    select: { id: true, username: true, email: true },
  });
  if (!profile) return null;
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: profile.id } },
    select: { id: true },
  });
  if (!membership) return null;
  return profile;
}

// GET /api/team/[id]/kudos — a saját kapott + küldött köszönetek
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id: teamId } = await params;

  const me = await resolveMember(teamId, userId);
  if (!me) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const items = await prisma.peerFeedbackItem.findMany({
    where: {
      teamId,
      kind: "appreciation",
      OR: [{ toUserId: me.id }, { fromUserId: me.id }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      fromUserId: true,
      toUserId: true,
      payload: true,
      createdAt: true,
      from: { select: { username: true, email: true } },
      to: { select: { username: true, email: true } },
    },
  });

  return NextResponse.json({
    meId: me.id,
    items: items.map((item) => ({
      id: item.id,
      direction: item.toUserId === me.id ? "received" : "sent",
      fromName: item.from.username ?? item.from.email ?? "—",
      toName: item.to.username ?? item.to.email ?? "—",
      message: (item.payload as { message?: string }).message ?? "",
      emoji: (item.payload as { emoji?: string }).emoji ?? null,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}

// POST /api/team/[id]/kudos — köszönet küldése csapattársnak
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id: teamId } = await params;

  const rateLimited = await checkRateLimit("api", userId);
  if (rateLimited) return rateLimited;

  const body = postSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const me = await resolveMember(teamId, userId);
  if (!me) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (body.data.toUserId === me.id) {
    return NextResponse.json({ error: "SELF_KUDOS" }, { status: 400 });
  }

  // A címzett is a csapat tagja kell legyen
  const [target, team] = await Promise.all([
    prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: body.data.toUserId } },
      select: { id: true },
    }),
    prisma.team.findUnique({ where: { id: teamId }, select: { name: true } }),
  ]);
  if (!target || !team) {
    return NextResponse.json({ error: "NOT_TEAM_MEMBER" }, { status: 400 });
  }

  const item = await prisma.peerFeedbackItem.create({
    data: {
      teamId,
      fromUserId: me.id,
      toUserId: body.data.toUserId,
      kind: "appreciation",
      visibility: "named",
      payload: { message: body.data.message, ...(body.data.emoji ? { emoji: body.data.emoji } : {}) },
    },
    select: { id: true, createdAt: true },
  });

  // In-app értesítés a címzettnek — fire-and-forget
  import("@/lib/notifications").then(({ handlePeerKudosReceived }) =>
    handlePeerKudosReceived({
      itemId: item.id,
      toUserId: body.data.toUserId,
      fromName: me.username ?? me.email ?? "—",
      teamId,
      teamName: team.name,
    }).catch((err) => console.error("[Notification] Peer kudos error:", err)),
  );

  return NextResponse.json({ ok: true, id: item.id }, { status: 201 });
}
