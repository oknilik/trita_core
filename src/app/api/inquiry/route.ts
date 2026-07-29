import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { submitInquiry } from "@/lib/inquiries";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";

// In-app „Kérdésem van" csatorna (help-widget) — bejelentkezett usernek.
// A linkelés itt garantált: session-ből jön a profil és az aktív org,
// nem email-egyezésen múlik.

const inquirySchema = z.object({
  message: z.string().trim().min(10).max(4000),
}).strict();

export async function POST(req: Request) {
  const log = await getRequestLogger("inquiries");
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // Admin-email + notif megy ki belőle — rate limit kötelező
  const rateLimited = await checkRateLimit("contact", userId);
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => ({}));
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      email: true,
      username: true,
      activeOrgId: true,
      orgMemberships: { select: { orgId: true }, take: 1 },
    },
  });
  if (!profile?.email) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  try {
    await submitInquiry({
      name: profile.username ?? profile.email,
      email: profile.email,
      topic: "question",
      message: parsed.data.message,
      source: "in_app",
      userProfileId: profile.id,
      organizationId: profile.activeOrgId ?? profile.orgMemberships[0]?.orgId ?? null,
    });
  } catch (error) {
    log.error({ event: "inquiries.failed_to_submit_in_app_inquiry", err: error }, "Failed to submit in-app inquiry");
    return NextResponse.json({ error: "SUBMIT_FAILED" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
