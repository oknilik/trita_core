import "server-only";

import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * A „forró" profil-mezők EGY, kérés-szinten memoizált lekérése.
 *
 * Miért kell: a `prisma.userProfile.findUnique({ where: { clerkId } })`
 * mintázat 130+ helyen szerepel, és egy oldal-render korábban 4–11× futtatta
 * (mérve). Mivel a React `cache()` az ARGUMENTUMOKRA kulcsol, a dedupe csak
 * akkor működik, ha a hívók UGYANAZT a select-et kérik — ezért egy közös,
 * bővebb select van itt, és a forró útvonalak ezt hívják.
 *
 * Biztonság:
 * - a kulcs maga az azonosító (id / clerkId), tehát felhasználók között nem
 *   keveredhet;
 * - a React `cache()` hatóköre EGY szerver-render — kérések között nem
 *   szivárog. React-renderen kívül (route handler, cron, szkript) a React
 *   `cache()` NEM memoizál, hanem közvetlenül hívja a függvényt
 *   (`if (!dispatcher) return fn.apply(...)`) — ott tehát nincs se gyorsulás,
 *   se szivárgás.
 *
 * Mit NE tegyél: ne tedd bele az `activeOrgId`-t. Azt a mezőt az
 * org-context.ts oszlop-létezés ellenőrzés mögött olvassa (staged migráció
 * kompatibilitás), és egy feltétel nélküli select elhasalna olyan DB-n, ahol
 * az oszlop még nincs meg.
 */
const PROFILE_CORE_SELECT = {
  id: true,
  clerkId: true,
  email: true,
  username: true,
  role: true,
  isConsultant: true,
  onboardedAt: true,
  assessmentSkippedAt: true,
  activeTeamId: true,
  locale: true,
  testType: true,
} as const;

export type ProfileCore = Prisma.UserProfileGetPayload<{
  select: typeof PROFILE_CORE_SELECT;
}>;

export const getProfileCoreById = cache(async function getProfileCoreById(
  profileId: string,
): Promise<ProfileCore | null> {
  return prisma.userProfile.findUnique({
    where: { id: profileId },
    select: PROFILE_CORE_SELECT,
  });
});

export const getProfileCoreByClerkId = cache(async function getProfileCoreByClerkId(
  clerkId: string,
): Promise<ProfileCore | null> {
  return prisma.userProfile.findUnique({
    where: { clerkId },
    select: PROFILE_CORE_SELECT,
  });
});
