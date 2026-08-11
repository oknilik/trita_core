import { prisma } from "@/lib/prisma";

/**
 * Fiók-törlési GDPR-scrub — EGY kanonikus forrás, amit MINDKÉT törlési út hív:
 * az in-app `/api/profile/delete` ÉS a Clerk `user.deleted` webhook. (Korábban
 * a webhook csak részleges takarítást végzett, így a dashboard/support-törlés
 * kikerülte az observer-scrubot — motor-audit W6.)
 *
 * A hívó felel a Clerk-user tényleges törléséért (az in-app út explicit hívja,
 * a webhook maga a törlés eredménye) — ez a függvény CSAK a DB-oldali adatot
 * vágja el a személytől.
 *
 * @param profileId a törölt UserProfile id-ja
 * @param email a profil emailje a rater-oldali illesztéshez (a userProfile.update
 *   ezt nullázza, ezért a hívó előre kimenti és átadja) — case-insensitive
 *   illesztés (a meghívó tetszőleges betűzéssel tárolhatta).
 */
export async function scrubProfileData(
  profileId: string,
  email: string | null,
): Promise<void> {
  // A törölt user rater-oldali azonosítói: a profil-id-ja, plusz az emailje
  // (ha névvel/emaillel hívták meg értékelőnek egy MÁSIK user meghívóján).
  // Case-INSENSITIVE email-illesztés: a flow minden más email-összevetése is az
  // (invite/colleagues), különben „John.Doe@X.com" vs „john.doe@x.com" kimaradna.
  const raterMatch = email
    ? {
        OR: [
          { observerProfileId: profileId },
          { observerEmail: { equals: email, mode: "insensitive" as const } },
        ],
      }
    : { observerProfileId: profileId };

  await prisma.$transaction([
    prisma.assessmentResult.updateMany({
      where: { userProfileId: profileId },
      data: { userProfileId: null },
    }),
    prisma.assessmentDraft.deleteMany({
      where: { userProfileId: profileId },
    }),
    // Páros összehasonlítás: a törölt fél minden meghívója/párja visszavonódik.
    prisma.compareInvite.updateMany({
      where: {
        OR: [{ inviterId: profileId }, { partnerId: profileId }],
        status: { in: ["PENDING", "ACCEPTED"] },
      },
      data: { status: "REVOKED" },
    }),
    // Árva observer-draftok: a törölt user által érintett (ÉRTÉKELT vagy
    // ÉRTÉKELŐ) meghívók piszkozatai. FONTOS: ez a meghívó-anonimizálás ELŐTT
    // fut, amíg az observerProfileId még a userre mutat — utána a rater-oldali
    // szűrés (observerProfileId) már nem találná meg.
    prisma.observerDraft.deleteMany({
      where: {
        invitation: {
          OR: [{ inviterId: profileId }, { observerProfileId: profileId }],
        },
      },
    }),
    // Observer-meghívók — ÉRTÉKELT (inviter) oldal: a FÜGGŐ meghívók lezárva
    // (token érvénytelen, reminder leáll), az értékelő PII-ja nullázva. A
    // KITÖLTÖTT meghívók az anonim aggregátumhoz kellenek — azokat nem bántjuk.
    prisma.observerInvitation.updateMany({
      where: {
        inviterId: profileId,
        status: { in: ["PENDING", "AWAITING_APPROVAL"] },
      },
      data: { status: "CANCELED", observerEmail: null, observerName: null },
    }),
    // … és MINDEN inviter-oldali meghívón (státusztól függetlenül — a COMPLETED
    // és a korábban CANCELED/EXPIRED sorokon is) elvágjuk a HARMADIK FÉL (a
    // törölt user meghívottjai) PII-ját. A rater-oldalt már minden státuszra
    // nulláztuk lentebb; ez a tükör az inviter-oldalra (motor-audit W6 maradék).
    // A completed értékelés SCORE-ja marad (anonim aggregátum).
    prisma.observerInvitation.updateMany({
      where: { inviterId: profileId },
      data: { observerEmail: null, observerName: null },
    }),
    // Observer-meghívók — ÉRTÉKELŐ (rater) oldal: a FÜGGŐ rater-meghívókat
    // lezárjuk (a kitöltő már nem létezik) …
    prisma.observerInvitation.updateMany({
      where: { ...raterMatch, status: { in: ["PENDING", "AWAITING_APPROVAL"] } },
      data: { status: "CANCELED" },
    }),
    // … és MINDEN rater-oldali meghívón (státusztól függetlenül, tehát a
    // CANCELED és EXPIRED sorokon is — motor-audit W6) elvágjuk a személy-
    // azonosítót. A COMPLETED értékelés SCORE-ja marad (anonim aggregátum),
    // csak a névhez/emailhez/profilhoz kötése szűnik meg.
    prisma.observerInvitation.updateMany({
      where: raterMatch,
      data: { observerProfileId: null, observerEmail: null, observerName: null },
    }),
    // Analitika: az eseményeket nem töröljük, csak elvágjuk a személytől —
    // az aggregált tölcsér-számok nem esnek szét, de az események nem
    // köthetők vissza.
    prisma.analyticsEvent.updateMany({
      where: { userProfileId: profileId },
      data: { userProfileId: null, isAuthed: false },
    }),
    prisma.userProfile.update({
      where: { id: profileId },
      data: { clerkId: null, email: null, deleted: true },
    }),
  ]);
}
