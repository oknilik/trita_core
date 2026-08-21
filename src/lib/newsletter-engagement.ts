import "server-only";

import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/newsletter";

/**
 * FELIRATKOZÓ → LEAD összekötés.
 *
 * A hírlevél-lista magában zsákutca: gyűlnek a címek, de az értékesítési
 * folyamat nem tud róluk. Ez a réteg köti össze a kettőt — a `Inquiry`
 * email-alapú auto-linkjének mintájára, ugyanazon a kulcson (normalizált
 * e-mail-cím).
 *
 * MIT AD A TANÁCSADÓI BESZÉLGETÉSNEK: jelzi, hogy a megkereső régóta a
 * listán van-e, és érkezett-e kérés levélbeli linkre. Nem bizonyít olvasást:
 * scanner és továbbított levél is kiválthatja, ezért csak kontextus.
 *
 * ADATVÉDELEM: kizárólag ADMIN felületen hívjuk. Nem hoz létre új adatot,
 * csak összeolvassa azt, ami már megvan.
 */

export interface NewsletterEngagement {
  status: "PENDING" | "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED";
  /** A megerősítés ideje — a hozzájárulás bizonyítéka; `null`, ha még nincs. */
  confirmedAt: Date | null;
  /** Honnan iratkozott fel (blog_post, footer, try_complete…). */
  source: string;
  /** Szolgáltató által átvett / mail-szerver által kézbesített levelek. */
  accepted: number;
  delivered: number;
  /** Első linkkérések; scanner vagy továbbított levél is kiválthatja. */
  linkRequests: number;
  lastSentAt: Date | null;
}

/**
 * Több címre egyszerre — a lista-nézetek (Beérkező, pipeline) N+1 nélkül.
 * A kulcs a NORMALIZÁLT cím, a hívó is így keressen benne.
 */
export async function getEngagementByEmail(
  emails: string[],
): Promise<Map<string, NewsletterEngagement>> {
  const normalized = Array.from(new Set(emails.map(normalizeEmail).filter(Boolean)));
  if (normalized.length === 0) return new Map();

  const rows = await prisma.newsletterSubscriber.findMany({
    where: { email: { in: normalized } },
    select: {
      email: true,
      status: true,
      confirmedAt: true,
      source: true,
      lastSentAt: true,
      deliveries: { select: { acceptedAt: true, deliveredAt: true, clickedAt: true } },
    },
  });

  return new Map(
    rows.map((row) => [
      row.email,
      {
        status: row.status as NewsletterEngagement["status"],
        confirmedAt: row.confirmedAt,
        source: row.source,
        accepted: row.deliveries.filter((delivery) => delivery.acceptedAt !== null).length,
        delivered: row.deliveries.filter((delivery) => delivery.deliveredAt !== null).length,
        linkRequests: row.deliveries.filter((delivery) => delivery.clickedAt !== null).length,
        lastSentAt: row.lastSentAt,
      },
    ]),
  );
}

/** Szerializált alak a kliens-komponenseknek (Date → ISO string). */
export interface NewsletterEngagementDto {
  status: NewsletterEngagement["status"];
  confirmedAt: string | null;
  source: string;
  accepted: number;
  delivered: number;
  linkRequests: number;
}

export function toEngagementDto(
  engagement: NewsletterEngagement | undefined,
): NewsletterEngagementDto | null {
  if (!engagement) return null;
  return {
    status: engagement.status,
    confirmedAt: engagement.confirmedAt?.toISOString() ?? null,
    source: engagement.source,
    accepted: engagement.accepted,
    delivered: engagement.delivered,
    linkRequests: engagement.linkRequests,
  };
}
