import "server-only";

import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { normalizeLocale, type Locale } from "@/lib/i18n/core";

const log = createLogger("newsletter");

/**
 * HÍRLEVÉL / BLOG-FELIRATKOZÁS — domain réteg.
 *
 * Az egyetlen hely, ahol a feliratkozás állapotgépe él. A route handlerek
 * validálnak és fordítanak, az állapot-átmenet MIND itt van, mert a
 * szabályok üzletiek, nem HTTP-jellegűek:
 *
 *   PENDING ──(confirm, érvényes tokennel)──▶ ACTIVE
 *   ACTIVE  ──(unsubscribe)────────────────▶ UNSUBSCRIBED
 *   UNSUBSCRIBED ──(új feliratkozás)───────▶ PENDING  (újra opt-in kell)
 *   * ──(kézbesítési hiba)─────────────────▶ BOUNCED  (küldésből kiesik)
 *
 * KÜLDENI KIZÁRÓLAG `ACTIVE` sorra szabad — ezt a `listSendableSubscribers`
 * kapuja tartja be, ne kerülje meg senki saját lekérdezéssel.
 */

export type SubscriberStatus = "PENDING" | "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED";

/** Tartalom-típusok. Ma kettő van; a mező azért tömb, hogy bővíthető legyen. */
export const NEWSLETTER_TOPICS = ["blog", "newsletter"] as const;
export type NewsletterTopic = (typeof NEWSLETTER_TOPICS)[number];

/**
 * Alapértelmezett topic-készlet: MINDKETTŐ.
 *
 * A megerősítő levél szövege is mindkettőt ígéri („új blogbejegyzésnél és
 * időnként egy-egy gyakorlati összefoglalónál"), tehát a hozzájárulás
 * mindkettőre szól. Aki csak az egyiket kéri, a levélbeállításain szűkíti.
 */
export const DEFAULT_TOPICS: NewsletterTopic[] = ["blog", "newsletter"];

/** Honnan érkezett a feliratkozás — zárt értékkészlet (analitika is ezt viszi). */
export const NEWSLETTER_SOURCES = [
  "blog_post",
  "blog_index",
  "footer",
  "try_complete",
  "account",
] as const;
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];

/**
 * A megerősítő token élettartama. 7 nap: elég hosszú ahhoz, hogy a hétvégén
 * feliratkozó is megerősítse hétfőn, és elég rövid ahhoz, hogy egy régi
 * postafiókból kiszivárgó link ne legyen örökre beváltható.
 */
export const CONFIRM_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Cím-normalizálás. A `@unique` EBBEN az alakban áll, ezért minden írási és
 * olvasási út ezen megy át — különben a „Kata@Example.com" és a
 * „kata@example.com" két külön feliratkozó lenne, két külön levéllel.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** URL-biztos, 256 bites véletlen token (megerősítés és leiratkozás). */
function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export interface SubscribeResult {
  /** Mi történt — a hívó ez alapján dönt a levélküldésről. */
  outcome:
    | "confirmation_sent" // új vagy újraéledő feliratkozás → megerősítő levél megy
    | "already_active" // már megerősített feliratkozó → nem küldünk semmit
    | "suppressed"; // BOUNCED cím → csendben elnyeljük
  /** Csak `confirmation_sent` esetén van értelme. */
  confirmToken?: string;
  subscriberId: string;
  locale: Locale;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Feliratkozás kezdeményezése (double opt-in első fele).
 *
 * A visszatérési érték SOHA nem szivárogtatja ki, hogy a cím létezett-e a
 * listán — a hívó route mindig ugyanazt a választ adja. Az outcome kizárólag
 * arra való, hogy eldöntse, KELL-E levelet küldeni.
 *
 * Minden hívás ÚJ `confirmToken`-t generál: a korábban kiküldött megerősítő
 * link ezzel azonnal érvénytelen (nincs több érvényes token egy címre).
 */
export async function requestSubscription(params: {
  email: string;
  locale?: string | null;
  source: NewsletterSource;
  topics?: NewsletterTopic[];
  userProfileId?: string | null;
}): Promise<SubscribeResult> {
  const email = normalizeEmail(params.email);
  const locale = normalizeLocale(params.locale ?? undefined);
  const topics = Array.from(new Set(params.topics?.length ? params.topics : DEFAULT_TOPICS));

  // Az olvasás + feltételes írás ismételhető, mert közben két legitim verseny
  // is történhet: ugyanazt a címet két kérés hozza létre, vagy a címzett épp
  // megerősíti a korábbi kérését. Az updateMany státuszfeltétele garantálja,
  // hogy egyik esetben se írjunk vissza egy közben ACTIVE/BOUNCED állapotot.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    // Visszapattant cím: nem küldünk rá újra. A felület felé ez ugyanaz a
    // „megnéztük a postafiókod" válasz — a lista-higiénia nem a látogató dolga.
    if (existing?.status === "BOUNCED") {
      return { outcome: "suppressed", subscriberId: existing.id, locale };
    }

    if (existing?.status === "ACTIVE") {
      // Publikus, aláíratlan kérés AKTÍV sornál teljes no-op. Különben bárki,
      // aki ismeri a címet, átírhatná a nyelvet vagy bővíthetné a témákat.
      return { outcome: "already_active", subscriberId: existing.id, locale };
    }

    const confirmToken = generateToken();
    const tokenExpiresAt = new Date(Date.now() + CONFIRM_TOKEN_TTL_MS);

    if (existing) {
      const updated = await prisma.newsletterSubscriber.updateMany({
        where: {
          id: existing.id,
          status: { in: ["PENDING", "UNSUBSCRIBED"] },
        },
        data: {
          locale,
          status: "PENDING",
          topics,
          source: params.source,
          confirmToken,
          tokenExpiresAt,
          // Új feliratkozás után egy régi, továbbított levél leiratkozó
          // linkje ne vonhassa vissza az új hozzájárulást.
          ...(existing.status === "UNSUBSCRIBED" ? { unsubToken: generateToken() } : {}),
          unsubscribedAt: null,
          confirmationEmailStatus: "QUEUED",
          confirmationEmailAttempts: 0,
          confirmationEmailLastAttemptAt: null,
          confirmationEmailSentAt: null,
          confirmationEmailLastError: null,
          ...(params.userProfileId ? { userProfileId: params.userProfileId } : {}),
        },
      });
      if (updated.count === 1) {
        return { outcome: "confirmation_sent", confirmToken, subscriberId: existing.id, locale };
      }
      continue;
    }

    try {
      const created = await prisma.newsletterSubscriber.create({
        data: {
          email,
          locale,
          status: "PENDING",
          topics,
          source: params.source,
          confirmToken,
          tokenExpiresAt,
          unsubToken: generateToken(),
          userProfileId: params.userProfileId ?? null,
          confirmationEmailStatus: "QUEUED",
        },
        select: { id: true },
      });
      return { outcome: "confirmation_sent", confirmToken, subscriberId: created.id, locale };
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      // A másik kérés nyerte a create-ot; a következő kör annak állapotából
      // indul, és csak megengedett státuszból írhat.
    }
  }

  throw new Error("newsletter_subscription_state_changed_repeatedly");
}

export interface ConfirmResult {
  ok: boolean;
  /** `invalid` — nincs ilyen token; `expired` — lejárt; `already` — már aktív volt. */
  reason?: "invalid" | "expired";
  locale: Locale;
  unsubToken?: string;
}

export type ConfirmationDecision = "activate" | "already_active" | "expired" | "invalid";

/** Tiszta állapotgép: tesztelhetően csak PENDING sor aktiválható. */
export function confirmationDecision(
  status: SubscriberStatus,
  tokenExpiresAt: Date,
  now: Date,
): ConfirmationDecision {
  if (status === "ACTIVE") return "already_active";
  if (status !== "PENDING") return "invalid";
  return tokenExpiresAt.getTime() <= now.getTime() ? "expired" : "activate";
}

/**
 * Megerősítés (double opt-in második fele) — PENDING → ACTIVE.
 *
 * A `confirmedAt` ettől kezdve a hozzájárulás BIZONYÍTÉKA: ez az időpont az,
 * amit egy adatvédelmi kérdésre fel tudunk mutatni. Ezért nem írjuk felül
 * ismételt megerősítésnél sem.
 */
export async function confirmSubscription(token: string): Promise<ConfirmResult> {
  const row = await prisma.newsletterSubscriber.findUnique({
    where: { confirmToken: token },
    select: {
      id: true,
      status: true,
      locale: true,
      unsubToken: true,
      tokenExpiresAt: true,
      confirmedAt: true,
    },
  });

  if (!row) return { ok: false, reason: "invalid", locale: "hu" };

  const locale = normalizeLocale(row.locale);

  const now = new Date();
  const decision = confirmationDecision(
    row.status as SubscriberStatus,
    row.tokenExpiresAt,
    now,
  );
  // Csak PENDING → ACTIVE megengedett. Egy régi link soha nem írhatja felül
  // a leiratkozást vagy a bounce-szuppressziót.
  if (decision === "already_active") {
    return { ok: true, locale, unsubToken: row.unsubToken };
  }

  if (decision === "invalid") {
    return { ok: false, reason: "invalid", locale };
  }

  if (decision === "expired") {
    return { ok: false, reason: "expired", locale };
  }

  const activated = await prisma.newsletterSubscriber.updateMany({
    where: {
      id: row.id,
      status: "PENDING",
      confirmToken: token,
      tokenExpiresAt: { gt: now },
    },
    data: {
      status: "ACTIVE",
      confirmedAt: row.confirmedAt ?? now,
      // A felhasznált token többé ne legyen beváltható vagy kiszivárogtatható.
      confirmToken: generateToken(),
      tokenExpiresAt: new Date(),
      confirmationEmailStatus: "SENT",
    },
  });

  // A token ellenőrzése és az írás között leiratkozás/bounce futhatott le.
  // A feltételes update ilyenkor nem aktivál újra; párhuzamos confirm esetén
  // viszont az első nyertes eredményét idempotensen elfogadjuk.
  if (activated.count !== 1) {
    const current = await prisma.newsletterSubscriber.findUnique({
      where: { id: row.id },
      select: { status: true, unsubToken: true },
    });
    if (current?.status === "ACTIVE") {
      return { ok: true, locale, unsubToken: current.unsubToken };
    }
    return { ok: false, reason: "invalid", locale };
  }

  log.info({ event: "newsletter.confirmed", subscriberId: row.id }, "Newsletter subscription confirmed");
  return { ok: true, locale, unsubToken: row.unsubToken };
}

/**
 * Leiratkozás — auth nélkül, egyetlen kattintással, örök tokennel.
 *
 * Idempotens: a már leiratkozott sorra újra meghívva is sikert ad. A
 * `List-Unsubscribe-Post` fejléc miatt a levelezők ELŐRE is behívhatják,
 * ezért nem szabad hibára futnia semmilyen ismételt hívásnak.
 */
export async function unsubscribeByToken(token: string): Promise<{ ok: boolean; locale: Locale }> {
  const row = await prisma.newsletterSubscriber.findUnique({
    where: { unsubToken: token },
    select: { id: true, status: true, locale: true },
  });

  if (!row) return { ok: false, locale: "hu" };

  if (row.status !== "UNSUBSCRIBED") {
    await prisma.newsletterSubscriber.update({
      where: { id: row.id },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
        confirmToken: generateToken(),
        tokenExpiresAt: new Date(),
      },
    });
    log.info({ event: "newsletter.unsubscribed", subscriberId: row.id }, "Newsletter unsubscribed");
  }

  return { ok: true, locale: normalizeLocale(row.locale) };
}

// A tiszta linképítők külön, `server-only` NÉLKÜLI modulban élnek, hogy a
// route-regressziós teszt is importálhassa őket — ld. `newsletter-links.ts`.
export {
  blogImageUrl,
  clickUrl,
  confirmUrl,
  unsubscribePostUrl,
  unsubscribeUrl,
} from "@/lib/newsletter-links";

/**
 * FIÓKOS feliratkozás-kapcsoló (`/email-preferences`).
 *
 * MIÉRT NINCS ITT DOUBLE OPT-IN: a belépett felhasználó címét a Clerk már
 * verifikálta (a fiókjába csak a cím birtokosa jut be), a kapcsoló
 * átbillentése pedig maga a kifejezett, önkéntes hozzájárulás — időbélyeggel
 * együtt. A megerősítő levél itt nem adna új garanciát, cserébe a saját
 * beállítás-oldalán küldene a felhasználónak egy „erősítsd meg" levelet,
 * amit joggal érezne hibának.
 *
 * A publikus űrlapon ez NEM igaz (bárki beírhat egy idegen címet), ezért ott
 * a double opt-in marad kötelező.
 */
export async function setAccountSubscriptionTopics(params: {
  email: string;
  locale?: string | null;
  userProfileId: string;
  topics: NewsletterTopic[];
}): Promise<boolean> {
  const email = normalizeEmail(params.email);
  const locale = normalizeLocale(params.locale ?? undefined);

  const topics = Array.from(new Set(params.topics));
  if (topics.length === 0) {
    await prisma.newsletterSubscriber.updateMany({
      // A hard-bounce technikai szuppresszió maradjon végleges. Ha ezt itt
      // UNSUBSCRIBED-ra írnánk, egy későbbi bekapcsolás újra ACTIVE-vá
      // tehetné ugyanazt a bizonyítottan hibás címet.
      where: { email, status: { not: "BOUNCED" } },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
        confirmToken: generateToken(),
        tokenExpiresAt: new Date(),
      },
    });
    return true;
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const now = new Date();
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
      select: { id: true, status: true },
    });
    // Egy hard-bounce technikai szuppresszió; egy UI-kapcsoló nem teheti újra
    // küldhetővé ugyanazt a bizonyítottan hibás címet.
    if (existing?.status === "BOUNCED") return false;

    if (existing?.status === "ACTIVE") {
      const updated = await prisma.newsletterSubscriber.updateMany({
        where: { id: existing.id, status: "ACTIVE" },
        data: {
          locale,
          topics: { set: topics },
          userProfileId: params.userProfileId,
          // `confirmedAt` az eredeti hozzájárulás bizonyítéka; egyszerű
          // témaváltáskor nem írjuk át a mai időre.
        },
      });
      if (updated.count === 1) return true;
      continue;
    }

    if (existing) {
      const activated = await prisma.newsletterSubscriber.updateMany({
        where: { id: existing.id, status: { in: ["PENDING", "UNSUBSCRIBED"] } },
        data: {
          status: "ACTIVE",
          locale,
          topics,
          unsubscribedAt: null,
          confirmedAt: now,
          userProfileId: params.userProfileId,
          confirmToken: generateToken(),
          tokenExpiresAt: now,
          unsubToken: generateToken(),
          confirmationEmailStatus: "NOT_REQUIRED",
        },
      });
      if (activated.count === 1) return true;
      continue;
    }

    try {
      await prisma.newsletterSubscriber.create({
        data: {
          email,
          locale,
          status: "ACTIVE",
          topics,
          source: "account",
          confirmToken: generateToken(),
          tokenExpiresAt: now,
          unsubToken: generateToken(),
          confirmedAt: now,
          userProfileId: params.userProfileId,
          confirmationEmailStatus: "NOT_REQUIRED",
        },
      });
      return true;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }
  return false;
}

/** A fiók címéhez tartozó aktív témák (a két kapcsoló kezdőértéke). */
export async function getAccountSubscriptionTopics(email: string): Promise<NewsletterTopic[]> {
  const row = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalizeEmail(email) },
    select: { status: true, topics: true },
  });
  if (row?.status !== "ACTIVE") return [];
  return row.topics.filter((topic): topic is NewsletterTopic =>
    NEWSLETTER_TOPICS.includes(topic as NewsletterTopic),
  );
}

export interface SendableSubscriber {
  id: string;
  email: string;
  locale: Locale;
  unsubToken: string;
}

export const DELIVERY_MAX_ATTEMPTS = 5;
export const DELIVERY_CLAIM_STALE_MS = 30 * 60 * 1000;

/** Félbeszakadt processz CLAIMED sorait újrapróbálhatóvá tesszük. */
export async function recoverStaleDeliveryClaims(slug?: string): Promise<number> {
  const cutoff = new Date(Date.now() - DELIVERY_CLAIM_STALE_MS);
  const result = await prisma.newsletterDelivery.updateMany({
    where: {
      status: "CLAIMED",
      claimedAt: { lt: cutoff },
      ...(slug ? { slug } : {}),
    },
    data: {
      status: "FAILED",
      failedAt: new Date(),
      lastError: "stale_claim_recovered",
    },
  });
  return result.count;
}

/**
 * A KÜLDÉSI KAPU: csak `ACTIVE`, csak a kért topicra feliratkozott, csak a
 * kért nyelven, és csak az, aki az adott slugot még nem kapta meg.
 *
 * Ne kerüld meg saját lekérdezéssel — ez az egyetlen hely, ahol a négy
 * feltétel együtt teljesül.
 */
export async function listSendableSubscribers(params: {
  topic: NewsletterTopic;
  locale: Locale;
  /** Ha megadod, a naplóban már szereplő címzettek kimaradnak (idempotencia). */
  excludeSlug?: string;
  /**
   * Csak az ez előtt megerősített feliratkozók. EZ ELŐZI MEG, hogy a ma
   * feliratkozó visszamenőleg megkapja a tegnapi cikket: a hívó a cikk
   * megjelenésének végét adja át.
   */
  confirmedBefore?: Date;
  limit?: number;
}): Promise<SendableSubscriber[]> {
  if (params.excludeSlug) await recoverStaleDeliveryClaims(params.excludeSlug);

  const rows = await prisma.newsletterSubscriber.findMany({
    where: {
      status: "ACTIVE",
      locale: params.locale,
      topics: { has: params.topic },
      ...(params.excludeSlug
        ? {
            deliveries: {
              none: {
                slug: params.excludeSlug,
                OR: [
                  { status: { not: "FAILED" } },
                  { attemptCount: { gte: DELIVERY_MAX_ATTEMPTS } },
                ],
              },
            },
          }
        : {}),
      ...(params.confirmedBefore ? { confirmedAt: { lte: params.confirmedBefore } } : {}),
    },
    select: { id: true, email: true, locale: true, unsubToken: true },
    orderBy: { createdAt: "asc" },
    ...(params.limit ? { take: params.limit } : {}),
  });

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    locale: normalizeLocale(r.locale),
    unsubToken: r.unsubToken,
  }));
}

/**
 * Kiküldés FOGLALÁSA — a levél elküldése ELŐTT.
 *
 * MIÉRT ELŐBB, ÉS NEM UTÁNA (2026-08-21): a levélbe kattintás-követő link
 * kerül, ami a `NewsletterDelivery` id-jét hordozza. Az id tehát a küldés
 * pillanatában már kell. A foglalás atomi SQL statement: a `RETURNING` csak
 * e futás nyertes insertjeit/engedélyezett retry-jait adja vissza. A hiba
 * nem sor-törlés, hanem explicit FAILED vagy UNKNOWN állapot; így a retry és
 * a kézi ellenőrzés is auditálható marad.
 */
export interface DeliveryReservation {
  id: string;
  /** Definitív hiba utáni új claim sorszáma; az idempotenciakulcs része. */
  attemptCount: number;
}

export async function reserveDeliveries(
  slug: string,
  subscriberIds: string[],
): Promise<Map<string, DeliveryReservation>> {
  if (subscriberIds.length === 0) return new Map();

  const now = new Date();
  const staleBefore = new Date(now.getTime() - DELIVERY_CLAIM_STALE_MS);
  const uniqueIds = Array.from(new Set(subscriberIds));
  const values = uniqueIds.map((subscriberId) =>
    Prisma.sql`(${crypto.randomUUID()}, ${subscriberId}, ${slug}, ${now}, 'CLAIMED', ${now}, 1)`,
  );

  // A RETURNING csak az e statement által beszúrt/újrafoglalt sorokat adja.
  // Párhuzamos worker tehát nem tudja „visszaolvasni” a másik claimjét.
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    subscriberId: string;
    attemptCount: number;
  }>>(Prisma.sql`
    INSERT INTO "NewsletterDelivery"
      ("id", "subscriberId", "slug", "sentAt", "status", "claimedAt", "attemptCount")
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("subscriberId", "slug") DO UPDATE SET
      "status" = 'CLAIMED',
      "sentAt" = ${now},
      "claimedAt" = ${now},
      "acceptedAt" = NULL,
      "deliveredAt" = NULL,
      "failedAt" = NULL,
      "providerEmailId" = NULL,
      "clickedAt" = NULL,
      "lastError" = NULL,
      "attemptCount" = "NewsletterDelivery"."attemptCount" + 1
    WHERE
      ("NewsletterDelivery"."status" = 'FAILED'
        AND "NewsletterDelivery"."attemptCount" < ${DELIVERY_MAX_ATTEMPTS})
      OR
      ("NewsletterDelivery"."status" = 'CLAIMED'
        AND "NewsletterDelivery"."claimedAt" < ${staleBefore})
    RETURNING "id", "subscriberId", "attemptCount"
  `);

  return new Map(rows.map((r) => [
    r.subscriberId,
    { id: r.id, attemptCount: r.attemptCount },
  ]));
}

/** A szolgáltató átvette a kérést; ez még nem kézbesítés. */
export async function markDeliveryAccepted(
  deliveryId: string,
  subscriberId: string,
  providerEmailId: string,
): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.newsletterDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "ACCEPTED",
        providerEmailId,
        acceptedAt: now,
        failedAt: null,
        lastError: null,
      },
    }),
    prisma.newsletterSubscriber.update({
      where: { id: subscriberId },
      data: { lastSentAt: now },
    }),
  ]);
}

/** Sikertelen vagy bizonytalan eredmény könyvelése, törlés nélkül. */
export async function markDeliveryFailure(
  deliveryId: string,
  failure: { uncertain: boolean; code: string; message: string },
): Promise<void> {
  await prisma.newsletterDelivery.update({
    where: { id: deliveryId },
    data: {
      status: failure.uncertain ? "UNKNOWN" : "FAILED",
      failedAt: new Date(),
      lastError: `${failure.code}: ${failure.message}`.slice(0, 2000),
    },
  });
}

/**
 * Kattintás rögzítése — CSAK az elsőé.
 *
 * A `clickedAt` nem számláló: az első linkkérést rögzíti. Ez hasznos, de nem
 * biztos emberi olvasás: linkscanner és továbbított levél is kiválthatja. Az `updateMany` a `null`
 * feltétellel egyben a versenyhelyzetet is kezeli (két gyors kattintás).
 *
 * Visszaadja a cikk slugját, ha a foglalás létezik — a hívó ebből építi a
 * cél-URL-t, tehát a paraméterből SOHA nem lesz nyílt átirányítás.
 */
export async function registerClick(deliveryId: string): Promise<boolean> {
  const row = await prisma.newsletterDelivery.findUnique({
    where: { id: deliveryId },
    select: { id: true, clickedAt: true },
  });
  if (!row) return false;

  if (!row.clickedAt) {
    await prisma.newsletterDelivery.updateMany({
      where: { id: deliveryId, clickedAt: null },
      data: { clickedAt: new Date() },
    });
  }
  return true;
}

/**
 * Kézbesíthetetlen cím kivezetése a küldésből.
 *
 * A hívója a Resend bounce-webhookja (`/api/webhooks/resend`) — NEM a küldő
 * kód hibaága: egyetlen átmeneti API-hiba nem elég ok rá, mert a `BOUNCED`
 * állapotból nincs visszaút a felületről (a feliratkozó űrlap csendben
 * elnyeli az ilyen címet).
 */
export async function markBounced(subscriberId: string): Promise<void> {
  await prisma.newsletterSubscriber.update({
    where: { id: subscriberId },
    data: {
      status: "BOUNCED",
      confirmToken: generateToken(),
      tokenExpiresAt: new Date(),
    },
  });
}

/**
 * Kézbesítési visszajelzés feldolgozása cím alapján (webhook).
 *
 * A két eset szándékosan KÜLÖNBÖZŐ állapotba visz:
 *   · `bounce`    → BOUNCED — a cím nem létezik; technikai tény.
 *   · `complaint` → UNSUBSCRIBED — a címzett spamnek jelölte; ez SZÁNDÉK.
 *     Ilyenkor a leiratkozás a helyes válasz, nem a „hibás cím" könyvelése.
 */
export async function applyDeliveryFeedback(
  email: string,
  kind: "bounce" | "complaint",
): Promise<boolean> {
  const row = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true, status: true },
  });
  if (!row) return false;

  if (kind === "complaint") {
    if (row.status !== "UNSUBSCRIBED") {
      await prisma.newsletterSubscriber.update({
        where: { id: row.id },
        data: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: new Date(),
          confirmToken: generateToken(),
          tokenExpiresAt: new Date(),
        },
      });
    }
    log.info({ event: "newsletter.complaint", subscriberId: row.id }, "Spam complaint — unsubscribed");
    return true;
  }

  if (row.status !== "BOUNCED") await markBounced(row.id);
  log.info({ event: "newsletter.bounce", subscriberId: row.id }, "Hard bounce — suppressed");
  return true;
}

export type ProviderDeliveryEvent =
  | "delivered"
  | "failed"
  | "suppressed"
  | "bounce"
  | "complaint";

export type DeliveryStatus =
  | "CLAIMED"
  | "ACCEPTED"
  | "DELIVERED"
  | "FAILED"
  | "UNKNOWN"
  | "SUPPRESSED"
  | "BOUNCED"
  | "COMPLAINED";

const DELIVERY_STATUS_PRIORITY: Record<DeliveryStatus, number> = {
  CLAIMED: 0,
  ACCEPTED: 1,
  UNKNOWN: 2,
  FAILED: 3,
  DELIVERED: 4,
  SUPPRESSED: 5,
  BOUNCED: 6,
  COMPLAINED: 7,
};

/**
 * Webhookok ismételhetők és sorrenden kívül is érkezhetnek. Erősebb, végleges
 * tényt ezért egy későn beérkező gyengébb esemény nem írhat felül.
 */
export function providerDeliveryTransition(
  current: DeliveryStatus,
  event: ProviderDeliveryEvent,
): DeliveryStatus {
  const candidate: DeliveryStatus = {
    delivered: "DELIVERED",
    failed: "FAILED",
    suppressed: "SUPPRESSED",
    bounce: "BOUNCED",
    complaint: "COMPLAINED",
  }[event] as DeliveryStatus;
  return DELIVERY_STATUS_PRIORITY[candidate] >= DELIVERY_STATUS_PRIORITY[current]
    ? candidate
    : current;
}

/**
 * Resend-esemény könyvelése provider email id alapján. A cím-alapú
 * feliratkozó-szuppresszió külön megmarad, mert tranzakcionális levélhez nem
 * feltétlenül tartozik NewsletterDelivery.
 */
export async function applyProviderDeliveryEvent(params: {
  providerEmailId?: string | null;
  email?: string | null;
  kind: ProviderDeliveryEvent;
  detail?: string | null;
}): Promise<{ deliveryApplied: boolean; subscriberApplied: boolean }> {
  let deliveryApplied = false;

  if (params.providerEmailId) {
    const delivery = await prisma.newsletterDelivery.findUnique({
      where: { providerEmailId: params.providerEmailId },
      select: { id: true, slug: true },
    });
    if (delivery) {
      const now = new Date();
      const nextStatus = providerDeliveryTransition("CLAIMED", params.kind);
      const weakerStatuses = (Object.keys(DELIVERY_STATUS_PRIORITY) as DeliveryStatus[])
        .filter((status) => DELIVERY_STATUS_PRIORITY[status] < DELIVERY_STATUS_PRIORITY[nextStatus]);
      const defaultDetails: Partial<Record<DeliveryStatus, string>> = {
        FAILED: "provider_failed",
        SUPPRESSED: "provider_suppressed",
        BOUNCED: "hard_bounce",
        COMPLAINED: "spam_complaint",
      };
      const detail = (
        params.detail ?? defaultDetails[nextStatus] ?? nextStatus.toLowerCase()
      ).slice(0, 2000);
      const data = nextStatus === "DELIVERED"
        ? { status: nextStatus, deliveredAt: now, failedAt: null, lastError: null }
        : { status: nextStatus, failedAt: now, lastError: detail };

      // Az olvasás és az írás között egy másik webhook befuthat. A
      // státuszfeltételes update teszi a prioritást DB-szinten is atomikussá:
      // egy későn beérkező gyengébb esemény nem írhat felül erősebbet.
      const updated = await prisma.newsletterDelivery.updateMany({
        where: { id: delivery.id, status: { in: weakerStatuses } },
        data,
      });
      deliveryApplied = true;

      // A szinkron API-átvétel után is érkezhet email.failed. Egy lezárt
      // szerkesztett számot ilyenkor PARTIAL-ra nyitunk vissza, hogy csak a
      // kimaradt címzett legyen újrapróbálható ugyanazzal a tartalommal.
      if (nextStatus === "FAILED" && updated.count === 1 && delivery.slug.startsWith("issue:")) {
        const failures = await prisma.newsletterDelivery.count({
          where: {
            slug: delivery.slug,
            status: { in: ["FAILED", "UNKNOWN"] },
          },
        });
        await prisma.newsletterIssue.updateMany({
          where: {
            id: delivery.slug.slice("issue:".length),
            status: { in: ["SENT", "PARTIAL", "FAILED"] },
          },
          data: { status: "PARTIAL", failures, sentAt: null },
        });
      }
    }
  }

  let subscriberApplied = false;
  if (params.email && ["bounce", "complaint", "suppressed"].includes(params.kind)) {
    subscriberApplied = await applyDeliveryFeedback(
      params.email,
      params.kind === "complaint" ? "complaint" : "bounce",
    );
  }

  return { deliveryApplied, subscriberApplied };
}

export interface NewsletterStats {
  active: number;
  pending: number;
  unsubscribed: number;
  bounced: number;
  lastSentAt: Date | null;
  /** Resend API által átvett kérés, illetve mail-szerver által visszaigazolt kézbesítés. */
  accepted: number;
  delivered: number;
  failed: number;
  unknown: number;
  /** Első linkkérések; bot/scanner is kiválthatja. */
  clicked: number;
}

/**
 * Admin-számok. Üzleti szám mindig DB-ből — az analitikai esemény csak
 * mintázatra való (ld. CLAUDE.md analitika-szabály).
 */
export async function getNewsletterStats(): Promise<NewsletterStats> {
  const [grouped, last, accepted, delivered, failed, unknown, clicked] = await Promise.all([
    prisma.newsletterSubscriber.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.newsletterSubscriber.aggregate({ _max: { lastSentAt: true } }),
    prisma.newsletterDelivery.count({ where: { acceptedAt: { not: null } } }),
    prisma.newsletterDelivery.count({ where: { deliveredAt: { not: null } } }),
    prisma.newsletterDelivery.count({ where: { status: "FAILED" } }),
    prisma.newsletterDelivery.count({ where: { status: "UNKNOWN" } }),
    prisma.newsletterDelivery.count({ where: { clickedAt: { not: null } } }),
  ]);

  const byStatus = new Map(grouped.map((g) => [g.status, g._count._all]));
  return {
    active: byStatus.get("ACTIVE") ?? 0,
    pending: byStatus.get("PENDING") ?? 0,
    unsubscribed: byStatus.get("UNSUBSCRIBED") ?? 0,
    bounced: byStatus.get("BOUNCED") ?? 0,
    lastSentAt: last._max.lastSentAt ?? null,
    accepted,
    delivered,
    failed,
    unknown,
    clicked,
  };
}

export interface SlugEngagement {
  slug: string;
  accepted: number;
  delivered: number;
  clicked: number;
}

/**
 * Küldési egységenkénti kattintási arány (cikk-slug vagy `issue:<id>`).
 *
 * EZ az egyetlen visszacsatolás arról, hogy melyik cím és melyik téma
 * működik — a feliratkozó-szám csak azt mondja, hányan mondtak igent egyszer.
 */
export async function getDeliveryEngagement(limit = 20): Promise<SlugEngagement[]> {
  const grouped = await prisma.newsletterDelivery.groupBy({
    by: ["slug"],
    _count: { _all: true },
    _max: { sentAt: true },
    orderBy: { _max: { sentAt: "desc" } },
    take: limit,
  });

  const slugs = grouped.map((g) => g.slug);
  const [accepted, delivered, clicks] = await Promise.all([
    prisma.newsletterDelivery.groupBy({
      by: ["slug"],
      where: { slug: { in: slugs }, acceptedAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.newsletterDelivery.groupBy({
      by: ["slug"],
      where: { slug: { in: slugs }, deliveredAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.newsletterDelivery.groupBy({
      by: ["slug"],
      where: { slug: { in: slugs }, clickedAt: { not: null } },
      _count: { _all: true },
    }),
  ]);
  const acceptedBySlug = new Map(accepted.map((c) => [c.slug, c._count._all]));
  const deliveredBySlug = new Map(delivered.map((c) => [c.slug, c._count._all]));
  const clickBySlug = new Map(clicks.map((c) => [c.slug, c._count._all]));

  return grouped.map((g) => ({
    slug: g.slug,
    accepted: acceptedBySlug.get(g.slug) ?? 0,
    delivered: deliveredBySlug.get(g.slug) ?? 0,
    clicked: clickBySlug.get(g.slug) ?? 0,
  }));
}
