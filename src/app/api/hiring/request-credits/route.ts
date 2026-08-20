import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { hasOrgRole } from "@/lib/auth";
import { sendHiringCreditsRequestEmail } from "@/lib/emails";

const schema = z.object({ orgId: z.string() });

export async function POST(req: Request) {
  // A végpont minden ORG_ADMIN-nak e-mailt küld — rate limit nélkül egy
  // hívó korlátlan levél-sokszorozót kapott volna.
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true, email: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const { orgId } = body.data;

  // Verify requester is a manager in this org
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true, leftAt: true },
  });
  if (!membership || membership.leftAt || !hasOrgRole(membership.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const [org, admins] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    }),
    prisma.organizationMember.findMany({
      where: { orgId, role: "ORG_ADMIN", leftAt: null },
      select: { user: { select: { email: true, username: true } } },
      // Fan-out fojtás: egy kérés legfeljebb ennyi admin-levelet indíthat —
      // a rate limit a kérés-számot fogja, ez a kérésenkénti sokszorozót.
      take: 10,
    }),
  ]);

  const requesterName = profile.username ?? profile.email ?? "Egy menedzser";
  const orgName = org?.name ?? "Trita";

  for (const admin of admins) {
    const adminEmail = admin.user.email;
    if (!adminEmail) continue;

    await sendHiringCreditsRequestEmail({
      to: adminEmail,
      requesterName,
      orgName,
      orgId,
    });
  }

  return NextResponse.json({ ok: true });
}
