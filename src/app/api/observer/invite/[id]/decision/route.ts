import { auth } from "@clerk/nextjs/server";
import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendObserverInviteEmail } from "@/lib/emails";
import { normalizeLocale } from "@/lib/i18n";
import { hasOrgRole } from "@/lib/auth";
import { canManageMeasurements } from "@/lib/measurement-auth";
import { handleObserverInviteDecision } from "@/lib/notifications";
import { getRequestLogger } from "@/lib/logger.server";

const bodySchema = z.object({ action: z.enum(["approve", "decline"]) });

/**
 * POST /api/observer/invite/[id]/decision — jóváhagyásra váró KÜLSŐ
 * observer-meghívó engedélyezése vagy elutasítása.
 *
 * Jóváhagyhat: a kampány szervezetében org admin, tanácsadó (ORG_CONSULTANT /
 * platform-tanácsadó / trita admin), vagy ORG_MANAGER. Jóváhagyáskor megy ki
 * a meghívó e-mail (a lejárat innen számít); elutasításkor a meghívó
 * CANCELED lesz. A meghívó tag mindkét esetben értesítést kap.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const log = await getRequestLogger("observer");
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const approver = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true, username: true },
  });
  if (!approver) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const invite = await prisma.observerInvitation.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      token: true,
      observerEmail: true,
      observerName: true,
      campaignId: true,
      campaign: { select: { orgId: true } },
      inviter: { select: { id: true, username: true, email: true, locale: true } },
    },
  });
  if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (invite.status !== "AWAITING_APPROVAL") {
    return NextResponse.json({ error: "NOT_AWAITING_APPROVAL" }, { status: 409 });
  }
  const orgId = invite.campaign?.orgId;
  if (!orgId) return NextResponse.json({ error: "NO_CAMPAIGN_CONTEXT" }, { status: 409 });

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: approver.id } },
    select: { role: true, leftAt: true },
  });
  const role = membership && !membership.leftAt ? membership.role : null;
  const mayDecide =
    canManageMeasurements(role, approver.email, approver.isConsultant) ||
    (role !== null && hasOrgRole(role, "ORG_MANAGER"));
  if (!mayDecide) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const approved = body.data.action === "approve";
  const targetLabel = invite.observerName ?? invite.observerEmail ?? "külső értékelő";

  await prisma.observerInvitation.update({
    where: { id: invite.id },
    data: approved
      ? {
          status: "PENDING",
          approvedById: approver.id,
          approvedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      : { status: "CANCELED", approvedById: approver.id, approvedAt: new Date() },
  });

  const inviterName = invite.inviter.username ?? invite.inviter.email ?? "Trita";
  const emailTo = invite.observerEmail;
  const recipientName = invite.observerName;
  const token = invite.token;
  const emailLocale = normalizeLocale(invite.inviter.locale);
  const inviterUserId = invite.inviter.id;
  const invitationId = invite.id;

  after(async () => {
    if (approved && emailTo) {
      try {
        await sendObserverInviteEmail({
          to: emailTo,
          inviterName,
          recipientName: recipientName ?? undefined,
          token,
          locale: emailLocale,
        });
      } catch (err) {
        log.error({ event: "observer.failed_to_send_approved_observer_invite_email", err: err }, "Failed to send approved observer invite email");
      }
    }
    await handleObserverInviteDecision({
      inviterUserId,
      invitationId,
      approved,
      targetLabel,
    }).catch((err) => log.error({ event: "observer.observer_decision_error", err: err }, "Observer decision error"));
  });

  return NextResponse.json({ ok: true, status: approved ? "PENDING" : "CANCELED" });
}
