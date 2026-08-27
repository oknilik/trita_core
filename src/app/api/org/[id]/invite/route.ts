import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendOrgInviteEmail } from "@/lib/emails";
import { hasOrgRole } from "@/lib/auth";
import { resolveOrgCapabilityDecision, resolveOrgPolicySnapshot } from "@/lib/policy-service";
import { getRequestLogger } from "@/lib/logger.server";
import { getServerLocale } from "@/lib/i18n-server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  BULK_INVITE_BATCH_SIZE,
  type BulkInviteResult,
  type BulkInviteStatus,
} from "@/lib/bulk-invite";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io";

const ORG_ROLE = z.enum(["ORG_ADMIN", "ORG_MANAGER", "ORG_MEMBER"]);

/** Egyelemű (örökség) alak — a válasza bitre azonos marad a korábbival. */
const inviteSchema = z.object({
  email: z.string().email(),
  role: ORG_ROLE.default("ORG_MEMBER"),
});

/**
 * Kötegelt alak. Külön séma, nem opcionális mező: így egy elgépelt
 * `emails` kulcs nem csúszik át némán egyelemű meghívóként.
 */
const bulkInviteSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(BULK_INVITE_BATCH_SIZE),
  role: ORG_ROLE.default("ORG_MEMBER"),
});

// POST /api/org/[id]/invite — invite members by email (ORG_ADMIN or ORG_MANAGER)
//
// Két törzs-alak:
//   { email, role }   → { member } | { pending, emailSent }   (változatlan)
//   { emails[], role} → { results: [{ email, status }] }
//
// A kötegelt ág UGYANAZT a per-cím logikát futtatja, csak sorban, és egy cím
// hibája nem viszi el a köteg többi elemét.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const log = await getRequestLogger("org");
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: orgId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // ORG_MANAGER and above may invite
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true, leftAt: true },
  });
  if (!membership || membership.leftAt) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const policySnapshot = await resolveOrgPolicySnapshot({
    orgId,
    orgRole: membership.role,
  });
  const decision = resolveOrgCapabilityDecision(policySnapshot, "invite");
  if (!decision.allowed) {
    return NextResponse.json(
      {
        error: "CAPABILITY_DENIED",
        reason: decision.reason,
        upgradeHint: decision.upgradeHint?.code ?? null,
      },
      { status: 403 },
    );
  }

  const rateLimited = await checkRateLimit("invite", `org-invite:${orgId}:${profile.id}`);
  if (rateLimited) return rateLimited;

  // Verify org exists and is active
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, status: true },
  });
  if (!org) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (org.status === "INACTIVE") return NextResponse.json({ error: "ORG_INACTIVE" }, { status: 403 });

  const rawBody = await req.json().catch(() => null);

  const single = inviteSchema.safeParse(rawBody);
  const bulk = single.success ? null : bulkInviteSchema.safeParse(rawBody);
  if (!single.success && !bulk?.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const requestedRole = single.success ? single.data.role : bulk!.data!.role;

  // ORG_MANAGER can only invite ORG_MEMBER (not higher)
  const role =
    !hasOrgRole(membership.role, "ORG_ADMIN") && requestedRole !== "ORG_MEMBER"
      ? "ORG_MEMBER"
      : requestedRole;

  // A meghívó nyelve egyszer oldódik fel, nem címenként.
  const locale = await getServerLocale();
  const inviterEmail = profile.email?.toLowerCase() ?? null;

  /**
   * Egy cím feldolgozása. A visszatérő státusz és a korábbi egyelemű
   * hibakódok (`SELF_INVITE`, `ALREADY_MEMBER`) egy az egyben megfeleltethetők
   * – az egyelemű ág ebből képezi a régi választ.
   */
  async function inviteOne(rawEmail: string): Promise<{
    status: BulkInviteStatus;
    member?: { id: string; role: string; joinedAt: Date };
  }> {
    const email = rawEmail.toLowerCase();

    if (inviterEmail === email) return { status: "self_invite" };

    const targetUser = await prisma.userProfile.findFirst({
      where: { email, deleted: false },
      select: { id: true },
    });

    if (!targetUser) {
      // User doesn't exist – create pending invite + send email
      const existing = await prisma.organizationPendingInvite.findUnique({
        where: { orgId_email: { orgId, email } },
      });
      if (existing) return { status: "already_member" };

      const invite = await prisma.organizationPendingInvite.create({
        data: { orgId, email, role, token: crypto.randomBytes(16).toString("hex") },
        select: { token: true },
      });

      const emailSent = await sendOrgInviteEmail({
        to: email,
        orgName: org!.name,
        role,
        signUpUrl: `${APP_URL}/join/org/${invite.token}`,
        // A meghívott még nem tag, tárolt nyelve nincs – a meghívó nyelvét vesszük.
        locale,
      });

      return { status: emailSent ? "invited" : "invited_no_email" };
    }

    const targetExistingMembership = await prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId: targetUser.id } },
    });
    if (targetExistingMembership && !targetExistingMembership.leftAt) {
      return { status: "already_member" };
    }

    const member = await prisma.organizationMember.upsert({
      where: { orgId_userId: { orgId, userId: targetUser.id } },
      create: { orgId, userId: targetUser.id, role },
      update: { role, leftAt: null, joinedAt: new Date() },
      select: { id: true, role: true, joinedAt: true },
    });

    // Notify invited user via orchestrator
    import("@/lib/notifications").then(({ handleOrgInviteReceived }) =>
      handleOrgInviteReceived({
        userId: targetUser.id,
        orgId,
        orgName: org!.name,
      }).catch((err) => log.error({ event: "org.org_invite_error", err: err }, "Org invite error")),
    );

    return { status: "added", member };
  }

  // ── Egyelemű ág – a válasz-szerződés VÁLTOZATLAN ────────────────────
  if (single.success) {
    const outcome = await inviteOne(single.data.email);
    if (outcome.status === "self_invite") {
      return NextResponse.json({ error: "SELF_INVITE" }, { status: 400 });
    }
    if (outcome.status === "already_member") {
      return NextResponse.json({ error: "ALREADY_MEMBER" }, { status: 409 });
    }
    if (outcome.status === "added") {
      return NextResponse.json({ member: outcome.member }, { status: 201 });
    }
    return NextResponse.json(
      { pending: true, emailSent: outcome.status === "invited" },
      { status: 201 },
    );
  }

  // ── Kötegelt ág ─────────────────────────────────────────────────────
  // Sorban, nem párhuzamosan: a levélküldés a szűk keresztmetszet, és a
  // párhuzamos Resend-hívások a rate limitbe futnának. Egy cím hibája nem
  // állítja meg a köteget – a hívó cím-szinten látja, mi történt.
  const results: BulkInviteResult[] = [];
  for (const email of bulk!.data!.emails) {
    try {
      const outcome = await inviteOne(email);
      results.push({ email: email.toLowerCase(), status: outcome.status });
    } catch (err) {
      log.error({ event: "org.bulk_invite_item_failed", err }, "Bulk invite item failed");
      results.push({ email: email.toLowerCase(), status: "failed" });
    }
  }

  return NextResponse.json({ results }, { status: 201 });
}
