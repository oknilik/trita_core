import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationCodeEmail } from "@/lib/emails";
import { clerkClient } from "@clerk/nextjs/server";

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
});

const clerkEmailSchema = z.object({
  type: z.literal("email.created"),
  data: z.object({
    to_email_address: z.string().email().optional(),
    email_address: z.string().email().optional(),
    recipient_email_address: z.string().email().optional(),
    user_id: z.string().optional().nullable(),
    otp_code: z.string().optional(),
    data: z
      .object({
        otp_code: z.string().optional(),
        code: z.string().optional(),
        verification_code: z.string().optional(),
        token: z.string().optional(),
        ttl_seconds: z.number().optional(),
        ttl: z.number().optional(),
      })
      .optional(),
  }),
});

export async function POST(req: Request) {
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

    await prisma.userProfile.upsert({
      where: { clerkId: user.id },
      create: {
        clerkId: user.id,
        email,
        username: user.username ?? null,
      },
      update: {
        email,
        ...(user.username ? { username: user.username } : {}),
      },
    });
  }

  if (event.type === "user.deleted") {
    const deletedId = z
      .object({ id: z.string() })
      .parse(event.data).id;
    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: deletedId },
    });
    if (profile) {
      await prisma.userProfile.update({
        where: { id: profile.id },
        data: { clerkId: null, email: null, deleted: true },
      });
    }
  }

  if (event.type === "email.created") {
    const parsed = clerkEmailSchema.safeParse(event);
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

      if (to && code) {
        let locale: "hu" | "en" | "de" | undefined;
        if (data.user_id) {
          try {
            const client = await clerkClient();
            const user = await client.users.getUser(data.user_id);
            const metaLocale =
              (user.unsafeMetadata?.locale as string | undefined) ||
              (user.publicMetadata?.locale as string | undefined);
            if (metaLocale === "hu" || metaLocale === "en" || metaLocale === "de") {
              locale = metaLocale;
            }
          } catch (err) {
            console.warn("[Email] Failed to read Clerk user locale:", err);
          }
        }

        await sendVerificationCodeEmail({
          to,
          code,
          locale,
          ttlSeconds,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
