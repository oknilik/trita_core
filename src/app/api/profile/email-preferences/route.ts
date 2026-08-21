import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getAccountSubscriptionState,
  setAccountSubscription,
} from "@/lib/newsletter";

// Levélbeállítások egy helyen — KÉT, egymástól független kapcsolóval:
//
//  1. Életciklus-emailek (reflexiós utókövetés és hasonlók). A tranzakcionális
//     emaileket (meghívók, eredmény-értesítők) NEM érinti.
//  2. Hírlevél / új blogbejegyzés értesítő. Külön tábla (NewsletterSubscriber),
//     mert a feliratkozók többségének nincs fiókja — a fiókos felhasználónál a
//     kapcsoló a saját címére szóló feliratkozást állítja.
//
// Mindkét mező opcionális a POST-ban: a kliens azt küldi, amit a felhasználó
// épp billentett.

const updateSchema = z
  .object({
    lifecycleEmailsOptOut: z.boolean().optional(),
    newsletterSubscribed: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.lifecycleEmailsOptOut !== undefined || data.newsletterSubscribed !== undefined,
    { message: "EMPTY_UPDATE" },
  );

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { lifecycleEmailsOptOut: true, email: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const newsletterSubscribed = profile.email
    ? await getAccountSubscriptionState(profile.email)
    : false;

  return NextResponse.json({
    lifecycleEmailsOptOut: profile.lifecycleEmailsOptOut,
    newsletterSubscribed,
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, locale: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  if (parsed.data.lifecycleEmailsOptOut !== undefined) {
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { lifecycleEmailsOptOut: parsed.data.lifecycleEmailsOptOut },
    });
  }

  if (parsed.data.newsletterSubscribed !== undefined) {
    // Cím nélküli profil (elméleti eset: a Clerk-szinkron még nem futott le)
    // esetén nincs mire feliratkozni — a kérés nem hiba, csak nem történik semmi.
    if (!profile.email) {
      return NextResponse.json({ error: "NO_EMAIL" }, { status: 409 });
    }
    await setAccountSubscription({
      email: profile.email,
      locale: profile.locale,
      userProfileId: profile.id,
      subscribed: parsed.data.newsletterSubscribed,
    });
  }

  return NextResponse.json({ ok: true });
}
