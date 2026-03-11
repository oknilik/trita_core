import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAssessmentDraftReminderEmail } from "@/lib/emails";
import { normalizeLocale } from "@/lib/i18n";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const draft = await prisma.assessmentDraft.findUnique({
    where: { id },
    include: {
      userProfile: { select: { email: true, username: true, locale: true } },
    },
  });

  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!draft.userProfile.email) {
    return NextResponse.json({ error: "User has no email" }, { status: 400 });
  }

  // Verify user has no completed assessment already
  const hasResult = await prisma.assessmentResult.findFirst({
    where: { userProfileId: draft.userProfileId },
  });
  if (hasResult) {
    return NextResponse.json({ error: "User already completed assessment" }, { status: 400 });
  }

  const locale = normalizeLocale(draft.userProfile.locale);
  const config = getTestConfig(draft.testType as TestType, locale);
  const totalCount = config.questions.length;
  const answeredCount = Object.keys(draft.answers as Record<string, number>).length;
  const name = draft.userProfile.username ?? draft.userProfile.email;

  await sendAssessmentDraftReminderEmail({
    to: draft.userProfile.email,
    name,
    testName: config.name,
    answeredCount,
    totalCount,
    locale,
  });

  const sentAt = new Date();
  await prisma.assessmentDraft.update({
    where: { id },
    data: {
      draftReminderCount: { increment: 1 },
      lastDraftReminderSentAt: sentAt,
    },
  });

  return NextResponse.json({ ok: true, sentAt: sentAt.toISOString() });
}
