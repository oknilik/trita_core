import "server-only";

import crypto from "crypto";
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
  locale: Locale;
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
  const topics = params.topics?.length ? params.topics : DEFAULT_TOPICS;

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
    select: { id: true, status: true },
  });

  // Visszapattant cím: nem küldünk rá újra. A felület felé ez ugyanaz a
  // „megnéztük a postafiókod" válasz — a lista-higiénia nem a látogató dolga.
  if (existing?.status === "BOUNCED") {
    return { outcome: "suppressed", locale };
  }

  if (existing?.status === "ACTIVE") {
    // Meglévő aktív feliratkozó: a topic-készletet bővítjük (pl. eddig csak
    // blog, most hírlevél is), de új megerősítést nem kérünk — az már megvan.
    await prisma.newsletterSubscriber.update({
      where: { id: existing.id },
      data: { topics: { set: await mergedTopics(existing.id, topics) }, locale },
    });
    return { outcome: "already_active", locale };
  }

  const confirmToken = generateToken();
  const tokenExpiresAt = new Date(Date.now() + CONFIRM_TOKEN_TTL_MS);

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: {
      email,
      locale,
      status: "PENDING",
      topics,
      source: params.source,
      confirmToken,
      tokenExpiresAt,
      unsubToken: generateToken(),
      userProfileId: params.userProfileId ?? null,
    },
    update: {
      // Újra-feliratkozás (PENDING vagy UNSUBSCRIBED sorra): friss token,
      // friss szándék. A leiratkozás időbélyegét töröljük, mert az állapot
      // innentől megint a megerősítésen múlik.
      locale,
      status: "PENDING",
      topics,
      source: params.source,
      confirmToken,
      tokenExpiresAt,
      unsubscribedAt: null,
      ...(params.userProfileId ? { userProfileId: params.userProfileId } : {}),
    },
  });

  return { outcome: "confirmation_sent", confirmToken, locale };
}

/** A meglévő és az új topic-készlet uniója (sorrend-független, duplikátum nélkül). */
async function mergedTopics(id: string, incoming: NewsletterTopic[]): Promise<string[]> {
  const row = await prisma.newsletterSubscriber.findUnique({
    where: { id },
    select: { topics: true },
  });
  return Array.from(new Set([...(row?.topics ?? []), ...incoming]));
}

export interface ConfirmResult {
  ok: boolean;
  /** `invalid` — nincs ilyen token; `expired` — lejárt; `already` — már aktív volt. */
  reason?: "invalid" | "expired";
  locale: Locale;
  unsubToken?: string;
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

  // Már megerősített feliratkozó újra megnyitja a linket (pl. előkeresi a
  // levelet): ez nem hiba, sikerként kezeljük.
  if (row.status === "ACTIVE") {
    return { ok: true, locale, unsubToken: row.unsubToken };
  }

  if (row.tokenExpiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired", locale };
  }

  await prisma.newsletterSubscriber.update({
    where: { id: row.id },
    data: {
      status: "ACTIVE",
      confirmedAt: row.confirmedAt ?? new Date(),
    },
  });

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
      data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
    });
    log.info({ event: "newsletter.unsubscribed", subscriberId: row.id }, "Newsletter unsubscribed");
  }

  return { ok: true, locale: normalizeLocale(row.locale) };
}

/** A leiratkozó link — levélben és a `List-Unsubscribe` fejlécben is ez megy. */
export function unsubscribeUrl(appUrl: string, unsubToken: string): string {
  return `${appUrl.replace(/\/+$/, "")}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
}

/**
 * Kattintás-követő link a levélbeli cikk-hivatkozásokhoz.
 *
 * A `to` a cikk SLUGJA, nem teljes URL — a cél-URL-t a végpont építi fel a
 * publikált cikkek közül. Így a paraméter nem tud nyílt átirányítássá válni.
 */
export function clickUrl(appUrl: string, deliveryId: string, slug: string): string {
  const base = appUrl.replace(/\/+$/, "");
  return `${base}/api/newsletter/click?d=${encodeURIComponent(deliveryId)}&to=${encodeURIComponent(slug)}`;
}

/** A megerősítő link — a double opt-in levél egyetlen gombja. */
export function confirmUrl(appUrl: string, confirmToken: string): string {
  return `${appUrl.replace(/\/+$/, "")}/api/newsletter/confirm?token=${encodeURIComponent(confirmToken)}`;
}

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
export async function setAccountSubscription(params: {
  email: string;
  locale?: string | null;
  userProfileId: string;
  subscribed: boolean;
}): Promise<void> {
  const email = normalizeEmail(params.email);
  const locale = normalizeLocale(params.locale ?? undefined);

  if (!params.subscribed) {
    await prisma.newsletterSubscriber.updateMany({
      where: { email },
      data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
    });
    return;
  }

  const now = new Date();
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: {
      email,
      locale,
      status: "ACTIVE",
      topics: DEFAULT_TOPICS,
      source: "account",
      confirmToken: generateToken(),
      // A token itt már fel van használva — lejárt értékkel hozzuk létre, hogy
      // a mező ne maradjon beváltható. (A `confirmSubscription` az ACTIVE
      // sorra amúgy is sikerrel tér vissza, a lejárat vizsgálata előtt.)
      tokenExpiresAt: now,
      unsubToken: generateToken(),
      confirmedAt: now,
      userProfileId: params.userProfileId,
    },
    update: {
      status: "ACTIVE",
      locale,
      unsubscribedAt: null,
      confirmedAt: now,
      userProfileId: params.userProfileId,
    },
  });
}

/** A fiók címéhez tartozó feliratkozás állapota (a kapcsoló kezdőértéke). */
export async function getAccountSubscriptionState(email: string): Promise<boolean> {
  const row = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalizeEmail(email) },
    select: { status: true },
  });
  return row?.status === "ACTIVE";
}

export interface SendableSubscriber {
  id: string;
  email: string;
  locale: Locale;
  unsubToken: string;
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
  const rows = await prisma.newsletterSubscriber.findMany({
    where: {
      status: "ACTIVE",
      locale: params.locale,
      topics: { has: params.topic },
      ...(params.excludeSlug
        ? { deliveries: { none: { slug: params.excludeSlug } } }
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
 * pillanatában már kell. Cserébe a hibaág fordul meg: ha a küldés elhasal, a
 * foglalást ELDOBJUK (`releaseDelivery`), így a következő futás újrapróbálja.
 *
 * `createMany` + `skipDuplicates`: ha két futás versenyez ugyanazon a
 * címzetten, a második némán nem ír — a `@@unique([subscriberId, slug])` a
 * szerkezeti garancia. A visszaolvasás ezért CSAK azokat adja vissza, akiket
 * ez a futás foglalt le… kivéve, ha egy korábbi futás félbeszakadt: az ilyen
 * sor már létezik, tehát a címzett kimarad — pontosan ezt akarjuk, mert a
 * kettős küldés a rosszabbik hiba.
 */
export async function reserveDeliveries(
  slug: string,
  subscriberIds: string[],
): Promise<Map<string, string>> {
  if (subscriberIds.length === 0) return new Map();

  const before = await prisma.newsletterDelivery.findMany({
    where: { slug, subscriberId: { in: subscriberIds } },
    select: { subscriberId: true },
  });
  const alreadyLogged = new Set(before.map((r) => r.subscriberId));

  await prisma.newsletterDelivery.createMany({
    data: subscriberIds
      .filter((id) => !alreadyLogged.has(id))
      .map((subscriberId) => ({ subscriberId, slug })),
    skipDuplicates: true,
  });

  const rows = await prisma.newsletterDelivery.findMany({
    where: {
      slug,
      subscriberId: { in: subscriberIds.filter((id) => !alreadyLogged.has(id)) },
    },
    select: { id: true, subscriberId: true },
  });

  return new Map(rows.map((r) => [r.subscriberId, r.id]));
}

/** Sikertelen küldés után a foglalás eldobása — hogy a következő futás vigye. */
export async function releaseDelivery(deliveryId: string): Promise<void> {
  await prisma.newsletterDelivery.delete({ where: { id: deliveryId } }).catch(() => {});
}

/** A ténylegesen kiment levelek után a feliratkozó „utoljára kapott" ideje. */
export async function markSent(subscriberIds: string[]): Promise<void> {
  if (subscriberIds.length === 0) return;
  await prisma.newsletterSubscriber.updateMany({
    where: { id: { in: subscriberIds } },
    data: { lastSentAt: new Date() },
  });
}

/**
 * Kattintás rögzítése — CSAK az elsőé.
 *
 * A `clickedAt` nem számláló: azt mérjük, hogy a levél elért-e valakit, nem
 * azt, hányszor nyitotta meg ugyanazt a cikket. Az `updateMany` a `null`
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
    data: { status: "BOUNCED" },
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
        data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
      });
    }
    log.info({ event: "newsletter.complaint", subscriberId: row.id }, "Spam complaint — unsubscribed");
    return true;
  }

  if (row.status !== "BOUNCED") await markBounced(row.id);
  log.info({ event: "newsletter.bounce", subscriberId: row.id }, "Hard bounce — suppressed");
  return true;
}

export interface NewsletterStats {
  active: number;
  pending: number;
  unsubscribed: number;
  bounced: number;
  lastSentAt: Date | null;
  /** Összes kiment levél és az ELSŐ kattintások száma — kattintási arányhoz. */
  delivered: number;
  clicked: number;
}

/**
 * Admin-számok. Üzleti szám mindig DB-ből — az analitikai esemény csak
 * mintázatra való (ld. CLAUDE.md analitika-szabály).
 */
export async function getNewsletterStats(): Promise<NewsletterStats> {
  const [grouped, last, delivered, clicked] = await Promise.all([
    prisma.newsletterSubscriber.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.newsletterSubscriber.aggregate({ _max: { lastSentAt: true } }),
    prisma.newsletterDelivery.count(),
    prisma.newsletterDelivery.count({ where: { clickedAt: { not: null } } }),
  ]);

  const byStatus = new Map(grouped.map((g) => [g.status, g._count._all]));
  return {
    active: byStatus.get("ACTIVE") ?? 0,
    pending: byStatus.get("PENDING") ?? 0,
    unsubscribed: byStatus.get("UNSUBSCRIBED") ?? 0,
    bounced: byStatus.get("BOUNCED") ?? 0,
    lastSentAt: last._max.lastSentAt ?? null,
    delivered,
    clicked,
  };
}

export interface SlugEngagement {
  slug: string;
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

  const clicks = await prisma.newsletterDelivery.groupBy({
    by: ["slug"],
    where: { slug: { in: grouped.map((g) => g.slug) }, clickedAt: { not: null } },
    _count: { _all: true },
  });
  const clickBySlug = new Map(clicks.map((c) => [c.slug, c._count._all]));

  return grouped.map((g) => ({
    slug: g.slug,
    delivered: g._count._all,
    clicked: clickBySlug.get(g.slug) ?? 0,
  }));
}
