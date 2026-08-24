import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendObserverInviteEmail } from "@/lib/emails";
import { normalizeLocale } from "@/lib/i18n";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let adminUserId: string;
  try {
    ({ userId: adminUserId } = await requireAdmin());
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const rateLimited = await checkRateLimit("contact", adminUserId);
  if (rateLimited) return rateLimited;

  const { id } = await params;

  const invitation = await prisma.observerInvitation.findUnique({
    where: { id },
    include: {
      inviter: { select: { username: true, email: true, locale: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (invitation.status !== "PENDING") {
    return NextResponse.json({ error: "INVITATION_NOT_PENDING" }, { status: 400 });
  }
  if (!invitation.observerEmail) {
    return NextResponse.json({ error: "EMAIL_MISSING" }, { status: 400 });
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "INVITATION_EXPIRED" }, { status: 400 });
  }

  const inviterName =
    invitation.inviter.username ?? invitation.inviter.email ?? "Trita";
  const locale = normalizeLocale(invitation.inviter.locale);

  await sendObserverInviteEmail({
    to: invitation.observerEmail,
    inviterName,
    token: invitation.token,
    recipientName: invitation.observerName ?? undefined,
    locale,
    isReminder: true,
  });

  const sentAt = new Date();
  await prisma.observerInvitation.update({
    where: { id },
    data: {
      reminderCount: { increment: 1 },
      lastReminderSentAt: sentAt,
    },
  });

  return NextResponse.json({ ok: true, sentAt: sentAt.toISOString() });
}
