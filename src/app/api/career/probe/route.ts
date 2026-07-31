import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  CAREER_PROBE_ENABLED,
  CAREER_PROBE_KIND,
  CAREER_PROBE_PRICE_VERSION,
  CAREER_PROBE_STEPS,
} from "@/lib/career/deep-probe";

// Karrier-plusz kereslet-mérés lépés-rögzítés.
//
// Idempotens: egy felhasználó lépésenként EGY sort ad (a Feedback unique
// kulcsa userProfileId + kind + targetKey). A `choice` felülírható — aki
// meggondolja magát, az utolsó válasza számít.
//
// A `cta_view` és `page_view` szándékosan nem hordoz értéket: a puszta
// létezésük a nevező, amihez a lemorzsolódást mérjük.

const schema = z.object({
  step: z.enum(CAREER_PROBE_STEPS),
  /** Csak `choice` lépésnél: érdekli-e. */
  interested: z.boolean().optional(),
});

export async function POST(req: Request) {
  if (!CAREER_PROBE_ENABLED) {
    return NextResponse.json({ error: "PROBE_DISABLED" }, { status: 404 });
  }

  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  if (parsed.data.step === "choice" && typeof parsed.data.interested !== "boolean") {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const rating = parsed.data.step === "choice" ? (parsed.data.interested ? 1 : 0) : 1;
  // Az ár-verzió a válasz mellé kerül: ha az ár változik, a két minta
  // elkülöníthető marad — enélkül a régi válaszok némán összekeverednének
  // egy másik kérdésre adott válaszokkal.
  const payload = { priceVersion: CAREER_PROBE_PRICE_VERSION };

  await prisma.feedback.upsert({
    where: {
      userProfileId_kind_targetKey: {
        userProfileId: profile.id,
        kind: CAREER_PROBE_KIND,
        targetKey: parsed.data.step,
      },
    },
    create: {
      userProfileId: profile.id,
      kind: CAREER_PROBE_KIND,
      targetKey: parsed.data.step,
      rating,
      payload,
    },
    // A megjelenítés-lépéseket nem írjuk felül (az első látás számít), a
    // választást igen.
    update: parsed.data.step === "choice" ? { rating, payload } : {},
  });

  return NextResponse.json({ ok: true });
}
