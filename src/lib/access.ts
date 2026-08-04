import { prisma } from "./prisma";
import { SELF_PAYWALL_ENABLED } from "./operating-mode";

/**
 * Egyéni hozzáférési szint.
 *
 * 2026-07-31: a korábbi kilenc fokozatú, csomag-alapú létra (Self Plus,
 * Team Snapshot, Team Deep Dive, Org Insight…) megszűnt — ezek a csomagok
 * nem léteznek. A felület amúgy is binárisra fordította le mindet, tehát
 * ez most már őszintén az, ami: van-e teljes egyéni riportod.
 *
 * A hozzáférést ma a szervezeti/csapat-tagság adja, nem vásárlás.
 */
export type SelfAccess = "basic" | "full";

/**
 * A `Purchase`-alapú ág a modellel együtt megszűnt (0 sor mindhárom
 * adatbázisban; a fizetés a platformon kívül történik). Ha a paywall valaha
 * visszakapcsol, a szervezeti/csapat-tagság adja a teljes szintet.
 */
export async function getSelfAccessLevel(userProfileId: string): Promise<SelfAccess> {
  // Paywall kikapcsolva: mindenki a teljes egyéni riportot kapja.
  // Visszakapcsolás: operating-mode.ts → SELF_PAYWALL_ENABLED = true.
  if (!SELF_PAYWALL_ENABLED) return "full";

  const [orgMembership, teamMembership] = await Promise.all([
    prisma.organizationMember.findFirst({
      where: { userId: userProfileId, leftAt: null },
      select: { id: true },
    }),
    prisma.teamMember.findFirst({
      where: { userId: userProfileId },
      select: { id: true },
    }),
  ]);

  return orgMembership || teamMembership ? "full" : "basic";
}
