import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import { CAREER_FAKE_DOOR_MODULE, isFakeDoorSource } from "@/lib/fakedoor/career";
import { resolveFakeDoorContext } from "@/lib/fakedoor/context.server";
import { fakeDoorCookieOptions } from "@/lib/fakedoor/session";

// Megtekintés-rögzítés — ez a konverzió NEVEZŐJE.
//
// Kliensről hívjuk, nem a szerver-renderből: így a link-előtöltés (prefetch)
// és a robotok nem hígítják fel a nevezőt, és csak az számít megtekintésnek,
// ahol tényleg lefutott a böngésző.
//
// Itt íródik ki a munkamenet-cookie is. Szerver-komponens nem tud cookie-t
// írni, ezért a page csak GENERÁLJA az azonosítót, és az első kliens-hívás
// rögzíti — ugyanazt az értéket, amiből az ársáv sorsolódott, különben az ár
// visszatéréskor átugorhatna egy másik sávba.

const schema = z.object({
  sessionId: z.string().uuid(),
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

  const { sessionId } = parsed.data;
  const source =
    parsed.data.source && isFakeDoorSource(parsed.data.source)
      ? parsed.data.source
      : "direct";
  const context = await resolveFakeDoorContext(sessionId);

  try {
    // Munkamenetenként egy sor. Az újratöltés nem számít új megtekintésnek,
    // de a `create`-only ág miatt a legelső kontextus rögzül — ha közben
    // belépett, azt a válasz-sor már a friss kontextussal írja.
    await prisma.fakeDoorView.upsert({
      where: {
        module_sessionId: { module: CAREER_FAKE_DOOR_MODULE, sessionId },
      },
      create: {
        module: CAREER_FAKE_DOOR_MODULE,
        sessionId,
        userId: context.userId,
        profileId: context.profileId,
        audience: context.audience,
        priceVariant: context.priceVariant,
        source,
      },
      update: {},
    });
  } catch (error) {
    // A mérés SOHA nem ronthatja el az oldalt: a felhasználó ebből semmit nem
    // vesz észre, a hiba viszont ne vesszen el némán.
    const log = await getRequestLogger("fakedoor");
    log.error({ event: "fakedoor.view_failed", err: error }, "Fake door view logging failed");
  }

  const response = NextResponse.json({ ok: true });
  const { name, ...options } = fakeDoorCookieOptions();
  response.cookies.set(name, sessionId, options);
  return response;
}
