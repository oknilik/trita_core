import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { profileShareUrl, sendProfileShareEmail } from "@/lib/emails";
import { generateShareQrPng } from "@/lib/share-qr";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

const sendSchema = z.object({
  email: z.string().email().max(254),
});

/**
 * POST /api/profile/share/send
 * Sends the share link of the user's latest self assessment to the given
 * email address. Creates the share token if it does not exist yet.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // Email-küldő endpoint — spam-vektor rate limit nélkül
  const rateLimited = await checkRateLimit("contact", userId);
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true },
  });
  if (!profile) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const result = await prisma.assessmentResult.findFirst({
    where: { userProfileId: profile.id, isSelfAssessment: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, shareToken: true },
  });
  if (!result) return NextResponse.json({ error: "NO_RESULT" }, { status: 404 });

  let token = result.shareToken;
  if (!token) {
    token = crypto.randomBytes(16).toString("hex");
    await prisma.assessmentResult.update({
      where: { id: result.id },
      data: { shareToken: token },
    });
  }

  // QR a levélbe: a modal-beli QR-blokk kiváltása — a címzett telefonnal
  // beolvasva azonnal a megosztott profilra jut. Best-effort (a helper hibán
  // null-t ad): a levél QR nélkül is kimegy, a küldést a QR sosem buktatja.
  const qrPng = await generateShareQrPng(profileShareUrl(token));

  const locale = await getServerLocale();
  try {
    await sendProfileShareEmail({
      to: parsed.data.email,
      senderName: profile.username ?? t("common.userFallback", locale),
      token,
      locale,
      qrPng,
    });
  } catch {
    return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, token });
}
