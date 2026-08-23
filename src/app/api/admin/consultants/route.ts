import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  applyConsultantInviteIfAny,
  assignConsultantToOrg,
} from "@/lib/consultant-invites";
import { sendConsultantInviteEmail } from "@/lib/emails";
import { createLogger } from "@/lib/logger";
import { normalizeLocale } from "@/lib/i18n/core";
import { checkRateLimit } from "@/lib/rate-limit";

const log = createLogger("admin-consultants");

// ─────────────────────────────────────────────────────────────────────
// Platform-szintű tanácsadó-kezelés (csak platform-admin).
//
// GET  → tanácsadók + nyitott meghívók listája
// POST → action-alapú írás:
//   invite            { email, note? }        — meghívó; ha a profil létezik,
//                                                azonnal alkalmazzuk
//   revoke_invite     { inviteId }            — nyitott meghívó visszavonása
//   remove_consultant { profileId }           — flag le + ORG_CONSULTANT
//                                                tagságok törlése
//   assign_org        { profileId, orgId }    — ORG_CONSULTANT tagság
//   unassign_org      { profileId, orgId }    — ORG_CONSULTANT tagság törlése
// ─────────────────────────────────────────────────────────────────────

const postSchema = z.object({
  action: z.enum([
    "invite",
    "revoke_invite",
    "remove_consultant",
    "assign_org",
    "unassign_org",
  ]),
  email: z.string().email().optional(),
  note: z.string().max(300).optional(),
  inviteId: z.string().min(1).optional(),
  profileId: z.string().min(1).optional(),
  orgId: z.string().min(1).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const [consultants, invites] = await Promise.all([
    prisma.userProfile.findMany({
      where: { isConsultant: true, deleted: false },
      // Legutóbbi elöl — az admin lista alapesetben csak az első 10-et mutatja.
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        orgMemberships: {
          where: { role: "ORG_CONSULTANT" },
          select: { orgId: true, org: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.consultantInvite.findMany({
      where: { acceptedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, note: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    consultants: consultants.map((c) => ({
      id: c.id,
      email: c.email,
      username: c.username,
      createdAt: c.createdAt.toISOString(),
      orgs: c.orgMemberships.map((m) => ({ id: m.org.id, name: m.org.name })),
    })),
    invites: invites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      note: inv.note,
      createdAt: inv.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = postSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const data = body.data;

  if (data.action === "invite") {
    if (!data.email) return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 400 });
    const email = data.email.toLowerCase();

    // Az admin profilja (invitedBy)
    const { userId } = await import("@/lib/auth-server").then((m) => m.getServerAuth());
    const adminProfile = userId
      ? await prisma.userProfile.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        })
      : null;
    if (!adminProfile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const rateLimited = await checkRateLimit("contact", `consultant-invite:${adminProfile.id}`);
    if (rateLimited) return rateLimited;

    const invite = await prisma.consultantInvite.upsert({
      where: { email },
      create: { email, note: data.note, invitedById: adminProfile.id },
      update: { note: data.note, acceptedAt: null },
      select: { id: true },
    });

    // Ha a profil már létezik, azonnal alkalmazzuk.
    const existing = await prisma.userProfile.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, deleted: false },
      select: { id: true, locale: true },
    });
    let appliedNow = false;
    if (existing) {
      appliedNow = await applyConsultantInviteIfAny(existing.id, email);
    }

    // Értesítő email a meghívottnak — best effort (a meghívó-rekord már él;
    // korábban semmilyen email nem ment, az admin csak remélhette, hogy a
    // meghívott magától regisztrál).
    let emailSent = false;
    try {
      emailSent = await sendConsultantInviteEmail({
        to: email,
        hasAccount: Boolean(existing),
        locale: normalizeLocale(existing?.locale),
      });
    } catch (error) {
      log.error(
        { event: "admin_consultants.invite_email_failed", err: error },
        "Consultant invite email failed",
      );
    }

    return NextResponse.json({ ok: true, inviteId: invite.id, appliedNow, emailSent });
  }

  if (data.action === "revoke_invite") {
    if (!data.inviteId) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    await prisma.consultantInvite.deleteMany({
      where: { id: data.inviteId, acceptedAt: null },
    });
    return NextResponse.json({ ok: true });
  }

  if (data.action === "remove_consultant") {
    if (!data.profileId) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    await prisma.$transaction([
      prisma.userProfile.update({
        where: { id: data.profileId },
        data: { isConsultant: false },
      }),
      prisma.organizationMember.deleteMany({
        where: { userId: data.profileId, role: "ORG_CONSULTANT" },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (data.action === "assign_org") {
    if (!data.profileId || !data.orgId) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    const result = await assignConsultantToOrg(data.profileId, data.orgId);
    if (result === "has_real_membership") {
      return NextResponse.json({ error: "HAS_REAL_MEMBERSHIP" }, { status: 409 });
    }
    return NextResponse.json({ ok: true, result });
  }

  // unassign_org
  if (!data.profileId || !data.orgId) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  await prisma.organizationMember.deleteMany({
    where: { userId: data.profileId, orgId: data.orgId, role: "ORG_CONSULTANT" },
  });
  return NextResponse.json({ ok: true });
}
