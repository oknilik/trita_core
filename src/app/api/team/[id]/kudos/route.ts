import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";

// Kollégai köszönet (kudos) — peer feedback F1 (terv:
// docs/product/peer-feedback-terv.md). Nevesített, csapaton belüli elismerés;
// alapból címzett-privát, opcionálisan a csapat kudos-folyamában is látható.
// A fejlesztő visszajelzés (F2/F3) külön kör.

const KUDOS_EMOJIS = ["🙌", "👏", "🙏", "🚀", "💡", "❤️", "🎯", "🏆"] as const;

const postSchema = z.object({
  toUserId: z.string().min(1),
  message: z.string().trim().min(3).max(400),
  emoji: z.enum(KUDOS_EMOJIS).optional(),
  shareWithTeam: z.boolean().optional().default(false),
});

const patchSchema = z.object({
  itemId: z.string().min(1),
  action: z.literal("hideFromTeam"),
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

const kudosSelect = {
  id: true,
  fromUserId: true,
  toUserId: true,
  payload: true,
  teamVisible: true,
  teamHiddenAt: true,
  createdAt: true,
  from: { select: { username: true, email: true } },
  to: { select: { username: true, email: true } },
} as const;

function serializeKudos(
  item: {
    id: string;
    fromUserId: string;
    toUserId: string;
    payload: unknown;
    teamVisible: boolean;
    teamHiddenAt: Date | null;
    createdAt: Date;
    from: { username: string | null; email: string | null };
    to: { username: string | null; email: string | null };
  },
  meId: string,
) {
  const payload = item.payload as { message?: string; emoji?: string };
  return {
    id: item.id,
    direction: item.toUserId === meId ? "received" : "sent",
    fromName: item.from.username ?? item.from.email ?? "—",
    toName: item.to.username ?? item.to.email ?? "—",
    message: payload.message ?? "",
    emoji: payload.emoji ?? null,
    teamVisible: item.teamVisible && item.teamHiddenAt === null,
    canHideFromTeam:
      item.teamVisible && item.teamHiddenAt === null &&
      (item.fromUserId === meId || item.toUserId === meId),
    createdAt: item.createdAt.toISOString(),
  };
}

// GET /api/team/[id]/kudos — a saját kapott + küldött köszönetek, valamint
// a csapatnak tudatosan megosztott (és azóta el nem rejtett) kudos-folyam.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id: teamId } = await params;

  const me = await resolveMember(teamId, userId);
  if (!me) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const [items, teamItems] = await Promise.all([
    prisma.peerFeedbackItem.findMany({
      where: {
        teamId,
        kind: "appreciation",
        OR: [{ toUserId: me.id }, { fromUserId: me.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: kudosSelect,
    }),
    prisma.peerFeedbackItem.findMany({
      where: {
        teamId,
        kind: "appreciation",
        teamVisible: true,
        teamHiddenAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: kudosSelect,
    }),
  ]);

  return NextResponse.json({
    meId: me.id,
    items: items.map((item) => serializeKudos(item, me.id)),
    teamItems: teamItems.map((item) => serializeKudos(item, me.id)),
  });
}

// POST /api/team/[id]/kudos — köszönet küldése csapattársnak
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const log = await getRequestLogger("team");
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
      teamVisible: body.data.shareWithTeam,
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
    }).catch((err) => log.error({ event: "team.peer_kudos_error", err: err }, "Peer kudos error")),
  );

  return NextResponse.json({ ok: true, id: item.id }, { status: 201 });
}

// PATCH /api/team/[id]/kudos — a küldő vagy a címzett visszavonhatja a
// csapatszintű megjelenést. A személyes kudos ettől nem törlődik.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id: teamId } = await params;

  const body = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const me = await resolveMember(teamId, userId);
  if (!me) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const item = await prisma.peerFeedbackItem.findFirst({
    where: {
      id: body.data.itemId,
      teamId,
      kind: "appreciation",
      teamVisible: true,
      OR: [{ fromUserId: me.id }, { toUserId: me.id }],
    },
    select: { id: true },
  });
  if (!item) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.peerFeedbackItem.update({
    where: { id: item.id },
    data: { teamHiddenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
