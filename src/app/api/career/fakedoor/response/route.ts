import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import {
  CAREER_FAKE_DOOR_MODULE,
  CAREER_NO_REASONS,
  CAREER_VALUE_GOALS,
  FAKE_DOOR_OTHER_MAX,
  isFakeDoorSource,
} from "@/lib/fakedoor/career";
import { resolveFakeDoorContext } from "@/lib/fakedoor/context.server";

// Válasz-rögzítés — a mérés SZÁMLÁLÓJA.
//
// Egy hívás, több szakaszban: a felhasználó előbb dönt (igen/nem), aztán
// esetleg megválaszolja a követő kérdést és megadja az e-mailjét. Minden
// szakasz ugyanazt a sort írja felül (unique: module + sessionId), így ha a
// követő kérdésnél elnavigál, a DÖNTÉSE akkor is megmarad — enélkül a
// legfontosabb jelzést veszítenénk el a legkisebb súrlódáson.

const schema = z.object({
  sessionId: z.string().uuid(),
  interest: z.enum(["yes", "no"]),
  valueGoal: z.enum(CAREER_VALUE_GOALS).optional(),
  reasonNo: z.enum(CAREER_NO_REASONS).optional(),
  otherText: z.string().max(FAKE_DOOR_OTHER_MAX).optional(),
  maxPriceHuf: z.number().int().min(0).optional(),
  emailOptIn: z.boolean().optional(),
  email: z.string().email().max(254).optional(),
  source: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  // A mérőoldal bejelentkezés mögött van, tehát a végpont is: nyitva hagyva
  // bárki tetszőleges számú sort írhatna, és a minta megmérgezhető lenne. Az
  // "anon" közönség a modellben marad — egy későbbi publikus változathoz.
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { sessionId, interest, otherText } = parsed.data;
  // Ágtisztaság: az „igen" ág kérdése ne szivárogjon a „nem" ág soraiba és
  // fordítva — egy elgépelt kliens-hívás máskülönben némán keverné a két
  // megoszlást.
  const valueGoal = interest === "yes" ? (parsed.data.valueGoal ?? null) : null;
  const reasonNo = interest === "no" ? (parsed.data.reasonNo ?? null) : null;
  const context = await resolveFakeDoorContext(sessionId);

  // A fizetési hajlandóság csak az ár-ághoz tartozik, és sosem lehet több a
  // LÁTOTT árnál — az érték csak ahhoz mérve értelmezhető. A felső határt a
  // szerver vágja, mert a kliens küldeménye nem bizonyíték.
  const maxPriceHuf =
    reasonNo === "price" && typeof parsed.data.maxPriceHuf === "number"
      ? Math.min(parsed.data.maxPriceHuf, context.priceVariant)
      : null;

  const emailOptIn = interest === "yes" && parsed.data.emailOptIn === true;
  const email = emailOptIn ? (parsed.data.email ?? null) : null;
  const source =
    parsed.data.source && isFakeDoorSource(parsed.data.source)
      ? parsed.data.source
      : "direct";

  try {
    // A megtekintés ideje a nevező-sorból jön: ebből számolható, mennyi időt
    // töltött az oldalon a döntésig. Ha valahogy hiányzik (pl. a view-hívás
    // elhasalt), a mostani idő a legjobb elérhető közelítés.
    const view = await prisma.fakeDoorView.findUnique({
      where: { module_sessionId: { module: CAREER_FAKE_DOOR_MODULE, sessionId } },
      select: { createdAt: true },
    });
    const viewedAt = view?.createdAt ?? new Date();

    await prisma.fakeDoorResponse.upsert({
      where: { module_sessionId: { module: CAREER_FAKE_DOOR_MODULE, sessionId } },
      create: {
        module: CAREER_FAKE_DOOR_MODULE,
        sessionId,
        userId: context.userId,
        profileId: context.profileId,
        audience: context.audience,
        priceVariant: context.priceVariant,
        interest,
        valueGoal,
        reasonNo,
        maxPriceHuf,
        otherText: otherText?.trim() || null,
        emailOptIn,
        email,
        source,
        viewedAt,
      },
      update: {
        interest,
        valueGoal,
        reasonNo,
        maxPriceHuf,
        otherText: otherText?.trim() || null,
        emailOptIn,
        email,
      },
    });
  } catch (error) {
    const log = await getRequestLogger("fakedoor");
    log.error(
      { event: "fakedoor.response_failed", err: error },
      "Fake door response save failed",
    );
    // Itt SZÁNDÉKOSAN hibát adunk vissza (a view-val ellentétben): a
    // felhasználó azt hinné, elmentettük a válaszát, holott nem — a UI
    // ilyenkor visszaállítja a gombokat.
    return NextResponse.json({ error: "SAVE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
