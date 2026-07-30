import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

export interface ActiveOrgMembership {
  orgId: string;
  role: string;
  joinedAt: Date;
}

type ColumnExistsRow = { exists: boolean };
let activeOrgIdColumnState: "unknown" | "present" | "absent" = "unknown";

function isActiveOrgFieldCompatibilityError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const maybePrismaError = error as Error & { code?: string };
  return (
    // Client schema expects `activeOrgId`, but runtime DB may not have the column yet.
    ((error.name === "PrismaClientValidationError" &&
      error.message.includes("activeOrgId")) ||
      (error.name === "PrismaClientKnownRequestError" &&
        maybePrismaError.code === "P2022" &&
        error.message.includes("activeOrgId")))
  );
}

async function hasActiveOrgIdColumn(): Promise<boolean> {
  if (activeOrgIdColumnState === "present") return true;
  if (activeOrgIdColumnState === "absent") return false;

  const rows = await prisma.$queryRaw<ColumnExistsRow[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'UserProfile'
        AND column_name = 'activeOrgId'
    ) AS "exists"
  `;

  const exists = rows[0]?.exists === true;
  activeOrgIdColumnState = exists ? "present" : "absent";
  return exists;
}

async function readProfileActiveOrgId(
  profileId: string,
): Promise<{ exists: boolean; activeOrgId: string | null }> {
  if (!(await hasActiveOrgIdColumn())) {
    const profile = await prisma.userProfile.findUnique({
      where: { id: profileId },
      select: { id: true },
    });
    return { exists: Boolean(profile), activeOrgId: null };
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: profileId },
      select: { activeOrgId: true },
    });
    return { exists: Boolean(profile), activeOrgId: profile?.activeOrgId ?? null };
  } catch (error) {
    if (!isActiveOrgFieldCompatibilityError(error)) throw error;
    activeOrgIdColumnState = "absent";

    const profile = await prisma.userProfile.findUnique({
      where: { id: profileId },
      select: { id: true },
    });
    return { exists: Boolean(profile), activeOrgId: null };
  }
}

export async function setProfileActiveOrgId(
  profileId: string,
  orgId: string | null,
): Promise<void> {
  if (!(await hasActiveOrgIdColumn())) return;

  try {
    await prisma.userProfile.update({
      where: { id: profileId },
      data: { activeOrgId: orgId },
    });
  } catch (error) {
    if (!isActiveOrgFieldCompatibilityError(error)) throw error;
    activeOrgIdColumnState = "absent";
  }
}

export const listActiveOrgMemberships = cache(async function listActiveOrgMemberships(
  profileId: string,
): Promise<ActiveOrgMembership[]> {
  return prisma.organizationMember.findMany({
    where: { userId: profileId, leftAt: null },
    orderBy: { joinedAt: "desc" },
    select: { orgId: true, role: true, joinedAt: true },
  });
});

/**
 * Az aktív org-tagság — KÉRÉS-SZINTEN memoizálva (React cache).
 *
 * Miért: egy oldal-render 3–4× hívja (layout nav, journey context, oldal),
 * és mindannyiszor 2–3 query megy ki. A cache hatóköre EGY kérés, a kulcs a
 * profileId — kérések és felhasználók között nem szivároghat.
 *
 * Mellékhatás-jegyzet: a függvény öngyógyít (elavult activeOrgId-t
 * normalizál `setProfileActiveOrgId`-dal). A memoizációval ez kérésenként
 * EGYSZER fut le a korábbi 3–4 helyett — idempotens, tehát nyereség.
 *
 * FIGYELEM: ha ugyanabban a kérésben `setActiveOrgContext()`-tel org-ot
 * VÁLTASZ, utána ez a függvény a váltás ELŐTTI értéket adja vissza.
 * Ma egyetlen hívó sem olvas váltás után (ellenőrizve: api/org/context POST,
 * api/org POST, acceptance/service) — ha új ilyen hívó születik, a
 * setActiveOrgContext visszatérési értékét használd, ne ezt.
 */
export const getActiveOrgMembership = cache(async function getActiveOrgMembership(
  profileId: string,
): Promise<ActiveOrgMembership | null> {
  // EGY hullám: a kijelölt org-azonosító és a tagságok EGYSZERRE mennek ki.
  // Korábban 2–3 EGYMÁS UTÁNI kör volt (activeOrgId → explicit tagság →
  // fallback tagság), és mivel ez a journey fő Promise.all-jának egyik ága,
  // a teljes render erre a láncra várt. Egy usernek tipikusan 1–2 aktív
  // tagsága van, tehát a findMany nem drágább, mint a findFirst volt.
  const [{ exists, activeOrgId }, memberships] = await Promise.all([
    readProfileActiveOrgId(profileId),
    listActiveOrgMemberships(profileId),
  ]);
  if (!exists) return null;

  // A kijelölt org elsőbbsége; egyébként a legutóbb csatlakozott (a
  // listActiveOrgMemberships joinedAt szerint csökkenőben ad vissza).
  const explicitMembership = activeOrgId
    ? (memberships.find((m) => m.orgId === activeOrgId) ?? null)
    : null;
  if (explicitMembership) return explicitMembership;

  const fallbackMembership = memberships[0] ?? null;

  if (fallbackMembership && activeOrgId !== fallbackMembership.orgId) {
    await setProfileActiveOrgId(profileId, fallbackMembership.orgId);
  } else if (!fallbackMembership && activeOrgId) {
    await setProfileActiveOrgId(profileId, null);
  }

  return fallbackMembership;
});

/**
 * Aktív org beállítása. A visszatérési érték a MÉRVADÓ friss állapot —
 * hívás után NE a getActiveOrgMembership()-et olvasd ugyanabban a kérésben
 * (az memoizált, ld. ott).
 */
export async function setActiveOrgContext(
  profileId: string,
  orgId: string,
): Promise<ActiveOrgMembership | null> {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: profileId, orgId, leftAt: null },
    select: { orgId: true, role: true, joinedAt: true },
  });
  if (!membership) return null;

  await setProfileActiveOrgId(profileId, orgId);

  return membership;
}
