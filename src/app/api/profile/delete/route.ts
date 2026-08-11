import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const deleteSchema = z.object({
  confirm: z.literal("DELETE"),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true },
  });

  if (profile) {
    // A törölt user rater-oldali azonosítói: a saját profil-id-ja, plusz az
    // emailje (ha névvel/emaillel hívták meg értékelőnek egy MÁSIK user
    // meghívóján). Az email a userProfile.update-nél nullázódik, ezért itt
    // előre kimentjük a szűréshez.
    const raterMatch = profile.email
      ? { OR: [{ observerProfileId: profile.id }, { observerEmail: profile.email }] }
      : { observerProfileId: profile.id };

    await prisma.$transaction([
      prisma.assessmentResult.updateMany({
        where: { userProfileId: profile.id },
        data: { userProfileId: null },
      }),
      prisma.assessmentDraft.deleteMany({
        where: { userProfileId: profile.id },
      }),
      // Páros összehasonlítás: a törölt fél minden meghívója/párja azonnal
      // visszavonódik — a másik fél sem érheti el többé a szimulációt.
      prisma.compareInvite.updateMany({
        where: {
          OR: [{ inviterId: profile.id }, { partnerId: profile.id }],
          status: { in: ["PENDING", "ACCEPTED"] },
        },
        data: { status: "REVOKED" },
      }),
      // Árva observer-draftok: a törölt user által érintett (mint ÉRTÉKELT vagy
      // mint ÉRTÉKELŐ) meghívók szerver-oldali piszkozatai. FONTOS: ez a
      // draft-törlés a meghívó-anonimizálás ELŐTT fut, amíg az observerProfileId
      // még a userre mutat — utána a rater-oldali szűrés már nem találná meg.
      prisma.observerDraft.deleteMany({
        where: {
          invitation: {
            OR: [{ inviterId: profile.id }, { observerProfileId: profile.id }],
          },
        },
      }),
      // Observer-meghívók (GDPR) — ÉRTÉKELT (inviter) oldal: a törölt user
      // FÜGGŐ meghívóit lezárjuk — így a token érvénytelen lesz (a /observe és
      // a submit elutasítja), és a reminder-sweep (csak PENDING-et céloz) sem
      // emailez tovább. Az értékelő PII-ját (email/név) is nullázzuk.
      // A már KITÖLTÖTT (COMPLETED) meghívók az anonim aggregátumhoz kellenek
      // — azokat NEM bántjuk.
      prisma.observerInvitation.updateMany({
        where: {
          inviterId: profile.id,
          status: { in: ["PENDING", "AWAITING_APPROVAL"] },
        },
        data: { status: "CANCELED", observerEmail: null, observerName: null },
      }),
      // Observer-meghívók (GDPR) — ÉRTÉKELŐ (rater) oldal: ha a törölt user
      // egy MÁSIK user meghívóján volt az értékelő (profil-kapcsolat vagy
      // email/név alapján), az őt azonosító adatot nullázzuk. A FÜGGŐ rater-
      // meghívókat le is zárjuk (a kitöltő már nem létezik). A KITÖLTÖTT
      // értékelések SCORE-ja marad (anonim aggregátum), csak a személyhez
      // kötése szűnik meg — ez a hiányzó rater-oldali GDPR-törlés (W6).
      prisma.observerInvitation.updateMany({
        where: { ...raterMatch, status: { in: ["PENDING", "AWAITING_APPROVAL"] } },
        data: {
          status: "CANCELED",
          observerProfileId: null,
          observerEmail: null,
          observerName: null,
        },
      }),
      prisma.observerInvitation.updateMany({
        where: { ...raterMatch, status: "COMPLETED" },
        data: { observerProfileId: null, observerEmail: null, observerName: null },
      }),
      // Analitika: az eseményeket NEM töröljük, hanem elvágjuk a személytől.
      // Így az aggregált tölcsér-számok (amelyekben a törlő felhasználó
      // annak idején benne volt) nem esnek szét visszamenőleg, de az
      // eseményei többé nem köthetők hozzá — ez a GDPR törlési jog
      // teljesítése az analitikai adaton.
      prisma.analyticsEvent.updateMany({
        where: { userProfileId: profile.id },
        data: { userProfileId: null, isAuthed: false },
      }),
      prisma.userProfile.update({
        where: { id: profile.id },
        data: { clerkId: null, email: null, deleted: true },
      }),
    ]);
  }

  const client = await clerkClient();
  await client.users.deleteUser(userId);

  return NextResponse.json({ ok: true });
}
