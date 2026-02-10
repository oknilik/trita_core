import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
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
    const name =
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.username ||
      null;

    await prisma.userProfile.upsert({
      where: { clerkId: user.id },
      create: {
        clerkId: user.id,
        email: primaryEmail ?? fallbackEmail ?? null,
        name,
      },
      update: {
        email: primaryEmail ?? fallbackEmail ?? null,
        name,
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
        data: { clerkId: null, email: null, name: null, deleted: true },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
