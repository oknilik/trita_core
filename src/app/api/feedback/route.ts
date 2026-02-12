import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type FeedbackPayload = {
  agreementScore: number;
  observerFeedbackUsefulness?: number;
  siteUsefulness?: number;
  freeformFeedback?: string;
  interestedInUpdates?: boolean;
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let payload: FeedbackPayload;
  try {
    payload = (await req.json()) as FeedbackPayload;
  } catch {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  const agreementScore = Number(payload.agreementScore);
  if (!Number.isFinite(agreementScore) || agreementScore < 1 || agreementScore > 5) {
    return new NextResponse("Invalid agreement score", { status: 400 });
  }

  // Validate optional fields
  const observerFeedbackUsefulness = payload.observerFeedbackUsefulness != null
    ? Number(payload.observerFeedbackUsefulness)
    : null;
  if (observerFeedbackUsefulness != null && (!Number.isFinite(observerFeedbackUsefulness) || observerFeedbackUsefulness < 1 || observerFeedbackUsefulness > 5)) {
    return new NextResponse("Invalid observer feedback usefulness score", { status: 400 });
  }

  const siteUsefulness = payload.siteUsefulness != null
    ? Number(payload.siteUsefulness)
    : null;
  if (siteUsefulness != null && (!Number.isFinite(siteUsefulness) || siteUsefulness < 1 || siteUsefulness > 5)) {
    return new NextResponse("Invalid site usefulness score", { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!profile) {
    return new NextResponse("Profile not found", { status: 404 });
  }

  const freeform =
    typeof payload.freeformFeedback === "string"
      ? payload.freeformFeedback.trim()
      : "";

  await prisma.satisfactionFeedback.upsert({
    where: { userProfileId: profile.id },
    update: {
      agreementScore,
      observerFeedbackUsefulness,
      siteUsefulness,
      freeformFeedback: freeform.length > 0 ? freeform : null,
      interestedInUpdates: Boolean(payload.interestedInUpdates),
    },
    create: {
      userProfileId: profile.id,
      agreementScore,
      observerFeedbackUsefulness,
      siteUsefulness,
      freeformFeedback: freeform.length > 0 ? freeform : null,
      interestedInUpdates: Boolean(payload.interestedInUpdates),
    },
  });

  return NextResponse.json({ ok: true });
}
