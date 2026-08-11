import type { TestType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTestConfig, isCompleteFormAnswerSet } from "@/lib/questions";
import { prisma } from "@/lib/prisma";
import { calculateScores } from "@/lib/scoring";
import { sendObserverCompletionEmail } from "@/lib/emails";
import { getRequestLogger } from "@/lib/logger.server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  resolveObserverTokenLifecycle,
  toObserverTokenErrorCode,
  isObserverSelfSubmission,
} from "@/lib/observer/token-validation";
import { resolveObserverSubmitViewerClerkId } from "@/lib/observer/submit-auth";
import { trackServerEvent } from "@/lib/analytics/server";
import { OBSERVER_MIN_FOR_REVEAL } from "@/lib/observer-flow";

const answerSchema = z.object({
  questionId: z.number().int().positive(),
  value: z.number().int().min(1).max(5),
});

const submitSchema = z.object({
  token: z.string().min(1),
  relationshipType: z.enum(["FRIEND", "COLLEAGUE", "FAMILY", "PARTNER", "OTHER"]),
  knownDuration: z.string().min(1),
  // Felső mérethatár: a legnagyobb élő forma 100 item — 150 bőven elég a
  // valós (esetleg elavult id-kat is hordozó) beküldésnek, de kizárja a
  // memória-terhelő túlméretes tömböt. A releváns id-kra szűrés utána fut.
  answers: z.array(answerSchema).max(150),
  confidence: z.number().int().min(1).max(5).optional(),
});

export async function POST(req: Request) {
  const log = await getRequestLogger("observer");
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token, relationshipType, knownDuration, answers, confidence } = parsed.data;

  const invitation = await prisma.observerInvitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 404 });
  }

  const lifecycle = resolveObserverTokenLifecycle(invitation);
  if (lifecycle !== "active") {
    const code = toObserverTokenErrorCode(lifecycle);
    // A jóváhagyásra váró meghívóra beküldés → 403 (INVITE_NOT_APPROVED):
    // a rater csak jóváhagyott (PENDING) meghívóra küldhet be.
    const status =
      code === "INVALID_TOKEN" ? 404 : code === "INVITE_NOT_APPROVED" ? 403 : 400;
    return NextResponse.json({ error: code }, { status });
  }

  // A beküldő (ha bejelentkezett) feloldott profilja. A külsős úton is
  // feloldjuk — az önhamisítás-tiltás minden observer-típusra érvényes.
  // A néző-feloldás best-effort: ha a Clerk-kontextus nem érhető el (nem
  // dobhat 500-at a publikus beküldés), névtelen (null) beküldőként kezeljük.
  // Éles futásban a clerkMiddleware alatt az auth() a valós usert adja, így
  // az önhamisítás-őr teljes értékű; kontextus nélkül a submitter amúgy sem
  // lehet a bejelentkezett meghívó.
  let viewerClerkId: string | null = null;
  try {
    viewerClerkId = await resolveObserverSubmitViewerClerkId();
  } catch {
    viewerClerkId = null;
  }
  const viewer = viewerClerkId
    ? await prisma.userProfile.findUnique({
        where: { clerkId: viewerClerkId },
        select: { id: true },
      })
    : null;

  // Önhamisítás-védelem: a meghívó (értékelt) SOHA nem küldhet be a saját
  // meghívójára — külső/link-meghívónál is (ott nincs observerProfileId, így
  // az addressee-ellenőrzés nem fogná meg).
  //
  // MARADÉK RÉS (motor-audit W2): ez az őr CSAK akkor tüzel, ha a viewer
  // feloldódik (bejelentkezve). Egy KÜLSŐ (observerProfileId == null) tokenre
  // KIJELENTKEZVE beküldve a viewer null → az őr kimarad, és a beküldés anonim
  // „külső" értékelésként átmegy. Így az értékelt inkognitóban ≥3 hamis külső
  // ratert gyárthat a saját linkjeiről. Belépve a rés zárva (403).
  // A TELJES zárás TERMÉK-DÖNTÉS: vagy (a) a külső submit is bejelentkezést
  // kér (az azonosságot csak a self-check-hez használva, az aggregátumban NEM
  // tárolva) — ez viszont a dokumentált „auth nélküli observer-flow"-t
  // (CLAUDE.md) változtatja meg; vagy (b) strukturális (zajos/karantén
  // aggregátum). Auth-mentesen a token-tulajdonos == értékelt egyezés NEM
  // dönthető el, mert külső tokennél nincs a beküldőhöz kötött profil.
  // Amíg a döntés nincs meg, a rés dokumentált, nem csendes.
  if (isObserverSelfSubmission(viewer?.id, invitation.inviterId)) {
    return NextResponse.json({ error: "SELF_SUBMISSION" }, { status: 403 });
  }

  // Belsős (név szerinti) meghívó: csak a bejelentkezett címzett adhatja be.
  // Külsős meghívónál (nincs observerProfileId) nincs ilyen validáció.
  if (invitation.observerProfileId) {
    if (!viewer || viewer.id !== invitation.observerProfileId) {
      return NextResponse.json({ error: "NOT_ADDRESSEE" }, { status: 403 });
    }
  }

  // Validate all questions answered
  const config = getTestConfig(invitation.testType as TestType);
  const expectedIds = new Set(config.questions.map((q) => q.id));

  // Filter to only the expected question IDs (drops stale answers from old test versions)
  const relevantAnswers = answers.filter((a) => expectedIds.has(a.questionId));

  const answeredIds = new Set(relevantAnswers.map((a) => a.questionId));
  const hasDuplicates = answeredIds.size !== relevantAnswers.length;
  if (hasDuplicates) {
    return NextResponse.json({ error: "DUPLICATE_ANSWER" }, { status: 400 });
  }
  // A rövid (TSFI-S) és a teljes forma hiánytalan kitöltése egyaránt érvényes.
  if (!isCompleteFormAnswerSet(invitation.testType as TestType, answeredIds)) {
    return NextResponse.json({ error: "MISSING_ANSWER" }, { status: 400 });
  }

  for (const answer of relevantAnswers) {
    if (typeof answer.value !== "number" || Number.isNaN(answer.value)) {
      return NextResponse.json({ error: "INVALID_LIKERT_ANSWER" }, { status: 400 });
    }
  }

  // Score
  const typedAnswers = relevantAnswers.map((a) => ({
    questionId: a.questionId,
    value: Number(a.value),
  }));

  const scores = calculateScores(invitation.testType as TestType, typedAnswers);

  // Save observer assessment + update invitation status
  await prisma.$transaction([
    prisma.observerAssessment.create({
      data: {
        invitationId: invitation.id,
        relationshipType,
        knownDuration,
        confidence: confidence ?? null,
        scores: {
          ...scores,
          answers: relevantAnswers,
          questionCount: relevantAnswers.length,
        },
      },
    }),
    prisma.observerInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    }),
    // A szerver-oldali draft a beadással okafogyottá válik — bent hagyva
    // örökre árválkodna (a COMPLETED meghívóhoz draft többé nem olvasható).
    prisma.observerDraft.deleteMany({
      where: { invitationId: invitation.id },
    }),
  ]);

  // Analitika: a meghívó-lánc utolsó lépése (A3). A kitöltő ANONIM marad —
  // az esemény nem hordoz sem meghívó-tokent, sem személy-azonosítót.
  trackServerEvent("observer.assessment_complete", {});

  // In-app notification — notify inviter that observer completed (fire-and-forget).
  // Az értesítés ANONIM: az értékelő nevét NEM hordozza (differencia-támadás
  // elleni mitigáció — a névvel a futó átlagból beazonosítható lenne az utolsó
  // értékelő; ld. results/page.tsx reveal-küszöb megjegyzését).
  import("@/lib/notifications").then(({ handleObserverCompleted }) =>
    handleObserverCompleted({
      inviterId: invitation.inviterId,
      invitationId: invitation.id,
    }).catch((err) => log.error({ event: "observer.observer_completed_error", err: err }, "Observer completed error")),
  );

  // In-app notification — notify observer that their submission was received (if registered user)
  // observerProfileId may be null if the link wasn't opened while signed in,
  // so we also try to match by observerEmail.
  (async () => {
    let observerUserId = invitation.observerProfileId;

    if (!observerUserId && invitation.observerEmail) {
      const observer = await prisma.userProfile.findFirst({
        where: { email: invitation.observerEmail, deleted: false },
        select: { id: true },
      });
      observerUserId = observer?.id ?? null;
    }

    if (!observerUserId) return;

    const inviter = await prisma.userProfile.findUnique({
      where: { id: invitation.inviterId },
      select: { username: true, email: true },
    });
    if (!inviter) return;

    const { handleObserverSubmitted } = await import("@/lib/notifications");
    await handleObserverSubmitted({
      observerUserId,
      inviterName: inviter.username ?? inviter.email ?? "—",
      invitationId: invitation.id,
    });
  })().catch((err) => log.error({ event: "observer.observer_submitted_error", err: err }, "Observer submitted error"));

  // Email — csak az összevetés-küszöb elérésekor (fire-and-forget). A CTA az
  // eredmény-oldalra visz, ami OBSERVER_MIN_FOR_REVEAL-nál nyílik — a korábbi
  // 2-es küszöb egy még zárt nézetre küldte a felhasználót.
  prisma.observerAssessment.count({
    where: {
      invitation: { inviterId: invitation.inviterId },
    },
  }).then(async (completedCount) => {
    if (completedCount < OBSERVER_MIN_FOR_REVEAL) return;
    const inviter = await prisma.userProfile.findUnique({
      where: { id: invitation.inviterId },
      select: { email: true, locale: true, username: true },
    });
    if (!inviter?.email) return;
    const locale = (["hu", "en"].includes(inviter.locale ?? "")
      ? inviter.locale
      : undefined) as "hu" | "en" | undefined;
    sendObserverCompletionEmail({
      to: inviter.email,
      inviterName: inviter.username ?? inviter.email,
      locale,
    }).catch((err) => log.error({ event: "observer.observer_completion_send_error", err: err }, "Observer completion send error"));
  }).catch((err) => log.error({ event: "observer.inviter_lookup_error", err: err }, "Inviter lookup error"));

  return NextResponse.json({ success: true });
}
