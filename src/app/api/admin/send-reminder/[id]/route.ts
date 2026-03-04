import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendObserverInviteEmail } from "@/lib/emails";
import { normalizeLocale } from "@/lib/i18n";

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

  const invitation = await prisma.observerInvitation.findUnique({
    where: { id },
    include: {
      inviter: { select: { username: true, email: true, locale: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (invitation.status !== "PENDING") {
    return NextResponse.json({ error: "Invitation is not pending" }, { status: 400 });
  }
  if (!invitation.observerEmail) {
    return NextResponse.json({ error: "No email on invitation" }, { status: 400 });
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invitation expired" }, { status: 400 });
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
