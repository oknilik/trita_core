import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOccupation } from "@/lib/career/catalog";
import { checkRateLimit } from "@/lib/rate-limit";

// Kalibrációs visszajelzés: „dolgoztál hasonló szerepben — találó volt?"
// A súlyok hosszú távú validálásának adatforrása (F3: known-groups + kalibráció).
// Upsert: az utolsó válasz számít, foglalkozásonként egy.
//
// A v2 óta a katalógus-tétel azonosítója az O*NET-SOC kód, és a `targetKey` maga
// a SOC. A régi sorok „iparág:szerep" alakú kulcsot tartalmaznak — az admin-nézet
// mindkét formátumot felismeri.

const schema = z.object({
  /** O*NET-SOC kód a v2 katalógusból */
  occupationId: z.string().min(3).max(20),
  fitScore: z.number().int().min(0).max(100),
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

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const { occupationId, fitScore, verdict } = parsed.data;

  // Csak létező katalógus-tételre fogadunk visszajelzést.
  if (!getOccupation(occupationId)) {
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
      rating: fitScore,
      payload: { verdict },
    },
    update: { rating: fitScore, payload: { verdict } },
  });

  return NextResponse.json({ ok: true });
}
