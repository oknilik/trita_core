import { Prisma, type NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const log = createLogger("account-scrub");

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
  // A törölt user NEVE a tranzakció ELŐTT kimentve — a lenti tombstone
  // nullázza, de az értesítés-redakcióhoz (vars.inviterName/targetLabel)
  // még kelleni fog.
  const scrubbedName =
    (
      await prisma.userProfile.findUnique({
        where: { id: profileId },
        select: { username: true },
      })
    )?.username?.trim() || null;

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
    // A self-eredmények elárvulnak (userProfileId → null, anonim aggregátum), ÉS
    // a publikus megosztó-linkjük visszavonódik. A shareToken nélkül a
    // /share/[token] oldalnak nincs guardja a törölt userre (findUnique csak a
    // tokenre) — ha bent marad, a törölt user személyiség-eredménye publikusan
    // elérhető maradna (motor-audit A1, HIGH). A token nullázása a linket a
    // „visszavont" állapot-oldalra viszi.
    prisma.assessmentResult.updateMany({
      where: { userProfileId: profileId },
      data: { userProfileId: null, shareToken: null },
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
    // Kapcsolat-űrlap (Inquiry): a törölt fél KÖZVETLEN, szabad-szöveges PII-ja
    // (név, email, cég, üzenet-szöveg). A profil-tombstone miatt az FK SetNull
    // nem elég — a mezőket redaktáljuk (a sor státusz/téma/időbélyeg megmarad az
    // aggregátumhoz). A name/email/message a sémában KÖTELEZŐ, ezért sentinelre
    // állítjuk, nem NULL-ra. Illesztés profil VAGY case-insensitive email szerint
    // (a contact-form email alapján auto-linkel — motor-audit v8 P1).
    prisma.inquiry.updateMany({
      where: email
        ? {
            OR: [
              { userProfileId: profileId },
              { email: { equals: email, mode: "insensitive" as const } },
            ],
          }
        : { userProfileId: profileId },
      data: { name: "—", email: "", company: null, message: "", userProfileId: null },
    }),
    // Jelölt-meghívó (CandidateInvite): ha a törölt fél JELÖLTKÉNT (email
    // szerint) szerepelt egy org hiring-folyamatában, a közvetlen azonosítóit
    // (email, név) elvágjuk — a CandidateResult score-ja pszeudonimizálva marad,
    // ugyanúgy, mint az observer/self esetében. A managerId a MEGHÍVÓ (nem a
    // jelölt), arra NEM illesztünk. Email híján nincs mire illeszteni → kimarad.
    ...(email
      ? [
          prisma.candidateInvite.updateMany({
            where: { email: { equals: email, mode: "insensitive" as const } },
            data: { email: null, name: null },
          }),
        ]
      : []),
    // Függő csapat-/szervezet-/tanácsadó-meghívók a törölt user emailjére:
    // a sor MAGA a PII (email + melyik org/csapat hívta) és funkciója sincs
    // már — töröljük. Case-insensitive illesztés, mint minden email-útnál.
    // Email híján (már scrubolt hívás) nincs mire illeszteni → kimarad.
    ...(email
      ? [
          prisma.teamPendingInvite.deleteMany({
            where: { email: { equals: email, mode: "insensitive" as const } },
          }),
          prisma.organizationPendingInvite.deleteMany({
            where: { email: { equals: email, mode: "insensitive" as const } },
          }),
          prisma.consultantInvite.deleteMany({
            where: { email: { equals: email, mode: "insensitive" as const } },
          }),
        ]
      : []),
    // Fake-door (érdeklődés-mérés) válaszok: a sor az aggregált számokhoz
    // marad (module/interest/ár), de a közvetlen azonosítók mennek — email,
    // profil-kapcsolat, ÉS az „egyéb" szabad szöveg (abba bármilyen PII-t
    // gépelhetett). Illesztés profil VAGY case-insensitive email szerint.
    prisma.fakeDoorResponse.updateMany({
      where: email
        ? {
            OR: [
              { profileId },
              { email: { equals: email, mode: "insensitive" as const } },
            ],
          }
        : { profileId },
      data: { email: null, otherText: null, profileId: null },
    }),
    // Analitika: az eseményeket nem töröljük, csak elvágjuk a személytől —
    // az aggregált tölcsér-számok nem esnek szét, de az események nem
    // köthetők vissza.
    prisma.analyticsEvent.updateMany({
      where: { userProfileId: profileId },
      data: { userProfileId: null, isAuthed: false },
    }),
    // Profil-tombstone: a személyhez köthető MINDEN mező elvágva. A korábbi
    // scrub csak a clerkId/email-t nullázta (motor-audit A2) — a username (név)
    // és a demográfiai/karrier-háttéradat (birthYear/gender/country/
    // careerBackground) bent maradt, pedig ezek is közvetlen PII-k. A locale és
    // a role/testType nem személyazonosító, marad. A careerBackground Json?, így
    // DB-NULL-ra a Prisma.DbNull kell.
    prisma.userProfile.update({
      where: { id: profileId },
      data: {
        clerkId: null,
        email: null,
        username: null,
        birthYear: null,
        gender: null,
        country: null,
        careerBackground: Prisma.DbNull,
        deleted: true,
      },
    }),
  ]);

  // A fő tranzakció UTÁN, best-effort: a törölt user neve/emailje MÁS userek
  // értesítés-listáiban (vars.inviterName / vars.targetLabel) különben örökre
  // bent maradna. Hibája nem akaszthatja meg a törlést — a DB-scrub fentebb
  // már lefutott.
  await redactScrubbedIdentityFromNotifications(scrubbedName, email);
}

// Az observer-értesítés-típusok, amelyek vars-a a meghívó/értékelt nevét
// (inviterName) vagy a meghívott értékelő címkéjét (targetLabel — név vagy
// email) hordozza. Forrás: notifications/orchestrator.ts (itt NEM módosítjuk).
const IDENTITY_CARRYING_NOTIFICATION_TYPES: NotificationType[] = [
  "OBSERVER_SUBMITTED",
  "OBSERVER_COLLEAGUE_INVITED",
  "OBSERVER_APPROVAL_REQUESTED",
  "OBSERVER_INVITE_APPROVED",
  "OBSERVER_INVITE_DECLINED",
];

/** A vars-mezőben szereplő érték a törölt userre mutat-e? (név-egyezés vagy
 *  email-egyezés/-tartalmazás — a targetLabel „Név (email)" formát is hordozhat). */
function matchesScrubbedIdentity(
  value: string,
  name: string | null,
  email: string | null,
): boolean {
  const v = value.trim();
  if (!v) return false;
  if (name && v === name) return true;
  if (email) {
    const emailLower = email.trim().toLowerCase();
    if (emailLower && v.toLowerCase().includes(emailLower)) return true;
  }
  return false;
}

/**
 * A törölt user nevét/emailjét hordozó notification-vars mezők redaktálása
 * „—" sentinelre. A JSON-mezőre nincs DB-oldali szűrés — a jelölt típusok
 * sorait olvassuk be, és JS-ben illesztünk (a típus-lista rövid, a
 * notification-tábla user-szinten korlátos).
 */
async function redactScrubbedIdentityFromNotifications(
  name: string | null,
  email: string | null,
): Promise<void> {
  if (!name && !email) return;
  try {
    const notifications = await prisma.notification.findMany({
      where: { type: { in: IDENTITY_CARRYING_NOTIFICATION_TYPES } },
      select: { id: true, vars: true },
    });

    const updates: Prisma.PrismaPromise<unknown>[] = [];
    for (const n of notifications) {
      const vars = n.vars as Record<string, unknown> | null;
      if (!vars || typeof vars !== "object") continue;
      let changed = false;
      const next: Record<string, unknown> = { ...vars };
      for (const key of ["inviterName", "targetLabel"] as const) {
        const value = next[key];
        if (typeof value === "string" && matchesScrubbedIdentity(value, name, email)) {
          next[key] = "—";
          changed = true;
        }
      }
      if (changed) {
        updates.push(
          prisma.notification.update({
            where: { id: n.id },
            data: { vars: next as Prisma.InputJsonValue },
          }),
        );
      }
    }
    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }
  } catch (err) {
    log.warn(
      { event: "account_scrub.notification_redact_failed", err },
      "Notification-vars redakció nem futott le — a fő scrub ettől még teljes",
    );
  }
}
