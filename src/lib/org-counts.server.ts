import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Org-szintű darabszámok EGY, kérés-szinten memoizált forrásból.
 *
 * Miért: ugyanezeket a count-okat a journey completionSummary és az
 * org-oldal adatbetöltője (org-stats) is kiszámolta, egymástól függetlenül —
 * mérve renderenként 2× ugyanaz a query. A React `cache()` az
 * argumentumokra kulcsol, ezért a közös hívópont kell hozzá, nem elég, hogy
 * a két lekérdezés véletlenül azonos.
 *
 * Biztonság: ezek tiszta, org-hatókörű darabszámok, a kulcs az orgId — a
 * jogosultság-ellenőrzés a hívó oldalán marad (org-tagság/szerep), ezek a
 * függvények maguk nem kapuznak és nem is adnak vissza személyes adatot.
 */

export const getOrgTeamCount = cache(async function getOrgTeamCount(
  orgId: string,
): Promise<number> {
  return prisma.team.count({ where: { orgId } });
});

export const getOrgPendingInviteCount = cache(async function getOrgPendingInviteCount(
  orgId: string,
): Promise<number> {
  return prisma.organizationPendingInvite.count({ where: { orgId } });
});

export const getOrgActiveCampaignCount = cache(async function getOrgActiveCampaignCount(
  orgId: string,
): Promise<number> {
  return prisma.campaign.count({ where: { orgId, status: "ACTIVE" } });
});
