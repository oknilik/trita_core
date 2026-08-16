import { NextResponse } from "next/server";
import { z } from "zod";
import { getAcceptedAnswerIds, isCompleteFormAnswerSet } from "@/lib/questions";
import { prisma } from "@/lib/prisma";
import { calculateScores } from "@/lib/scoring";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveGuestClaimViewerClerkId } from "@/lib/guest-claim-auth";
import {
  advanceCampaignStepForUser,
  resolveActiveSelfAssessmentCampaign,
} from "@/lib/campaign-steps";

const answerSchema = z.object({
  questionId: z.number().int().positive(),
  value: z.number().int().min(1).max(5),
});

const claimSchema = z.object({
  // Felső mérethatár: a legnagyobb élő forma 100 item; 150 elég a valós
  // beküldésnek, de kizárja a memória-terhelő túlméretes tömböt.
  answers: z.array(answerSchema).max(150),
});

export async function POST(req: Request) {
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await resolveGuestClaimViewerClerkId();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { answers } = parsed.data;
  const testType = "TRITAN" as const;

  // Find or create profile, force-assign TRITAN
  const profile = await prisma.userProfile.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId, testType, testTypeAssignedAt: new Date() },
    update: {},
  });

  // If profile has no test type, assign TRITAN
  if (!profile.testType) {
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { testType, testTypeAssignedAt: new Date() },
    });
  }

  // Validate answers against TRITAN config — a rövid (TSFI-S) és a teljes
  // forma hiánytalan kitöltése egyaránt érvényes, ahogy egy KORÁBBI rövid
  // forma pontos id-halmaza is. Ez itt a legélesebb: a vendég-draft napokig
  // (a claim-ig) a localStorage-ban ül, és a /try/claim SZŰRETLENÜL küldi be
  // — forma-váltás után enélkül minden régi draft claimje elbukna.
  const expectedIds = getAcceptedAnswerIds(testType);
  const relevantAnswers = answers.filter((a) => expectedIds.has(a.questionId));

  const answeredIds = new Set(relevantAnswers.map((a) => a.questionId));
  if (answeredIds.size !== relevantAnswers.length) {
    return NextResponse.json(
      { error: "DUPLICATE_ANSWER" },
      { status: 400 },
    );
  }

  if (!isCompleteFormAnswerSet(testType, answeredIds)) {
    return NextResponse.json(
      { error: "ANSWER_COUNT_MISMATCH" },
      { status: 400 },
    );
  }

  const typedAnswers = relevantAnswers.map((a) => ({
    questionId: a.questionId,
    value: Number(a.value),
  }));

  // Duplikált claim-védelem (idempotencia): a kliens hiba után újrapróbál
  // (retry gomb), és a válasz azután is elveszhet, hogy a mentés a szerveren
  // már sikerült. Ha a user legutóbbi self-eredménye UGYANEZT a
  // válaszkészletet hordozza, nem írunk új sort — a meglévő eredmény id-ja
  // megy vissza. Eltérő válaszkészlet (újrakitöltés) továbbra is új eredmény.
  const canonicalAnswers = (list: Array<{ questionId: number; value: number }>) =>
    JSON.stringify(
      [...list]
        .sort((a, b) => a.questionId - b.questionId)
        .map((a) => [a.questionId, a.value]),
    );

  const latestSelf = await prisma.assessmentResult.findFirst({
    where: { userProfileId: profile.id, isSelfAssessment: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, scores: true },
  });
  if (latestSelf) {
    const storedAnswers = (latestSelf.scores as { answers?: unknown } | null)
      ?.answers;
    const storedTyped = Array.isArray(storedAnswers)
      ? storedAnswers.filter(
          (a): a is { questionId: number; value: number } =>
            typeof a === "object" &&
            a !== null &&
            typeof (a as { questionId?: unknown }).questionId === "number" &&
            typeof (a as { value?: unknown }).value === "number",
        )
      : null;
    if (
      storedTyped &&
      canonicalAnswers(storedTyped) === canonicalAnswers(typedAnswers)
    ) {
      return NextResponse.json({ id: latestSelf.id, alreadyClaimed: true });
    }
  }

  const scores = calculateScores(testType, typedAnswers);
  const campaignStep = await resolveActiveSelfAssessmentCampaign(profile.id);
  const campaignId = campaignStep?.campaignId ?? null;

  const result = await prisma.assessmentResult.create({
    data: {
      userProfileId: profile.id,
      campaignId,
      testType,
      scores: {
        ...scores,
        answers: relevantAnswers,
        questionCount: relevantAnswers.length,
      },
    },
  });

  // Ugyanazt az egy, determinisztikusan feloldott kört címkézzük és
  // léptetjük, mint a normál self-submit út. Két átfedő kampányt egyetlen
  // guest-claim soha nem zárhat le.
  if (campaignStep) {
    advanceCampaignStepForUser(profile.id, campaignStep.stepType, {
      campaignId: campaignStep.campaignId,
    }).catch(() => {});
  }

  return NextResponse.json({ id: result.id });
}
