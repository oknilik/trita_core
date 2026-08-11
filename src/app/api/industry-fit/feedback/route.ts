import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOccupation } from "@/lib/career/catalog";
import { computeCareerFit } from "@/lib/career/engine";
import { CAREER_MODULE_READY } from "@/lib/career/module-state";
import { isCareerModuleHidden } from "@/lib/career/module-visibility";
import { buildPersonInput } from "@/lib/career/person";
import { checkRateLimit } from "@/lib/rate-limit";

// Kalibrációs visszajelzés: „dolgoztál hasonló szerepben — találó volt?"
// A súlyok hosszú távú validálásának adatforrása (F3: known-groups + kalibráció).
// Upsert: az utolsó válasz számít, foglalkozásonként egy.
//
// A v2 óta a katalógus-tétel azonosítója az O*NET-SOC kód, és a `targetKey` maga
// a SOC. A régi sorok „iparág:szerep" alakú kulcsot tartalmaznak — az admin-nézet
// mindkét formátumot felismeri.
//
// A fitScore-t 2026-08-11 óta a SZERVER számolja újra a tárolt profilból. A
// korábbi séma a kliens által állított pontszámot mentette rating-ként — egy
// hamisított POST a jövőbeli kalibrációt (Wilson/known-groups) mérgezte volna.
// A kliens csak a foglalkozást és a verdiktet mondja meg.

const schema = z.object({
  /** O*NET-SOC kód a v2 katalógusból */
  occupationId: z.string().min(3).max(20),
  verdict: z.enum(["accurate", "inaccurate"]),
});

export async function POST(req: Request) {
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // Kapuzás a /api/career/fit mintájára: parkolt modul VAGY org-szintű
  // elrejtés esetén a végpont NEM létezik. A visszajelző gombok csak a karrier-
  // eredménykártyákon élnek, amik kizárólag élő modulnál renderelnek — kapu
  // nélkül a végpont akkor is írható volt, amikor a UI szerint a feature nincs.
  if (!CAREER_MODULE_READY || (await isCareerModuleHidden(profile.id))) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const { occupationId, verdict } = parsed.data;

  // Csak létező katalógus-tételre fogadunk visszajelzést.
  if (!getOccupation(occupationId)) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  // A pontszám a tárolt profilból, szerver-oldalon — ugyanaz a motor, ami a
  // képernyőnek számol (person + engine), így a mentett rating azt tükrözi,
  // amit a rendszer ténylegesen állított, nem amit a kliens küldött.
  const { person, hasSelfResult } = await buildPersonInput(profile.id);
  if (!hasSelfResult) {
    return NextResponse.json({ error: "NO_ASSESSMENT" }, { status: 409 });
  }
  const fit = computeCareerFit(person, { only: [occupationId] }).ranked[0];
  if (!fit) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  await prisma.feedback.upsert({
    where: {
      userProfileId_kind_targetKey: {
        userProfileId: profile.id,
        kind: "role_fit",
        targetKey: occupationId,
      },
    },
    create: {
      userProfileId: profile.id,
      kind: "role_fit",
      targetKey: occupationId,
      rating: fit.demandFit,
      payload: { verdict },
    },
    update: { rating: fit.demandFit, payload: { verdict } },
  });

  return NextResponse.json({ ok: true });
}
