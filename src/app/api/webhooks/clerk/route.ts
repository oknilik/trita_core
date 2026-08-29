import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationCodeEmail, sendMagicLinkEmail, sendWelcomeEmail } from "@/lib/emails";
import { clerkClient } from "@clerk/nextjs/server";
import { normalizeJourneyIntent, setJourneyIntentForProfile } from "@/lib/journey/intent";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";
import { scrubProfileData } from "@/lib/account-scrub";
import { normalizeLocale } from "@/lib/i18n/core";
import { PLATFORM_TERMS_VERSION, PRIVACY_NOTICE_VERSION } from "@/lib/legal/versions";

const clerkUserSchema = z.object({
  id: z.string(),
  email_addresses: z
    .array(
      z.object({
        email_address: z.string().email(),
        id: z.string(),
      })
    )
    .optional(),
  primary_email_address_id: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  unsafe_metadata: z.record(z.string(), z.unknown()).optional(),
});

const clerkEmailSchema = z.object({
  type: z.literal("email.created"),
  data: z.object({
    to_email_address: z.string().email().optional(),
    email_address: z.string().email().optional(),
    recipient_email_address: z.string().email().optional(),
    user_id: z.string().optional().nullable(),
    sign_up_id: z.string().optional().nullable(),
    otp_code: z.string().optional(),
    magic_link_url: z.string().optional(),
    data: z
      .object({
        otp_code: z.string().optional(),
        code: z.string().optional(),
        verification_code: z.string().optional(),
        token: z.string().optional(),
        magic_link_url: z.string().optional(),
        url: z.string().optional(),
        ttl_seconds: z.number().optional(),
        ttl: z.number().optional(),
      })
      .optional(),
  }),
});

const registrationLegalAcceptanceSchema = z.object({
  accepted: z.literal(true),
  acceptedAt: z.string().datetime(),
  platformTermsVersion: z.literal(PLATFORM_TERMS_VERSION),
  privacyNoticeVersion: z.literal(PRIVACY_NOTICE_VERSION),
});

export async function POST(req: Request) {
  const log = await getRequestLogger("clerk-webhook");
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new NextResponse("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  const payload = await req.text();
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse("Missing webhook headers", { status: 400 });
  }

  let event: WebhookEvent;
  try {
    const webhook = new Webhook(secret);
    event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const user = clerkUserSchema.parse(event.data);
    const primaryEmail = user.email_addresses?.find(
      (email) => email.id === user.primary_email_address_id
    )?.email_address;
    const fallbackEmail = user.email_addresses?.[0]?.email_address;
    const email = primaryEmail ?? fallbackEmail ?? null;
    const registrationLegalAcceptance = registrationLegalAcceptanceSchema.safeParse(
      user.unsafe_metadata?.legalAcceptance,
    );
    const acceptedAt = registrationLegalAcceptance.success
      ? new Date(registrationLegalAcceptance.data.acceptedAt)
      : null;

    const upsertedProfile = await prisma.userProfile.upsert({
      where: { clerkId: user.id },
      create: {
        clerkId: user.id,
        email,
        username: user.username ?? null,
        ...(acceptedAt
          ? {
              platformTermsVersion: PLATFORM_TERMS_VERSION,
              platformTermsAcceptedAt: acceptedAt,
              privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
              privacyNoticeAcceptedAt: acceptedAt,
            }
          : {}),
      },
      update: {
        email,
        ...(user.username ? { username: user.username } : {}),
      },
      select: { id: true },
    });

    const intent = normalizeJourneyIntent(user.unsafe_metadata?.intent);
    if (intent) {
      await setJourneyIntentForProfile(upsertedProfile.id, intent);
    }

    // Note: org invites are fulfilled via the /join/org/[inviteId] page, not here,
    // so that profile data (username, gender, etc.) gets collected first.
    // Note: team invites are fulfilled via the /join/[token] page, not here.

    // Analitika: az új profil létrejötte a tölcsér utolsó, ÜZLETI lépése —
    // szerver-oldalról rögzítjük, mert a kliens-oldali „regisztráltam"
    // esemény hamisítható és ad-blockolható lenne.
    if (event.type === "user.created") {
      trackServerEvent("auth.signup", {}, { userProfileId: upsertedProfile.id });
    }

    // Back-link any observer invitations sent to this email before registration
    if (event.type === "user.created" && email) {
      const newProfile = await prisma.userProfile.findUnique({
        where: { clerkId: user.id },
        select: { id: true },
      });
      if (newProfile) {
        await prisma.observerInvitation.updateMany({
          where: {
            observerEmail: { equals: email, mode: "insensitive" },
            observerProfileId: null,
            status: { in: ["PENDING", "COMPLETED"] },
          },
          data: {
            observerProfileId: newProfile.id,
            observerType: "INTERNAL",
          },
        });
      }

      // Welcome email — best effort, a hibája nem buktathatja a webhookot
      // (Clerk nem-2xx-re újrapróbál, és a profil-szinkron a fontosabb).
      // A locale a sign-up unsafeMetadata-jából jön (sign-up/page.tsx).
      try {
        const metadataLocale = user.unsafe_metadata?.locale as string | undefined;
        await sendWelcomeEmail({
          to: email,
          locale: normalizeLocale(metadataLocale),
        });
      } catch (error) {
        log.error(
          { event: "clerk_webhook.welcome_email_failed", err: error },
          "Welcome email failed",
        );
      }
    }
  }

  if (event.type === "user.deleted") {
    const deletedId = z
      .object({ id: z.string() })
      .parse(event.data).id;
    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: deletedId },
      select: { id: true, email: true },
    });
    if (profile) {
      // Ugyanaz a teljes GDPR-scrub, mint az in-app törlési úton (közös forrás)
      // — a webhook-út korábban csak részlegesen takarított, így a dashboard/
      // support-törlés kikerülte az observer-scrubot (motor-audit W6).
      await scrubProfileData(profile.id, profile.email);
    }
  }

  if (event.type === "email.created") {
    log.debug({ event: "clerk.email_created", dataKeys: Object.keys(event.data ?? {}) }, "email.created webhook received");
    const parsed = clerkEmailSchema.safeParse(event);
    if (!parsed.success) {
      log.warn({ event: "clerk.email_created_parse_failed", err: parsed.error }, "email.created schema parse failed");
    }
    if (parsed.success) {
      const data = parsed.data.data;
      const to =
        data.to_email_address || data.email_address || data.recipient_email_address;
      const code =
        data.otp_code ||
        data.data?.otp_code ||
        data.data?.code ||
        data.data?.verification_code ||
        data.data?.token;
      const ttlSeconds = data.data?.ttl_seconds ?? data.data?.ttl ?? null;

      const magicLink =
        data.magic_link_url ||
        data.data?.magic_link_url ||
        data.data?.url;

      log.info({ event: "clerk.email_created_extracted", to, hasCode: Boolean(code), hasMagicLink: Boolean(magicLink) }, "email.created payload extracted");

      if (to && (magicLink || code)) {
        let locale: "hu" | "en" | undefined;
        // For existing users (sign-in): locale is stored in the DB, not in Clerk metadata
        try {
          const profile = await prisma.userProfile.findFirst({
            where: { email: { equals: to, mode: "insensitive" } },
            select: { locale: true },
          });
          const dbLocale = profile?.locale;
          if (dbLocale === "hu" || dbLocale === "en") {
            locale = dbLocale;
          }
        } catch (err) {
          log.warn({ event: "clerk.locale_db_read_failed", err }, "Failed to read DB locale");
        }
        // For new sign-ups (user not yet in DB): use sign-up metadata
        if (!locale && data.sign_up_id) {
          try {
            const client = await clerkClient();
            const signUp = await client.signUps.get(data.sign_up_id);
            const metaLocale = signUp.unsafeMetadata?.locale as string | undefined;
            if (metaLocale === "hu" || metaLocale === "en") {
              locale = metaLocale;
            }
          } catch (err) {
            log.warn({ event: "clerk.locale_signup_read_failed", err }, "Failed to read Clerk sign-up locale");
          }
        }

        // A feloldás alapértelmezése a DEFAULT_LOCALE (magyar). Korábban itt
        // `?? "en"` állt: ha a DB-olvasás hibázott vagy a profil még nem
        // létezett, a belépési kód angolul ment ki.
        const resolvedLocale = normalizeLocale(locale);

        if (magicLink) {
          await sendMagicLinkEmail({ to, magicLinkUrl: magicLink, locale: resolvedLocale });
        } else if (code) {
          const context = data.sign_up_id ? "signUp" : "signIn";
          await sendVerificationCodeEmail({ to, code, locale: resolvedLocale, ttlSeconds, context });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
