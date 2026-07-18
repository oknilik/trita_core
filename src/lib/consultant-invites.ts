// ─────────────────────────────────────────────────────────────────────
// Tanácsadó-onboarding a platformra (2026-07-17).
//
// Az admin email alapján hív meg tanácsadót (ConsultantInvite). A flag
// alkalmazása két úton történik:
//   1. meghíváskor, ha a profil már létezik → azonnal;
//   2. regisztráció/onboarding során email-egyezésnél (applyConsultantInviteIfAny).
// A platform-tanácsadó (UserProfile.isConsultant) nem kényszerül tesztre,
// és org-okhoz ORG_CONSULTANT tagsággal rendelhető (admin felületről).
// ─────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";

/**
 * Ha a megadott emailre él tanácsadó-meghívó, alkalmazzuk a profilra.
 * Idempotens; profil-létrehozás/onboarding után hívandó.
 */
export async function applyConsultantInviteIfAny(
  profileId: string,
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  const invite = await prisma.consultantInvite.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, acceptedAt: null },
    select: { id: true },
  });
  if (!invite) return false;

  await prisma.$transaction([
    prisma.userProfile.update({
      where: { id: profileId },
      data: { isConsultant: true },
    }),
    prisma.consultantInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);
  return true;
}

/** ORG_CONSULTANT tagság létrehozása egy szervezetben (idempotens). */
export async function assignConsultantToOrg(
  profileId: string,
  orgId: string,
): Promise<"created" | "already_consultant" | "has_real_membership"> {
  const existing = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profileId } },
    select: { role: true },
  });
  if (existing) {
    return existing.role === "ORG_CONSULTANT"
      ? "already_consultant"
      : "has_real_membership";
  }
  await prisma.organizationMember.create({
    data: { orgId, userId: profileId, role: "ORG_CONSULTANT" },
  });
  return "created";
}
