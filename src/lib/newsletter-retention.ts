import "server-only";

import { prisma } from "@/lib/prisma";

export const NEWSLETTER_RETENTION_MONTHS = 12;

export function newsletterRetentionCutoff(now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - NEWSLETTER_RETENTION_MONTHS);
  return cutoff;
}

/**
 * A tájékoztatóban vállalt megőrzés technikai betartatása.
 *
 * - lejárt, meg nem erősített sor: azonnal törölhető;
 * - leiratkozott/visszapattant cím: 12 hónap után törlődik;
 * - személyhez kötött delivery- és linkkérés-adat: 12 hónap után törlődik.
 */
export async function cleanupNewsletterData(now = new Date()): Promise<{
  expiredPending: number;
  inactiveSubscribers: number;
  oldDeliveries: number;
}> {
  const cutoff = newsletterRetentionCutoff(now);

  const expiredPending = await prisma.newsletterSubscriber.deleteMany({
    where: { status: "PENDING", tokenExpiresAt: { lt: now } },
  });
  const inactiveSubscribers = await prisma.newsletterSubscriber.deleteMany({
    where: {
      OR: [
        { status: "UNSUBSCRIBED", unsubscribedAt: { lt: cutoff } },
        { status: "BOUNCED", updatedAt: { lt: cutoff } },
      ],
    },
  });
  const oldDeliveries = await prisma.newsletterDelivery.deleteMany({
    where: { sentAt: { lt: cutoff } },
  });

  return {
    expiredPending: expiredPending.count,
    inactiveSubscribers: inactiveSubscribers.count,
    oldDeliveries: oldDeliveries.count,
  };
}
