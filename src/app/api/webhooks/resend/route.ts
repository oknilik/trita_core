import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { z } from "zod";
import { getRequestLogger } from "@/lib/logger.server";
import { applyDeliveryFeedback } from "@/lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resend kézbesítési webhook — a lista higiéniája.
 *
 * MIÉRT KELL: a küldő kód nem tudja megállapítani, hogy egy cím létezik-e; a
 * Resend HTTP-válasza csak azt mondja, átvette a levelet. A visszapattanás
 * percekkel később jön, ezen a csatornán. E nélkül a lista lassan megtelik
 * halott címekkel, ami a feladó-hírnevet (és így a MEGHÍVÓK kézbesítését is)
 * rontja.
 *
 * KÉT ESEMÉNYT dolgozunk fel, szándékosan MÁS következménnyel:
 *   · `email.bounced`   → BOUNCED (a cím nem létezik — technikai tény)
 *   · `email.complained` → UNSUBSCRIBED (spamnek jelölte — ez SZÁNDÉK, és a
 *     helyes válasz a leiratkoztatás, nem a „hibás cím" könyvelése)
 *
 * A soft bounce (átmeneti: tele a postafiók, ideiglenes elutasítás) NEM vezet
 * kizáráshoz — a Resend a `bounce.type` mezőben jelzi.
 *
 * Aláírás-ellenőrzés svix-szel, a Clerk-webhook mintájára. Titok nélkül a
 * végpont 500-zal elutasít: aláíratlan törlési/kizárási parancsot nem
 * fogadunk el.
 */

const resendEventSchema = z.object({
  type: z.string(),
  data: z
    .object({
      to: z.union([z.string(), z.array(z.string())]).optional(),
      email: z.string().optional(),
      subject: z.string().optional(),
      bounce: z
        .object({
          // "Permanent" | "Transient" | "Undetermined"
          type: z.string().optional(),
          subType: z.string().optional(),
        })
        .optional(),
    })
    .passthrough(),
});

/** A címzett a `to` mezőből — a Resend stringet vagy tömböt is küldhet. */
function firstRecipient(data: z.infer<typeof resendEventSchema>["data"]): string | null {
  if (typeof data.to === "string") return data.to;
  if (Array.isArray(data.to)) return data.to[0] ?? null;
  return data.email ?? null;
}

export async function POST(req: Request) {
  const log = await getRequestLogger("newsletter-webhook");

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    log.error({ event: "resend_webhook.secret_missing" }, "RESEND_WEBHOOK_SECRET is not set");
    return new NextResponse("Missing RESEND_WEBHOOK_SECRET", { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();

  let parsedEvent: unknown;
  try {
    parsedEvent = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (error) {
    log.warn({ event: "resend_webhook.invalid_signature", err: error }, "Invalid Resend signature");
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const parsed = resendEventSchema.safeParse(parsedEvent);
  if (!parsed.success) {
    // Ismeretlen alakú esemény: nyugtázzuk (különben a Resend újrapróbálja),
    // de nem csinálunk vele semmit.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { type, data } = parsed.data;
  if (type !== "email.bounced" && type !== "email.complained") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Átmeneti visszapattanás nem kizáró ok — a következő küldés sikerülhet.
  if (type === "email.bounced" && data.bounce?.type && data.bounce.type !== "Permanent") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const recipient = firstRecipient(data);
  if (!recipient) return NextResponse.json({ ok: true, ignored: true });

  try {
    const applied = await applyDeliveryFeedback(
      recipient,
      type === "email.complained" ? "complaint" : "bounce",
    );
    // A cím lehet, hogy nem is feliratkozó (tranzakcionális levél pattant
    // vissza) — az nem hiba, csak nincs mit tenni vele.
    return NextResponse.json({ ok: true, applied });
  } catch (error) {
    log.error({ event: "resend_webhook.apply_failed", type, err: error }, "Feedback apply failed");
    // 500 → a Resend újrapróbálja; a művelet idempotens, tehát ez biztonságos.
    return NextResponse.json({ error: "APPLY_FAILED" }, { status: 500 });
  }
}
