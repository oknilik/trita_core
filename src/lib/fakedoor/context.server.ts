import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isConsultantSurface, isPlatformAdminEmail } from "@/lib/measurement-auth";
import {
  assignPriceVariant,
  type CareerPriceVariant,
  type FakeDoorAudience,
} from "@/lib/fakedoor/career";

// A mérés kontextusa MINDIG a szerveren dől el.
//
// Az `audience` és a `priceVariant` sosem a kliens küldeménye: az egyik a
// szegmentálás alapja (tanácsadó ≠ egyéni vevő), a másik a kísérleti ág. Ha
// bármelyik hamisítható lenne, az egész minta megkérdőjelezhető.

export interface FakeDoorContext {
  userId: string | null;
  profileId: string | null;
  audience: FakeDoorAudience;
  priceVariant: CareerPriceVariant;
}

export async function resolveFakeDoorContext(
  sessionId: string,
): Promise<FakeDoorContext> {
  const priceVariant = assignPriceVariant(sessionId);
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, profileId: null, audience: "anon", priceVariant };
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      email: true,
      isConsultant: true,
      orgMemberships: {
        where: { leftAt: null },
        select: { role: true },
      },
    },
  });

  if (!profile) {
    return { userId, profileId: null, audience: "anon", priceVariant };
  }

  // Tanácsadói kör: bármely aktív tagságában tanácsadó, vagy platform admin.
  // Az ő válasza más terméket értékel (ügyfélnek vásárolna, nem magának) —
  // ezért külön szegmens, nem kizárás: a jelzés érdekes, csak nem keverhető.
  const isConsultant =
    profile.isConsultant ||
    isPlatformAdminEmail(profile.email) ||
    profile.orgMemberships.some((membership) =>
      isConsultantSurface(membership.role, profile.email, profile.isConsultant),
    );
  const audience: FakeDoorAudience = isConsultant ? "consultant" : "individual";

  return { userId, profileId: profile.id, audience, priceVariant };
}
