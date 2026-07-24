import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

// Visszajelzés-kérés (peer feedback F2) — a címzett indítja, ő dönt az
// anonim-opcióról. Terv: docs/product/peer-feedback-terv.md

const postSchema = z.object({
  topic: z.string().trim().min(3).max(200),
  audienceIds: z.array(z.string().min(1)).min(1).max(20),
  allowAnonymous: z.boolean().default(false),
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

// GET — a peer feedback szekció teljes adatcsomagja a bejelentkezett tagnak:
//   mine: a saját kéréseim a beérkezett válaszokkal (anonimitás-szabállyal)
//   forMe: nyitott kérések, amikben felkértek és még nem válaszoltam
//   suggestions: kampány-körből kapott feedforward-javaslataim
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id: teamId } = await params;

  const me = await resolveMember(teamId, userId);
  if (!me) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const [requests, myResponses, campaignSuggestions] = await Promise.all([
    prisma.feedbackRequest.findMany({
      where: { teamId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        askerId: true,
        topic: true,
        allowAnonymous: true,
        status: true,
        audienceIds: true,
        createdAt: true,
        asker: { select: { username: true, email: true } },
        items: {
          select: {
            id: true,
            fromUserId: true,
            visibility: true,
            payload: true,
            createdAt: true,
            from: { select: { username: true, email: true } },
          },
        },
      },
    }),
    prisma.peerFeedbackItem.findMany({
      where: { teamId, fromUserId: me.id, requestId: { not: null } },
      select: { requestId: true },
    }),
    prisma.peerFeedbackItem.findMany({
      where: {
        teamId,
        toUserId: me.id,
        kind: "feedforward",
        campaignId: { not: null },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        campaignId: true,
        visibility: true,
        payload: true,
        createdAt: true,
        from: { select: { username: true, email: true } },
      },
    }),
  ]);

  const respondedRequestIds = new Set(myResponses.map((r) => r.requestId));

  const mine = requests
    .filter((request) => request.askerId === me.id)
    .map((request) => ({
      id: request.id,
      topic: request.topic,
      allowAnonymous: request.allowAnonymous,
      status: request.status,
      audienceCount: Array.isArray(request.audienceIds)
        ? (request.audienceIds as string[]).length
        : 0,
      createdAt: request.createdAt.toISOString(),
      responses: request.items.map((item) => {
        const payload = item.payload as {
          continueText?: string;
          tryText?: string;
          comment?: string;
        };
        const anonymous = item.visibility === "anonymous_aggregated";
        return {
          id: item.id,
          fromName: anonymous ? null : item.from.username ?? item.from.email ?? "—",
          continueText: payload.continueText ?? "",
          tryText: payload.tryText ?? "",
          comment: anonymous ? null : payload.comment ?? null,
        };
      }),
    }));

  const forMe = requests
    .filter(
      (request) =>
        request.status === "open" &&
        request.askerId !== me.id &&
        Array.isArray(request.audienceIds) &&
        (request.audienceIds as string[]).includes(me.id) &&
        !respondedRequestIds.has(request.id),
    )
    .map((request) => ({
      id: request.id,
      topic: request.topic,
      allowAnonymous: request.allowAnonymous,
      askerName: request.asker.username ?? request.asker.email ?? "—",
      createdAt: request.createdAt.toISOString(),
    }));

  // Kampány-javaslatok: nevesített azonnal látszik; anonim-aggregált csak
  // kampányonként legalább 3 beküldőtől, név nélkül (a sorrend beküldési
  // idő szerinti, ami n>=3-nál már nem visszafejthető).
  const byCampaign = new Map<string, typeof campaignSuggestions>();
  for (const item of campaignSuggestions) {
    const list = byCampaign.get(item.campaignId as string) ?? [];
    list.push(item);
    byCampaign.set(item.campaignId as string, list);
  }
  const suggestions: Array<{
    id: string;
    fromName: string | null;
    continueText: string;
    tryText: string;
  }> = [];
  let pendingAnonymous = 0;
  for (const list of byCampaign.values()) {
    const anonymousItems = list.filter((i) => i.visibility === "anonymous_aggregated");
    const namedItems = list.filter((i) => i.visibility !== "anonymous_aggregated");
    for (const item of namedItems) {
      const payload = item.payload as { continueText?: string; tryText?: string };
      suggestions.push({
        id: item.id,
        fromName: item.from.username ?? item.from.email ?? "—",
        continueText: payload.continueText ?? "",
        tryText: payload.tryText ?? "",
      });
    }
    if (anonymousItems.length >= 3) {
      for (const item of anonymousItems) {
        const payload = item.payload as { continueText?: string; tryText?: string };
        suggestions.push({
          id: item.id,
          fromName: null,
          continueText: payload.continueText ?? "",
          tryText: payload.tryText ?? "",
        });
      }
    } else {
      pendingAnonymous += anonymousItems.length;
    }
  }

  return NextResponse.json({ meId: me.id, mine, forMe, suggestions, pendingAnonymous });
}

// POST — új visszajelzés-kérés
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

  const audienceIds = [...new Set(body.data.audienceIds)].filter((id) => id !== me.id);
  if (audienceIds.length === 0) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const memberships = await prisma.teamMember.findMany({
    where: { teamId, userId: { in: audienceIds } },
    select: { userId: true },
  });
  if (memberships.length !== audienceIds.length) {
    return NextResponse.json({ error: "NOT_TEAM_MEMBER" }, { status: 400 });
  }

  const request = await prisma.feedbackRequest.create({
    data: {
      teamId,
      askerId: me.id,
      topic: body.data.topic,
      allowAnonymous: body.data.allowAnonymous,
      audienceIds,
    },
    select: { id: true },
  });

  import("@/lib/notifications").then(({ handlePeerFeedbackRequested }) =>
    handlePeerFeedbackRequested({
      requestId: request.id,
      teamId,
      askerName: me.username ?? me.email ?? "—",
      topic: body.data.topic,
      audienceIds,
    }).catch((err) => console.error("[Notification] Feedback request error:", err)),
  );

  return NextResponse.json({ ok: true, id: request.id }, { status: 201 });
}
