import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";
import { getOrgSubscription, getPlanTier } from "@/lib/subscription";
import { addCredits } from "@/lib/candidate-credits";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { isCandidateGatingEnabled } from "@/lib/operating-mode";

// DELETE /api/manager/candidates/[id] — revoke a PENDING candidate invite.
// Guard (2026-07-23): csak a tanácsadói kör (ORG_CONSULTANT / platform-
// tanácsadó / trita-admin) — a meghívó orgjának hatókörében.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;

  const invite = await prisma.candidateInvite.findUnique({
    where: { id },
    select: {
      id: true,
      managerId: true,
      orgId: true,
      teamId: true,
      status: true,
      name: true,
      email: true,
      position: true,
      team: { select: { orgId: true } },
    },
  });

  if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const inviteOrgId = invite.orgId ?? invite.team?.orgId ?? null;
  // leftAt: null — a szervezetből kilépett (volt) tag nem nyúlhat a meghívókhoz.
  const orgMembership = inviteOrgId
    ? await prisma.organizationMember.findFirst({
        where: { userId: profile.id, orgId: inviteOrgId, leftAt: null },
        select: { role: true },
      })
    : null;
  const allowed = isConsultantSurface(
    orgMembership?.role ?? null,
    profile.email,
    profile.isConsultant,
  );
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  if (invite.status !== "PENDING") return NextResponse.json({ error: "ALREADY_USED" }, { status: 409 });

  await prisma.candidateInvite.update({
    where: { id },
    data: { status: "CANCELED" },
  });

  // Kredit-visszatérítés csak élő gating mellett (operating-mode kapcsoló)
  if (isCandidateGatingEnabled()) {
    const orgId =
      inviteOrgId ??
      (await getActiveOrgMembership(profile.id))?.orgId ??
      null;
    if (orgId) {
      const sub = await getOrgSubscription(orgId);
      const tier = getPlanTier(sub);
      const isUnlimited = tier === "org" || tier === "scale";
      if (!isUnlimited && sub) {
        const label = invite.name ?? invite.email ?? "unknown";
        // FELHASZNÁLÁS-BIZONYÍTÉK (2026-08-11, fix): a visszatérítés csak
        // akkor jár, ha van ledger-nyom arról, hogy ERRE a jelöltre kredit
        // fogyott. A létrehozáskori fogyasztás ugyanezzel a note-tal
        // ledgerelődik (candidate-apply/service) — a kapcsolás gating-ki
        // állapotban létrejött (kredit nélküli) meghívóknál üt: azok
        // visszavonása a flag későbbi bekapcsolása után nem verhet ingyen
        // kreditet. MARADÉK-KOCKÁZAT (séma nélkül nem zárható): a ledger
        // nem hordoz invite-azonosítót, ezért az azonos nevű/pozíciójú
        // jelöltek usage-sora keresztben is bizonyítéknak számít — a
        // note-egyezés a legerősebb elérhető kulcs.
        const usageNote = `Jelölt: ${label}${invite.position ? ` (${invite.position})` : ""}`;
        const consumed = await prisma.candidateCredit.findFirst({
          where: { orgId, type: "usage", note: usageNote },
          select: { id: true },
        });
        if (consumed) {
          await addCredits({
            orgId,
            amount: 1,
            actorId: profile.id,
            // "refund" típus: a visszatérítés nem vásárlás — "purchase"-ként
            // ledgerelve a totalPurchased számot hamisította (2026-08-11, fix).
            type: "refund",
            note: `Visszavonás: ${label}${invite.position ? ` (${invite.position})` : ""}`,
          });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
