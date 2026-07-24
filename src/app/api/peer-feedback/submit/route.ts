import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isStepOpenFor } from "@/lib/campaign-steps-core";
import { advanceCampaignStepForUser } from "@/lib/campaign-steps";

// Kampány-lépés: kollégai visszajelzés kör (peer feedback F3).
// Egy beadás fedi az összes csapattársat: tagonként opcionális elismerés +
// kötelező feedforward-pár. A feedforward láthatóságát a kampány
// peerFeedbackAnonymous flagje dönti el; az elismerés MINDIG nevesített.
// Zárolt/nem aktuális lépésnél 409 (STEP_LOCKED) — a kanonikus kapu-minta.

const submitSchema = z.object({
  campaignId: z.string().min(1),
  entries: z
    .array(
      z.object({
        toUserId: z.string().min(1),
        appreciation: z.string().trim().max(400).optional(),
        continueText: z.string().trim().min(3).max(400),
        tryText: z.string().trim().min(3).max(400),
      }),
    )
    .min(1)
    .max(30),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const rateLimited = await checkRateLimit("api", userId);
  if (rateLimited) return rateLimited;

  const body = submitSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true, email: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const participant = await prisma.campaignParticipant.findUnique({
    where: {
      campaignId_userId: { campaignId: body.data.campaignId, userId: profile.id },
    },
    select: {
      currentStep: true,
      nextStepOpensAt: true,
      campaign: {
        select: {
          id: true,
          status: true,
          type: true,
          steps: true,
          teamId: true,
          peerFeedbackAnonymous: true,
        },
      },
    },
  });
  if (!participant) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (participant.campaign.status !== "ACTIVE") {
    return NextResponse.json({ error: "CAMPAIGN_NOT_ACTIVE" }, { status: 409 });
  }
  if (!isStepOpenFor(participant.campaign, participant, "PEER_FEEDBACK")) {
    return NextResponse.json({ error: "STEP_LOCKED" }, { status: 409 });
  }
  const teamId = participant.campaign.teamId;
  if (!teamId) return NextResponse.json({ error: "INVALID_CAMPAIGN" }, { status: 400 });
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });

  // Minden címzett a cél-csapat tagja, önmagunk kizárva
  const targetIds = [...new Set(body.data.entries.map((e) => e.toUserId))].filter(
    (id) => id !== profile.id,
  );
  if (targetIds.length !== body.data.entries.length) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const memberships = await prisma.teamMember.findMany({
    where: { teamId, userId: { in: targetIds } },
    select: { userId: true },
  });
  if (memberships.length !== targetIds.length) {
    return NextResponse.json({ error: "NOT_TEAM_MEMBER" }, { status: 400 });
  }

  // Idempotencia: akinek ebben a kampányban már adtam feedforwardot, kihagyjuk
  const already = await prisma.peerFeedbackItem.findMany({
    where: {
      campaignId: participant.campaign.id,
      fromUserId: profile.id,
      kind: "feedforward",
    },
    select: { toUserId: true },
  });
  const alreadySet = new Set(already.map((a) => a.toUserId));
  const fresh = body.data.entries.filter((e) => !alreadySet.has(e.toUserId));

  const visibility = participant.campaign.peerFeedbackAnonymous
    ? "anonymous_aggregated"
    : "named";

  const kudosTargets: Array<{ itemId: string; toUserId: string }> = [];
  for (const entry of fresh) {
    await prisma.peerFeedbackItem.create({
      data: {
        teamId,
        campaignId: participant.campaign.id,
        fromUserId: profile.id,
        toUserId: entry.toUserId,
        kind: "feedforward",
        visibility,
        payload: { continueText: entry.continueText, tryText: entry.tryText },
      },
    });
    if (entry.appreciation && entry.appreciation.length >= 3) {
      const kudos = await prisma.peerFeedbackItem.create({
        data: {
          teamId,
          campaignId: participant.campaign.id,
          fromUserId: profile.id,
          toUserId: entry.toUserId,
          kind: "appreciation",
          visibility: "named",
          payload: { message: entry.appreciation },
        },
        select: { id: true },
      });
      kudosTargets.push({ itemId: kudos.id, toUserId: entry.toUserId });
    }
  }

  // Elismerés-értesítések (nevesített) — fire-and-forget
  if (kudosTargets.length > 0) {
    import("@/lib/notifications").then(({ handlePeerKudosReceived }) =>
      Promise.allSettled(
        kudosTargets.map((k) =>
          handlePeerKudosReceived({
            itemId: k.itemId,
            toUserId: k.toUserId,
            fromName: profile.username ?? profile.email ?? "—",
            teamId,
            teamName: team?.name ?? "",
          }),
        ),
      ),
    );
  }

  // Lépés-teljesítés lekönyvelése
  await advanceCampaignStepForUser(profile.id, "PEER_FEEDBACK").catch(() => {});

  return NextResponse.json({ ok: true, created: fresh.length });
}
