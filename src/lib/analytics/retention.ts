/**
 * Adatmegőrzés — az analitikai események élettartama.
 *
 * A 12 hónap tudatos választás: elég egy éves összehasonlításhoz
 * („tavaly ilyenkor"), de nem épít belőle hosszú távú viselkedés-archívumot.
 * Ez az érték szerepel az adatvédelmi tájékoztatóban is — ha itt változik,
 * OTT IS át kell vezetni.
 *
 * Keretmentes modul: a takarító cron, az admin-felület és a teszt is
 * ugyanebből az egy számból dolgozik.
 */
export const ANALYTICS_RETENTION_MONTHS = 12;

/** A megőrzési határ időpontja — ennél régebbi esemény törölhető. */
export function analyticsRetentionCutoff(now: Date = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - ANALYTICS_RETENTION_MONTHS);
  return cutoff;
}
