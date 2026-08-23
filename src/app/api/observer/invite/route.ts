import { auth } from "@clerk/nextjs/server";
import { after } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendObserverInviteEmail } from "@/lib/emails";
import { normalizeLocale } from "@/lib/i18n";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";
import {
  OBSERVER_INVITE_MAX_ACTIVE,
  OBSERVER_INVITE_TTL_DAYS,
  observerInviteRequiresApproval,
  resolveColleagueObserverType,
} from "@/lib/observer/invite-policy";
import {
  handleObserverApprovalRequested,
  handleObserverColleagueInvited,
} from "@/lib/notifications";

const inviteSchema = z
  .object({
    // Kolléga-meghívó: a szervezet tagjai közül, listából.
    colleagueUserId: z.string().min(1).optional(),
    // Email-alapú (külső / szervezeten kívüli) meghívó.
    email: z.string().email().optional(),
    name: z.string().min(1).max(100).optional(),
    externalContext: z.string().max(200).optional(),
  })
  .strict()
  .refine((v) => !(v.colleagueUserId && v.email), {
    message: "colleagueUserId and email are mutually exclusive",
  });

/**
 * A meghívó kampány-kontextusa: a meghívó tag legutóbbi AKTÍV, observer-
 * lépést tartalmazó kampánya az aktív szervezetében. A jóváhagyási szabály
 * (Campaign.allowExternalObservers) és a jóváhagyó felület ehhez köt.
 */
async function resolveInviteCampaignContext(profileId: string, activeOrgId: string | null) {
  if (!activeOrgId) return null;
  const participation = await prisma.campaignParticipant.findFirst({
    where: {
      userId: profileId,
      campaign: {
        orgId: activeOrgId,
        status: "ACTIVE",
        OR: [{ steps: { has: "OBSERVER_360" } }, { steps: { isEmpty: true }, type: "OBSERVER_360" }],
      },
    },
    orderBy: { addedAt: "desc" },
    select: {
      campaign: {
        select: { id: true, orgId: true, teamId: true, allowExternalObservers: true },
      },
    },
  });
  return participation?.campaign ?? null;
}

export async function POST(req: Request) {
  const log = await getRequestLogger("observer");
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

  const rateLimitResponse = await checkRateLimit(
    parsed.data.email ? "contact" : "api",
    userId,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
  });

  if (!profile || !profile.testType) {
    return NextResponse.json({ error: "NO_TEST_TYPE" }, { status: 400 });
  }

  // Aktív org-tagság (a típus-jelöléshez és a jóváhagyási szabályhoz).
  const activeOrgMembership = profile.activeOrgId
    ? await prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: profile.activeOrgId, userId: profile.id } },
        select: { role: true, leftAt: true },
      })
    : null;
  const inOrg = Boolean(activeOrgMembership && !activeOrgMembership.leftAt);

  // ── Kolléga-ág: címzett feloldása + típus (TEAM/ORG) ──────────────────────
  let observerType: "TEAM" | "ORG" | "EXTERNAL" | "INTERNAL" = "INTERNAL";
  let observerProfileId: string | null = null;
  let targetEmail: string | null = parsed.data.email ?? null;
  let targetName: string | null = parsed.data.name ?? null;

  if (parsed.data.colleagueUserId) {
    if (!inOrg || !profile.activeOrgId) {
      return NextResponse.json({ error: "NO_ACTIVE_ORG" }, { status: 400 });
    }
    if (parsed.data.colleagueUserId === profile.id) {
      return NextResponse.json({ error: "SELF_INVITE" }, { status: 400 });
    }
    const colleague = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: { orgId: profile.activeOrgId, userId: parsed.data.colleagueUserId },
      },
      select: {
        role: true,
        leftAt: true,
        user: { select: { id: true, username: true, email: true } },
      },
    });
    if (!colleague || colleague.leftAt || colleague.role === "ORG_CONSULTANT") {
      return NextResponse.json({ error: "NOT_A_COLLEAGUE" }, { status: 400 });
    }
    const [inviterTeams, colleagueTeams] = await Promise.all([
      prisma.teamMember.findMany({
        where: { userId: profile.id, team: { orgId: profile.activeOrgId } },
        select: { teamId: true },
      }),
      prisma.teamMember.findMany({
        where: { userId: colleague.user.id, team: { orgId: profile.activeOrgId } },
        select: { teamId: true },
      }),
    ]);
    observerType = resolveColleagueObserverType({
      inviterTeamIds: inviterTeams.map((t) => t.teamId),
      colleagueTeamIds: colleagueTeams.map((t) => t.teamId),
    });
    observerProfileId = colleague.user.id;
    targetEmail = colleague.user.email;
    targetName = colleague.user.username ?? null;

    const existingActive = await prisma.observerInvitation.findFirst({
      where: {
        inviterId: profile.id,
        observerProfileId,
        status: { in: ["AWAITING_APPROVAL", "PENDING", "COMPLETED"] },
      },
      select: { id: true },
    });
    if (existingActive) {
      return NextResponse.json({ error: "DUPLICATE_INVITE_EMAIL" }, { status: 400 });
    }
  } else if (inOrg) {
    // Org-tag email-alapú meghívója: szervezeten kívüli → KÜLSŐ.
    observerType = "EXTERNAL";
  }

  // Prevent self-invite (email-ág)
  if (
    parsed.data.email &&
    profile.email &&
    parsed.data.email.toLowerCase() === profile.email.toLowerCase()
  ) {
    return NextResponse.json({ error: "SELF_INVITE" }, { status: 400 });
  }

  // Prevent duplicate active invite for the same email
  if (parsed.data.email) {
    const existingActiveInvite = await prisma.observerInvitation.findFirst({
      where: {
        inviterId: profile.id,
        observerEmail: { equals: parsed.data.email, mode: "insensitive" },
        status: { in: ["AWAITING_APPROVAL", "PENDING", "COMPLETED"] },
      },
      select: { id: true },
    });
    if (existingActiveInvite) {
      return NextResponse.json({ error: "DUPLICATE_INVITE_EMAIL" }, { status: 400 });
    }
  }

  // Kvóta: az i18n „5 aktív meghívót" ígér — csak a függő, még nem lejárt
  // meghívók fogyasztják a keretet (a kitöltött/lejárt/törölt nem).
  const activeCount = await prisma.observerInvitation.count({
    where: {
      inviterId: profile.id,
      status: { in: ["AWAITING_APPROVAL", "PENDING"] },
      expiresAt: { gt: new Date() },
    },
  });
  if (activeCount >= OBSERVER_INVITE_MAX_ACTIVE) {
    return NextResponse.json({ error: "INVITE_LIMIT_REACHED" }, { status: 400 });
  }

  // ── Jóváhagyási szabály (kampány-kontextusban, külső meghívóra) ───────────
  const campaign = await resolveInviteCampaignContext(profile.id, profile.activeOrgId);
  const needsApproval = observerInviteRequiresApproval({ observerType, campaign });

  const invitation = await prisma.observerInvitation.create({
    data: {
      // Kriptográfiailag véletlen bearer token — a séma cuid() defaultja
      // részben megjósolható, publikus linkhez nem elég erős.
      token: crypto.randomBytes(16).toString("hex"),
      inviterId: profile.id,
      observerProfileId,
      observerEmail: targetEmail,
      observerName: targetName,
      testType: profile.testType,
      status: needsApproval ? "AWAITING_APPROVAL" : "PENDING",
      expiresAt: new Date(Date.now() + OBSERVER_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      observerType,
      externalContext: parsed.data.externalContext ?? null,
      campaignId: campaign?.id ?? null,
    },
  });

  // Analitika: a meghívó-lánc első lépése (A3 kérdés). A címzett e-mail
  // címe SOHA nem kerül eseménybe — csak a csatorna típusa.
  trackServerEvent(
    "observer.invite_created",
    { channel: targetEmail ? "email" : "link" },
    { userProfileId: profile.id },
  );

  const inviterName = profile.username ?? profile.email ?? "Trita";
  const emailLocale = normalizeLocale(profile.locale);

  if (needsApproval) {
    // E-mail NEM megy ki — a jóváhagyók kapnak értesítést.
    if (campaign) {
      after(async () => {
        await handleObserverApprovalRequested({
          orgId: campaign.orgId,
          teamId: campaign.teamId,
          invitationId: invitation.id,
          inviterName,
          targetLabel: targetName ?? targetEmail ?? "külső értékelő",
        }).catch((err) => log.error({ event: "observer.observer_approval_request_error", err: err }, "Observer approval request error"));
      });
    }
  } else if (targetEmail) {
    const emailTo = targetEmail;
    const recipientName = targetName;
    const token = invitation.token;
    const colleagueUserId = observerProfileId;

    after(async () => {
      try {
        const existingUser = await prisma.userProfile.findFirst({
          where: { email: { equals: emailTo, mode: "insensitive" } },
          select: { username: true },
        });
        await sendObserverInviteEmail({
          to: emailTo,
          inviterName,
          recipientName: existingUser?.username ?? recipientName ?? undefined,
          token,
          locale: emailLocale,
        });
      } catch (err) {
        log.error({ event: "observer.failed_to_send_observer_invite_email", err: err }, "Failed to send observer invite email");
      }
      // Belső kolléga: app-értesítés is (notification hub).
      if (colleagueUserId) {
        await handleObserverColleagueInvited({
          observerUserId: colleagueUserId,
          inviterName,
          invitationId: invitation.id,
          token,
        }).catch((err) => log.error({ event: "observer.observer_colleague_invite_error", err: err }, "Observer colleague invite error"));
      }
    });
  }

  return NextResponse.json({
    id: invitation.id,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
    status: invitation.status,
    observerType: invitation.observerType,
    awaitingApproval: needsApproval,
    emailSent: Boolean(targetEmail) && !needsApproval,
  });
}

// A korábbi GET /api/observer/invite handler törölve (motor-audit): nem volt
// hívója (a meghívó-listát a profile/results/page.tsx építi szerver-oldalon),
// viszont teljes-pontosságú completedAt-et + observer-neveket adott vissza,
// újranyitva a W1 differencia-csatornát, amit a results-oldal nap-pontos
// csonkolása lezárt. Ha valaha kell listázó endpoint, nap-pontos completedAt-tel
// és self-guarddal térjen vissza.
