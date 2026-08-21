import "server-only";

import { getAllPosts } from "@/lib/blog";
import { createLogger } from "@/lib/logger";
import { sendNewBlogPostEmail } from "@/lib/emails";
import { APP_URL } from "@/lib/email-layout";
import {
  clickUrl,
  listSendableSubscribers,
  markSent,
  releaseDelivery,
  reserveDeliveries,
  unsubscribeUrl,
  type SendableSubscriber,
} from "@/lib/newsletter";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/core";

const log = createLogger("newsletter-digest");

/**
 * ÚJ-CIKK ÉRTESÍTŐ — a kiküldés motorja.
 *
 * MIÉRT CRON, ÉS NEM A PUBLIKÁLÁS-GOMB:
 * a blog forrásigazsága a git (`content/blog/*.mdx`), nincs „publikálva"
 * DB-esemény. Az admin Blog fül github módban COMMITOL, amit a Vercel csak
 * percekkel később élesít — a gombra kötött azonnali küldés tehát olyan
 * linket vinne ki, ami a kattintás pillanatában még 404. A cron ezt a
 * versenyt szerkezetileg zárja ki: amit lát, az már deployolva van.
 *
 * IDEMPOTENCIA: a `NewsletterDelivery` napló + a `(subscriberId, slug)`
 * unique. Kétszer futó cron, kézi „küldés most" és félbeszakadt futás után
 * sem megy ki ugyanaz a cikk kétszer ugyanannak a címzettnek.
 */

/**
 * Ennél régebbi cikkre nem küldünk értesítőt.
 *
 * KÉT DOLGOT VÉD EGYSZERRE: (1) az induláskor meglévő ~10 cikkes archívum
 * nem zúdul rá senkire, (2) egy hosszabb cron-kiesés után sem megy ki
 * visszamenőleg fél év termése egyetlen reggelen.
 */
export const DIGEST_LOOKBACK_DAYS = 14;

/**
 * Resend-köteg mérete. A batch-végpont 100-at enged; 50-nel megyünk, mert a
 * levelek `cid:` csatolmányokat visznek, és a kisebb köteg hibánál kevesebbet
 * kockáztat.
 */
const BATCH_SIZE = 50;

export interface DigestResult {
  /** Slugonként hány címzettnek ment ki. */
  sent: Array<{ slug: string; locale: Locale; recipients: number }>;
  /** Hány cím esett ki kézbesítési hiba miatt. */
  failed: number;
  /** Hány cikk volt egyáltalán szóba jöhető (lookback-ablakon belül). */
  candidates: number;
}

interface DigestOptions {
  /** Csak ezt a slugot küldi (admin „küldés most"), a lookback-ablak nélkül. */
  onlySlug?: string;
  /** Próbafutás: nem küld és nem naplóz, csak megmondja, mi menne ki. */
  dryRun?: boolean;
  /** Tesztelhetőség: az „aktuális idő" befecskendezhető. */
  now?: Date;
}

/** A cikk megjelenési napjának VÉGE — eddig megerősített feliratkozók kapják meg. */
function endOfPublishDay(publishedAt: string): Date {
  const d = new Date(`${publishedAt}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

export async function runBlogDigest(options: DigestOptions = {}): Promise<DigestResult> {
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - DIGEST_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const result: DigestResult = { sent: [], failed: 0, candidates: 0 };

  for (const locale of SUPPORTED_LOCALES) {
    // Piszkozat SOHA nem kerül ki: a `getAllPosts` alapból kihagyja őket.
    const posts = getAllPosts(locale).filter((post) => {
      if (options.onlySlug) return post.slug === options.onlySlug;
      const published = new Date(`${post.publishedAt}T00:00:00.000Z`);
      return published >= cutoff && published <= now;
    });

    result.candidates += posts.length;

    for (const post of posts) {
      const recipients = await listSendableSubscribers({
        topic: "blog",
        locale,
        excludeSlug: post.slug,
        // Az „onlySlug" (kézi újraküldés) ágon is érvényes: aki a cikk
        // megjelenése UTÁN iratkozott fel, nem kap visszamenőleges levelet.
        confirmedBefore: endOfPublishDay(post.publishedAt),
      });

      if (recipients.length === 0) continue;

      if (options.dryRun) {
        result.sent.push({ slug: post.slug, locale, recipients: recipients.length });
        continue;
      }

      let deliveredCount = 0;

      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);

        // FOGLALÁS a küldés ELŐTT: a levélbe kerülő kattintás-követő link a
        // delivery id-jét hordozza, tehát az id-nek már léteznie kell. Aki
        // nem kap foglalást, azt egy korábbi futás már elvitte — kimarad.
        const reserved = await reserveDeliveries(post.slug, batch.map((r) => r.id));
        const sendable = batch.filter((r) => reserved.has(r.id));
        if (sendable.length === 0) continue;

        const outcomes = await Promise.all(
          sendable.map((subscriber) =>
            sendOne(subscriber, post, locale, reserved.get(subscriber.id)!),
          ),
        );

        const succeeded: string[] = [];
        for (const [index, ok] of outcomes.entries()) {
          const subscriber = sendable[index]!;
          if (ok) {
            succeeded.push(subscriber.id);
            continue;
          }
          // A küldés elhasalt → a foglalást eldobjuk, hogy a következő futás
          // újrapróbálja. (Ez az egyetlen hely, ahol napló-sor törlődik.)
          result.failed += 1;
          await releaseDelivery(reserved.get(subscriber.id)!);
        }

        await markSent(succeeded);
        deliveredCount += succeeded.length;
      }

      if (deliveredCount === 0) continue;

      result.sent.push({ slug: post.slug, locale, recipients: deliveredCount });
      log.info(
        { event: "newsletter.digest_sent", slug: post.slug, locale, recipients: deliveredCount },
        "Blog digest sent",
      );
    }
  }

  return result;
}

async function sendOne(
  subscriber: SendableSubscriber,
  post: ReturnType<typeof getAllPosts>[number],
  locale: Locale,
  deliveryId: string,
): Promise<boolean> {
  const ok = await sendNewBlogPostEmail({
    to: subscriber.email,
    postTitle: post.title,
    postDescription: post.description,
    // Kattintás-követő link: a végpont rögzíti az első kattintást, majd
    // továbbdob a cikkre. A cél-URL-t a végpont építi, nem a paraméter.
    postUrl: clickUrl(APP_URL, deliveryId, post.slug),
    readingMinutes: post.readingMinutes,
    unsubUrl: unsubscribeUrl(APP_URL, subscriber.unsubToken),
    locale,
  });

  // Sikertelen küldésnél NEM tesszük a címet BOUNCED-ra: egy Resend
  // API-hiba jellemzően átmeneti. A kézbesíthetetlenség megállapítása a
  // szolgáltató bounce-jelzésének dolga (`/api/webhooks/resend`). Itt a
  // hívó dobja el a foglalást, és a következő futás újrapróbálja.
  return ok;
}
