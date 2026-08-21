import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";
import { sendNewsletterConfirmEmail } from "@/lib/emails";
import { APP_URL } from "@/lib/email-layout";
import {
  confirmUrl,
  requestSubscription,
  NEWSLETTER_SOURCES,
  NEWSLETTER_TOPICS,
} from "@/lib/newsletter";

export const runtime = "nodejs";

/**
 * POST /api/newsletter/subscribe — feliratkozás kezdeményezése (double opt-in).
 *
 * KÉT DOLOG, AMIT SZÁNDÉKOSAN NEM CSINÁL:
 *
 *  1. **Nem árulja el, hogy a cím rajta van-e a listán.** Minden ág ugyanazt
 *     a `{ ok: true }` választ adja (érvénytelen payloadon kívül) — különben
 *     a végpont e-mail-cím ellenőrzővé válna: bárki megtudhatná egy címről,
 *     hogy feliratkozott-e nálunk.
 *  2. **Nem iratkoztat fel azonnal.** A cím megadása nem hozzájárulás: az a
 *     megerősítő levél megnyitása. Ld. `src/lib/newsletter.ts`.
 */
const subscribeSchema = z
  .object({
    email: z.string().trim().email().max(320),
    locale: z.enum(["hu", "en"]).optional(),
    source: z.enum(NEWSLETTER_SOURCES),
    topics: z.array(z.enum(NEWSLETTER_TOPICS)).min(1).max(2).optional(),
    // Mézesbödön: a botok kitöltik a rejtett mezőt (contact-form minta).
    website: z.string().optional(),
  })
  .strict();

export async function POST(req: Request) {
  const log = await getRequestLogger("newsletter");

  const rateLimitResponse = await checkRateLimit("newsletter");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = subscribeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "NEWSLETTER_INVALID_EMAIL" }, { status: 400 });
  }

  // Honeypot: sikert mímelünk, de nem történik semmi.
  if ((parsed.data.website ?? "").trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  // Ha épp be van jelentkezve, kötjük a profilhoz — de a feliratkozás
  // ATTÓL FÜGGETLENÜL a megadott címre szól (a kettő eltérhet).
  let userProfileId: string | null = null;
  const { userId } = await auth();
  if (userId) {
    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    userProfileId = profile?.id ?? null;
  }

  try {
    const result = await requestSubscription({
      email: parsed.data.email,
      locale: parsed.data.locale,
      source: parsed.data.source,
      topics: parsed.data.topics,
      userProfileId,
    });

    if (result.outcome === "confirmation_sent" && result.confirmToken) {
      // A levél best effort: ha a Resend elhasal, a feliratkozás attól még
      // PENDING marad, és az újra-beküldés friss tokennel új levelet küld.
      await sendNewsletterConfirmEmail({
        to: parsed.data.email,
        confirmUrl: confirmUrl(APP_URL, result.confirmToken),
        locale: result.locale,
      });

      trackServerEvent("newsletter.submit", { source: parsed.data.source });
    }
  } catch (error) {
    log.error(
      { event: "newsletter.subscribe_failed", source: parsed.data.source, err: error },
      "Newsletter subscription failed",
    );
    return NextResponse.json({ error: "NEWSLETTER_FAILED" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
