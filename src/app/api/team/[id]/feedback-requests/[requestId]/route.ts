import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

// Válasz egy visszajelzés-kérésre (peer feedback F2) — feedforward-struktúra:
// „Folytasd, mert…" + „Jövőre próbáld…" (+ szabad megjegyzés CSAK nevesítve).

const respondSchema = z.object({
  continueText: z.string().trim().min(3).max(400),
  tryText: z.string().trim().min(3).max(400),
  comment: z.string().trim().max(400).optional(),
  anonymous: z.boolean().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id: teamId, requestId } = await params;

  const rateLimited = await checkRateLimit("api", userId);
  if (rateLimited) return rateLimited;

  const body = respondSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const request = await prisma.feedbackRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      teamId: true,
      askerId: true,
      allowAnonymous: true,
      status: true,
      audienceIds: true,
      team: { select: { name: true } },
    },
  });
  if (!request || request.teamId !== teamId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (request.status !== "open") {
    return NextResponse.json({ error: "REQUEST_CLOSED" }, { status: 409 });
  }
  const audience = Array.isArray(request.audienceIds)
    ? (request.audienceIds as string[])
    : [];
  if (!audience.includes(profile.id)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (body.data.anonymous && !request.allowAnonymous) {
    return NextResponse.json({ error: "ANONYMOUS_NOT_ALLOWED" }, { status: 400 });
  }

  const existing = await prisma.peerFeedbackItem.findFirst({
    where: { requestId, fromUserId: profile.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "ALREADY_RESPONDED" }, { status: 409 });
  }

  // Anonim válasznál nincs szabad megjegyzés (a stílus deanonimizál) —
  // a strukturált mezők maradnak.
  const payload: Record<string, string> = {
    continueText: body.data.continueText,
    tryText: body.data.tryText,
  };
  if (!body.data.anonymous && body.data.comment) payload.comment = body.data.comment;

  const item = await prisma.peerFeedbackItem.create({
    data: {
      teamId,
      requestId,
      fromUserId: profile.id,
      toUserId: request.askerId,
      kind: "feedforward",
      visibility: body.data.anonymous ? "anonymous_aggregated" : "named",
      payload,
    },
    select: { id: true },
  });

  import("@/lib/notifications").then(({ handlePeerFeedbackResponse }) =>
    handlePeerFeedbackResponse({
      itemId: item.id,
      requestId,
      askerId: request.askerId,
      teamId,
      teamName: request.team.name,
    }).catch((err) => console.error("[Notification] Feedback response error:", err)),
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}

// PATCH — a kérő lezárja a saját kérését
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id: teamId, requestId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const request = await prisma.feedbackRequest.findUnique({
    where: { id: requestId },
    select: { id: true, teamId: true, askerId: true },
  });
  if (!request || request.teamId !== teamId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (request.askerId !== profile.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.feedbackRequest.update({
    where: { id: requestId },
    data: { status: "closed" },
  });
  return NextResponse.json({ ok: true });
}
