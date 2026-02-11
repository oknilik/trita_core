import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendObserverInviteEmail } from "@/lib/emails";
import { normalizeLocale } from "@/lib/i18n";

const inviteSchema = z
  .object({
    email: z.string().email().optional(),
    name: z.string().min(1).max(100).optional(),
  })
  .strict();

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
  });

  if (!profile || !profile.testType) {
    return NextResponse.json({ error: "NO_TEST_TYPE" }, { status: 400 });
  }

  // Prevent self-invite
  if (
    parsed.data.email &&
    profile.email &&
    parsed.data.email.toLowerCase() === profile.email.toLowerCase()
  ) {
    return NextResponse.json({ error: "SELF_INVITE" }, { status: 400 });
  }

  const activeCount = await prisma.observerInvitation.count({
    where: {
      inviterId: profile.id,
      status: { not: "CANCELED" },
    },
  });
  if (activeCount >= 5) {
    return NextResponse.json({ error: "INVITE_LIMIT_REACHED" }, { status: 400 });
  }

  const invitation = await prisma.observerInvitation.create({
    data: {
      inviterId: profile.id,
      observerEmail: parsed.data.email ?? null,
      observerName: parsed.data.name ?? null,
      testType: profile.testType,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  let emailSent = false;
  if (parsed.data.email) {
    try {
      const existingUser = await prisma.userProfile.findFirst({
        where: { email: { equals: parsed.data.email, mode: "insensitive" } },
        select: { username: true },
      });
      // Always use the inviter's preferred locale
      const emailLocale = normalizeLocale(profile.locale);
      await sendObserverInviteEmail({
        to: parsed.data.email,
        inviterName: profile.username ?? profile.email ?? "Trita",
        recipientName: existingUser?.username ?? parsed.data.name,
        token: invitation.token,
        locale: emailLocale,
      });
      emailSent = true;
    } catch (err) {
      console.error("Failed to send observer invite email:", err);
    }
  }

  return NextResponse.json({
    id: invitation.id,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
    emailSent,
  });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
  });

  if (!profile) {
    return NextResponse.json({ invitations: [] });
  }

  const invitations = await prisma.observerInvitation.findMany({
    where: { inviterId: profile.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      status: true,
      createdAt: true,
      expiresAt: true,
      completedAt: true,
      observerEmail: true,
    },
  });

  return NextResponse.json({ invitations });
}
