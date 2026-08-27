import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendTeamInviteEmail } from "@/lib/emails";
import { getServerLocale } from "@/lib/i18n-server";
import { resolveOrgCapabilityDecision, resolveTeamPolicySnapshot } from "@/lib/policy-service";
import { hasOrgRole } from "@/lib/org-roles";
import { getRequestLogger } from "@/lib/logger.server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  BULK_INVITE_BATCH_SIZE,
  type BulkInviteResult,
  type BulkInviteStatus,
} from "@/lib/bulk-invite";

/** Egyelemű (örökség) alak — a válasza bitre azonos marad a korábbival. */
const inviteSchema = z.object({
  email: z.string().email(),
});

/** Kötegelt alak — ld. src/lib/bulk-invite.ts a méretkorlát indoklásával. */
const bulkInviteSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(BULK_INVITE_BATCH_SIZE),
});

// POST /api/team/[id]/invite — add members to the team by email
//
// Két törzs-alak:
//   { email }   → { member } | { pending }              (változatlan)
//   { emails[] }→ { results: [{ email, status }] }
// - Csak admin-paritás (teamInviteEmail capability: ORG_ADMIN / ORG_CONSULTANT) —
//   az e-mailes meghívó org-tagságot is keletkeztet (előbb csendben org-tag,
//   aztán team-tag; racionalizálási döntés, 2026-07-22). A manager a
//   szervezeti taglistából ad hozzá tagot (POST /api/team/[id]/members).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: teamId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, ownerId: true, orgId: true, name: true },
  });
  if (!team) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (!team.orgId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Org team: centralized capability check for invite
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true, leftAt: true },
  });
  if (!membership || membership.leftAt) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const policySnapshot = await resolveTeamPolicySnapshot({
    orgId: team.orgId,
    orgRole: membership.role,
    teamId,
    profileId: profile.id,
  });
  const inviteDecision = resolveOrgCapabilityDecision(policySnapshot, "teamInviteEmail");
  if (!inviteDecision.allowed) {
    return NextResponse.json(
      {
        error: "CAPABILITY_DENIED",
        reason: inviteDecision.reason,
        upgradeHint: inviteDecision.upgradeHint?.code ?? null,
      },
      { status: 403 },
    );
  }

  const rateLimited = await checkRateLimit("invite", `team-invite:${teamId}:${profile.id}`);
  if (rateLimited) return rateLimited;

  // Kemény szerep-háló (defense-in-depth): a policy-enforcement kill-switch
  // kikapcsolása ne engedje az e-mailes meghívót admin-paritás alatt.
  if (!hasOrgRole(membership.role, "ORG_ADMIN")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const rawBody = await req.json().catch(() => null);

  const single = inviteSchema.safeParse(rawBody);
  const bulk = single.success ? null : bulkInviteSchema.safeParse(rawBody);
  if (!single.success && !bulk?.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const log = await getRequestLogger("team");
  const locale = await getServerLocale();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io";
  const orgId = team.orgId;

  async function inviteOne(rawEmail: string): Promise<{
    status: BulkInviteStatus;
    member?: { id: string; userId: string; joinedAt: Date };
  }> {
    const email = rawEmail.toLowerCase();

    const targetUser = await prisma.userProfile.findFirst({
      where: { email, deleted: false },
      select: { id: true },
    });

    if (!targetUser) {
      const existingPending = await prisma.teamPendingInvite.findUnique({
        where: { teamId_email: { teamId, email } },
      });
      if (existingPending) return { status: "already_member" };

      const invite = await prisma.teamPendingInvite.create({
        data: { teamId, email, token: crypto.randomBytes(16).toString("hex") },
        select: { token: true },
      });

      const emailSent = await sendTeamInviteEmail({
        to: email,
        teamName: team!.name,
        signUpUrl: `${appUrl}/join/${invite.token}`,
        locale,
      });

      // A `sendTeamInviteEmail` régebbi hívói a visszatérést nem nézték; a
      // kötegelt nézet viszont megkülönbözteti a „kiment" és a „meghívó
      // létrejött, de a levél nem ment ki" esetet – utóbbinál a tanácsadónak
      // kézzel kell linket küldenie, és ezt látnia kell.
      return { status: emailSent === false ? "invited_no_email" : "invited" };
    }

    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: targetUser.id } },
    });
    if (existing) return { status: "already_member" };

    const existingOrgMembership = await prisma.organizationMember.findFirst({
      where: { userId: targetUser.id, orgId, leftAt: null },
      select: { id: true },
    });

    const [member] = await prisma.$transaction([
      prisma.teamMember.create({
        data: { teamId, userId: targetUser.id },
        select: { id: true, userId: true, joinedAt: true },
      }),
      ...(existingOrgMembership
        ? []
        : [prisma.organizationMember.create({
            data: { orgId, userId: targetUser.id, role: "ORG_MEMBER" },
          })]),
    ]);

    // A felvett (meglévő) user értesítése – a másik hozzáadási út
    // (members route) is ugyanezt küldi.
    import("@/lib/notifications").then(({ handleTeamMemberAdded }) =>
      handleTeamMemberAdded({ teamId, teamName: team!.name, userId: targetUser.id }).catch(
        () => {},
      ),
    );

    return { status: "added", member };
  }

  // ── Egyelemű ág – a válasz-szerződés VÁLTOZATLAN ────────────────────
  if (single.success) {
    const outcome = await inviteOne(single.data.email);
    if (outcome.status === "already_member") {
      return NextResponse.json({ error: "ALREADY_MEMBER" }, { status: 409 });
    }
    if (outcome.status === "added") {
      return NextResponse.json({ member: outcome.member }, { status: 201 });
    }
    return NextResponse.json({ pending: true }, { status: 201 });
  }

  // ── Kötegelt ág ─────────────────────────────────────────────────────
  // Sorban: a levélküldés a szűk keresztmetszet, és egy cím hibája nem
  // viheti el a köteg többi elemét.
  const results: BulkInviteResult[] = [];
  for (const email of bulk!.data!.emails) {
    try {
      const outcome = await inviteOne(email);
      results.push({ email: email.toLowerCase(), status: outcome.status });
    } catch (err) {
      log.error({ event: "team.bulk_invite_item_failed", err }, "Bulk invite item failed");
      results.push({ email: email.toLowerCase(), status: "failed" });
    }
  }

  return NextResponse.json({ results }, { status: 201 });
}
