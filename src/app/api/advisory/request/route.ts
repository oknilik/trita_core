import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";
import { submitInquiry } from "@/lib/inquiries";
import { sendAdvisoryConfirmationEmail } from "@/lib/emails";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";

// Konzultáció-kérés (advisory oldal) — bejelentkezett usernek.
// A siker mércéje a perzisztált inquiry (DB + admin-notif + CRM auto-attach a
// submitInquiry-n át) — az emailek best effort, a hibájuk nem a beküldő hibája.
// (Korábban ez a route csak emailt küldött, ráadásul a RESEND_FROM_EMAIL-t
// használta címzettként — Resend-hiba esetén a lead nyomtalanul elveszett.)

export async function POST(req: NextRequest) {
  const log = await getRequestLogger("advisory");
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // Admin-email + notif megy ki belőle — rate limit kötelező
  const rateLimited = await checkRateLimit("contact", userId);
  if (rateLimited) return rateLimited;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true, email: true, locale: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const activeMembership = await getActiveOrgMembership(profile.id);
  const membership = activeMembership
    ? await prisma.organizationMember.findUnique({
        where: {
          orgId_userId: { orgId: activeMembership.orgId, userId: profile.id },
        },
        select: { org: { select: { name: true } } },
      })
    : null;

  const body = await req.json().catch(() => ({}));
  const teamsSummary: Array<{ name: string; pattern: string }> = Array.isArray(
    body.teams,
  )
    ? body.teams
        .filter(
          (t: unknown): t is { name: string; pattern: string } =>
            typeof t === "object" &&
            t !== null &&
            typeof (t as { name?: unknown }).name === "string" &&
            typeof (t as { pattern?: unknown }).pattern === "string",
        )
        .slice(0, 20)
    : [];

  const orgName = membership?.org?.name ?? "Ismeretlen";
  const displayName = profile.username ?? profile.email ?? "Felhasználó";
  const userEmail = profile.email ?? "";

  const message = [
    `Tanácsadói konzultáció igény a platformról.`,
    `Szervezet: ${orgName}`,
    "",
    teamsSummary.length > 0
      ? `Csapatok:\n${teamsSummary.map((t) => `- ${t.name}: ${t.pattern}`).join("\n")}`
      : "Csapatok: —",
  ].join("\n");

  try {
    await submitInquiry({
      name: displayName,
      email: userEmail,
      topic: "advisory",
      message,
      source: "advisory_request",
      userProfileId: profile.id,
      organizationId: activeMembership?.orgId ?? null,
    });
  } catch (error) {
    log.error(
      { event: "advisory.advisory_request_error", err: error },
      "Advisory request error",
    );
    return NextResponse.json({ error: "SUBMIT_FAILED" }, { status: 502 });
  }

  // Visszaigazoló email a kérőnek — best effort, a kérés már perzisztált.
  if (userEmail) {
    const firstName = displayName.split(/[\s@]/)[0] ?? displayName;
    try {
      await sendAdvisoryConfirmationEmail({
        to: userEmail,
        name: firstName,
        locale: profile.locale === "en" ? "en" : "hu",
      });
    } catch (error) {
      log.error(
        { event: "advisory.confirmation_email_error", err: error },
        "Advisory confirmation email error",
      );
    }
  }

  trackServerEvent("inquiry.submit", {
    topic: "advisory",
    source: "advisory_request",
  });

  return NextResponse.json({ ok: true });
}
