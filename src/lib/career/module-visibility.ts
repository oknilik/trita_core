import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Karrier-modul org-szintű kapcsolója — EGY forrásból.
//
// A szabály korábban a results-oldalon élt inline; mióta a karrier külön
// oldal (`/career`) és a fejléc-navigáció is dönt róla, három helyen kellene
// ugyanazt a lekérdezést leírni. Ha elcsúsznak, a menü mutatna egy linket egy
// 404-re — ezért közös helyen van.
//
// A szabály SZIGORÚBB verziót választ: ha a felhasználó BÁRMELY aktív
// szervezeti tagságánál rejtve van a modul, akkor rejtve van. (trita admin
// állítja: `Organization.hideCareerModule`.)
export const isCareerModuleHidden = cache(async (profileId: string): Promise<boolean> => {
  const hidden = await prisma.organizationMember.findFirst({
    where: { userId: profileId, leftAt: null, org: { hideCareerModule: true } },
    select: { id: true },
  });
  return Boolean(hidden);
});
