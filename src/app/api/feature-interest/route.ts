import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { FEATURE_INTEREST_LEAD_KEYS, featureInterestLabel } from "@/lib/feature-interest";

export const runtime = "nodejs";

// Bejelentkezett user érdeklődés-jelzése (meleg lead) — FeatureInterest
// rekord + értesítő email. A user email/név a fiókból jön, nem az űrlapról.
// Kulcsok/címkék közös forrása: src/lib/feature-interest.ts.

const schema = z.object({
  featureKey: z.enum(FEATURE_INTEREST_LEAD_KEYS),
  message: z.string().trim().max(2000).optional(),
});

// Ezeknél a kulcsoknál egy user csak egyszer jelezhet; a többinél (pl.
// szakma-javaslat) az ismételt beküldés is értékes — akkor csak emailt
// küldünk, rekordot nem duplikálunk.
const UNIQUE_FEATURE_KEYS = new Set(["team"]);

export async function POST(req: Request) {
  const rateLimitResponse = await checkRateLimit("contact");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, username: true, createdAt: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const { featureKey, message } = parsed.data;

  const existing = await prisma.feedback.findUnique({
    where: {
      userProfileId_kind_targetKey: {
        userProfileId: profile.id,
        kind: "feature_interest",
        targetKey: featureKey,
      },
    },
    select: { id: true },
  });
  if (existing && UNIQUE_FEATURE_KEYS.has(featureKey)) {
    // Egyszer jelezhető feature — duplikátum nem küld új emailt sem.
    return NextResponse.json({ ok: true, already: true });
  }
  if (!existing) {
    await prisma.feedback.create({
      data: {
        userProfileId: profile.id,
        kind: "feature_interest",
        targetKey: featureKey,
      },
    });
  }

  const latestResult = await prisma.assessmentResult.findFirst({
    where: { userProfileId: profile.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const to = process.env.CONTACT_FORM_TO ?? "info@trita.io";
  const text = [
    `Platformot használó, bejelentkezett felhasználó érdeklődik: ${featureInterestLabel(featureKey)}.`,
    "",
    `Név: ${profile.username ?? "-"}`,
    `Email: ${profile.email ?? "-"}`,
    `Regisztrált: ${profile.createdAt.toISOString()}`,
    `Önértékelés kitöltve: ${latestResult ? latestResult.createdAt.toISOString() : "még nincs"}`,
    featureKey === "industry_role"
      ? "Forrás: eredmény-oldal, iparági illeszkedés blokk (szakma-javaslat)"
      : "Forrás: eredmény-oldal (results) érdeklődés-banner",
    "",
    "Üzenet:",
    message && message.length > 0 ? message : "-",
  ].join("\n");

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      ...(profile.email ? { replyTo: profile.email } : {}),
      subject: `[trita lead] ${featureInterestLabel(featureKey)} — ${profile.email ?? profile.username ?? profile.id}`,
      text,
    });
    if (error) {
      // A lead-rekord megvan — az email-hiba nem veszíti el az érdeklődést.
      console.error("[FeatureInterest] Resend error:", error);
    }
  } catch (error) {
    console.error("[FeatureInterest] Unexpected send error:", error);
  }

  return NextResponse.json({ ok: true });
}
