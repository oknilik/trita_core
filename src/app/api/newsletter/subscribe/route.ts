import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";
import {
  normalizeEmail,
  requestSubscription,
  NEWSLETTER_SOURCES,
  NEWSLETTER_TOPICS,
} from "@/lib/newsletter";
import { sendQueuedConfirmation } from "@/lib/newsletter-confirmation";

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

  // IP mellett cím-cooldown is kell: elosztott bot-háló ugyanarra a címre
  // különben korlátlan megerősítő levelet kérhetne. A Redis-kulcsbe nem kerül
  // személyes adat, csak a normalizált cím SHA-256 lenyomata.
  const emailHash = crypto
    .createHash("sha256")
    .update(normalizeEmail(parsed.data.email))
    .digest("hex");
  const emailRateLimitResponse = await checkRateLimit("newsletter", `email:${emailHash}`);
  if (emailRateLimitResponse) return emailRateLimitResponse;

  // Csak a profil SAJÁT, verifikált címével egyező beküldést kötjük a
  // profilhoz. Egy eltérő, kézzel beírt cím nem válhat CRM-kapcsolattá.
  let userProfileId: string | null = null;
  const { userId } = await auth();
  if (userId) {
    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
      select: { id: true, email: true },
    });
    if (profile?.email && normalizeEmail(profile.email) === normalizeEmail(parsed.data.email)) {
      userProfileId = profile.id;
    }
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
      const sent = await sendQueuedConfirmation(result.subscriberId);
      if (!sent) {
        log.error(
          { event: "newsletter.confirmation_not_sent", subscriberId: result.subscriberId },
          "Confirmation email remained in outbox",
        );
        return NextResponse.json({ error: "NEWSLETTER_CONFIRMATION_FAILED" }, { status: 502 });
      }
    }
    trackServerEvent("newsletter.submit", { source: parsed.data.source });
  } catch (error) {
    log.error(
      { event: "newsletter.subscribe_failed", source: parsed.data.source, err: error },
      "Newsletter subscription failed",
    );
    return NextResponse.json({ error: "NEWSLETTER_FAILED" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
