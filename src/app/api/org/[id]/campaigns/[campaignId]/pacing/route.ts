import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";
import { canManageMeasurements } from "@/lib/measurement-auth";
import { releaseDueCampaignSteps } from "@/lib/campaign-steps";

const bodySchema = z.union([
  // Ütem módosítása: hány óránként nyíljon a következő kérdőív (0 = azonnal).
  z.object({ action: z.literal("interval"), stepIntervalHours: z.number().int().min(0).max(168) }),
  // Küldés most: minden ütemezésre váró lépés azonnali kinyitása.
  z.object({ action: z.literal("release_now") }),
]);

/**
 * POST /api/org/[id]/campaigns/[campaignId]/pacing — lépés-ütemezés
 * kezelése. Jogosult: org admin VAGY tanácsadó/trita admin (a kampány-
 * létrehozással ellentétben ez az ütem finomhangolása, nem mérés-indítás).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; campaignId: string }> },
) {
  const { id: orgId, campaignId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true, leftAt: true },
  });
  const role = membership && !membership.leftAt ? membership.role : null;
  const mayManagePacing =
    canManageMeasurements(role, profile.email, profile.isConsultant) ||
    (role !== null && hasOrgRole(role, "ORG_ADMIN"));
  if (!mayManagePacing) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId },
    select: { id: true, status: true },
  });
  if (!campaign) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  if (body.data.action === "interval") {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { stepIntervalHours: body.data.stepIntervalHours },
    });
    return NextResponse.json({ ok: true, stepIntervalHours: body.data.stepIntervalHours });
  }

  // release_now
  if (campaign.status !== "ACTIVE") {
    return NextResponse.json({ error: "CAMPAIGN_NOT_ACTIVE" }, { status: 409 });
  }
  const released = await releaseDueCampaignSteps({ campaignId, force: true });
  return NextResponse.json({ ok: true, released });
}
