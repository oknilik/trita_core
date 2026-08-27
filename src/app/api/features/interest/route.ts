import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import {
  featureInterestPostSchema,
  featureInterestLabel,
  normalizeFeatureInterestBody,
  FEATURE_INTEREST_LEAD_UNIQUE_KEYS,
  type FeatureInterestPostBody,
} from "@/lib/feature-interest";

export const runtime = "nodejs";

// Feature-interest egységes végpont (P5) — két mód, közös séma:
//   · mode:"lead"     — meleg lead: rekord + admin-email, idempotens.
//   · mode:"wishlist" — dashboard-kívánságlista: TOGGLE (add/remove) + GET.
// A régi /api/feature-interest 308-cal ide irányít (?legacy=lead).
// Kulcsok/címkék/séma közös forrása: src/lib/feature-interest.ts.

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ keys: [] });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!profile) return NextResponse.json({ keys: [] });

  const interests = await prisma.feedback.findMany({
    where: { userProfileId: profile.id, kind: "feature_interest" },
    select: { targetKey: true },
  });

  return NextResponse.json({ keys: interests.map((i) => i.targetKey) });
}

export async function POST(req: Request) {
  const legacyLead = new URL(req.url).searchParams.get("legacy") === "lead";
  const body = normalizeFeatureInterestBody(await req.json().catch(() => ({})), legacyLead);
  const parsed = featureInterestPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  return parsed.data.mode === "lead" ? handleLead(parsed.data) : handleWishlist(parsed.data);
}

// LEAD — rate limit auth előtt ("contact" tier: email-küldő végpont).
async function handleLead(data: Extract<FeatureInterestPostBody, { mode: "lead" }>) {
  const log = await getRequestLogger("features");
  const rateLimitResponse = await checkRateLimit("contact");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, username: true, createdAt: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { featureKey, message } = data;

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
  if (existing && FEATURE_INTEREST_LEAD_UNIQUE_KEYS.has(featureKey)) {
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
      subject: `[trita lead] ${featureInterestLabel(featureKey)} – ${profile.email ?? profile.username ?? profile.id}`,
      text,
    });
    if (error) {
      // A lead-rekord megvan – az email-hiba nem veszíti el az érdeklődést.
      log.error({ event: "features.resend_error", err: error }, "Resend error");
    }
  } catch (error) {
    log.error({ event: "features.unexpected_send_error", err: error }, "Unexpected send error");
  }

  return NextResponse.json({ ok: true });
}

// WISHLIST – rate limit auth után, userId-kulccsal ("api" tier).
async function handleWishlist(data: Extract<FeatureInterestPostBody, { mode: "wishlist" }>) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // DB-írás user-inputból – rate limit az abúzus ellen
  const rateLimited = await checkRateLimit("api", userId);
  if (rateLimited) return rateLimited;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });
  }

  const key = {
    userProfileId_kind_targetKey: {
      userProfileId: profile.id,
      kind: "feature_interest",
      targetKey: data.featureKey,
    },
  };

  const existing = await prisma.feedback.findUnique({ where: key });

  if (existing) {
    await prisma.feedback.delete({ where: key });
    return NextResponse.json({ ok: true, action: "removed" });
  } else {
    await prisma.feedback.create({
      data: {
        userProfileId: profile.id,
        kind: "feature_interest",
        targetKey: data.featureKey,
      },
    });
    return NextResponse.json({ ok: true, action: "added" });
  }
}
