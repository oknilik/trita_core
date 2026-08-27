import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { ScoreResult } from "@/lib/scoring";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendCompareInviteEmail } from "@/lib/emails";
import {
  COMPARE_INVITE_MAX_ACTIVE,
  compareInviteExpiry,
  resolveCompareInviteState,
} from "@/lib/compare-invite";
import { resolveCompareInviteViewerClerkId } from "@/lib/compare-invite-auth";
import { getServerLocale } from "@/lib/i18n-server";

const createSchema = z.object({
  // Opcionális: a linket emailben is kiküldjük a címzettnek.
  email: z.string().email().max(320).optional(),
});

// Valódi páros összehasonlítás meghívói (B1).
// POST: új meghívó-link (csak saját kitöltött eredménnyel, max 3 aktív).
// GET: saját meghívók + elfogadott párok (mindkét irányból) a kezelő-kártyához.
// DELETE: visszavonás — bármelyik fél, azonnal hat mindkét oldalon.

async function requireProfileWithResult(clerkId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId },
    select: { id: true, username: true },
  });
  if (!profile) return { profile: null, hasResult: false } as const;

  const latest = await prisma.assessmentResult.findFirst({
    where: { userProfileId: profile.id, isSelfAssessment: true },
    orderBy: { createdAt: "desc" },
    select: { scores: true },
  });
  const scores = latest?.scores as ScoreResult | undefined;
  return {
    profile,
    hasResult: Boolean(scores && scores.type === "likert"),
  } as const;
}

export async function POST(req: Request) {
  const userId = await resolveCompareInviteViewerClerkId();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  // Üres body megengedett (csak link-készítés) — az email opcionális extra.
  const rawBody = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(rawBody ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  if (parsed.data.email) {
    const rateLimited = await checkRateLimit("contact", userId);
    if (rateLimited) return rateLimited;
  }

  const { profile, hasResult } = await requireProfileWithResult(userId);
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!hasResult) {
    return NextResponse.json({ error: "NO_RESULT" }, { status: 409 });
  }

  const now = new Date();
  const sent = await prisma.compareInvite.findMany({
    where: { inviterId: profile.id },
    select: { id: true, status: true, expiresAt: true },
  });
  const activeCount = sent.filter((inv) => {
    const state = resolveCompareInviteState(inv, now);
    return state === "PENDING" || state === "ACCEPTED";
  }).length;
  if (activeCount >= COMPARE_INVITE_MAX_ACTIVE) {
    return NextResponse.json({ error: "COMPARE_LIMIT_REACHED" }, { status: 409 });
  }

  const invite = await prisma.compareInvite.create({
    data: {
      inviterId: profile.id,
      expiresAt: compareInviteExpiry(now),
    },
    select: { id: true, token: true },
  });

  // Email-küldés best-effort: hiba esetén a link attól még él és
  // másolható — a válasz jelzi, hogy a kézbesítés nem sikerült.
  let emailSent = false;
  let emailError: string | null = null;
  if (parsed.data.email) {
    try {
      await sendCompareInviteEmail({
        to: parsed.data.email,
        senderName: profile.username ?? "–",
        token: invite.token,
        // A címzettnek nincs fiókja, tehát tárolt nyelve sincs — a küldő
        // felületi nyelve a legjobb elérhető tudás.
        locale: await getServerLocale(),
      });
      emailSent = true;
    } catch {
      emailError = "EMAIL_SEND_FAILED";
    }
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return NextResponse.json({
    id: invite.id,
    token: invite.token,
    url: `${base}/interaction/compare/${invite.token}`,
    emailSent,
    emailError,
  });
}

export async function GET() {
  const userId = await resolveCompareInviteViewerClerkId();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const now = new Date();
  const invites = await prisma.compareInvite.findMany({
    where: { OR: [{ inviterId: profile.id }, { partnerId: profile.id }] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      status: true,
      createdAt: true,
      acceptedAt: true,
      expiresAt: true,
      inviterId: true,
      partnerId: true,
      inviter: { select: { username: true } },
      partner: { select: { username: true } },
    },
  });

  return NextResponse.json({
    invites: invites.map((inv) => {
      const isInviter = inv.inviterId === profile.id;
      return {
        id: inv.id,
        // A token csak a meghívónak jár (link-másoláshoz) – a partnernek nem.
        token: isInviter ? inv.token : null,
        state: resolveCompareInviteState(inv, now),
        role: isInviter ? "inviter" : "partner",
        // A másik fél megjelenített neve – elfogadott párnál értelmes.
        otherName: isInviter
          ? (inv.partner?.username ?? null)
          : (inv.inviter?.username ?? null),
        createdAt: inv.createdAt.toISOString(),
        acceptedAt: inv.acceptedAt?.toISOString() ?? null,
        expiresAt: inv.expiresAt.toISOString(),
      };
    }),
  });
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  const userId = await resolveCompareInviteViewerClerkId();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const invite = await prisma.compareInvite.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, inviterId: true, partnerId: true },
  });
  if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (invite.inviterId !== profile.id && invite.partnerId !== profile.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.compareInvite.update({
    where: { id: invite.id },
    data: { status: "REVOKED" },
  });

  return NextResponse.json({ ok: true });
}
