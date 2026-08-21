import type { NewsletterEngagementDto } from "@/lib/newsletter-engagement";

/**
 * „Ez a lead olvas minket" jelzés a CRM- és Beérkező-nézetekben.
 *
 * MIT MOND, ÉS MIT NEM: azt mutatja, mióta van a listán, hány levelet kapott,
 * és hányra kattintott. A kattintás ALSÓ becslés (nyitást nem mérünk), tehát
 * a nulla kattintás nem jelenti, hogy nem olvassa — a nem-nulla viszont
 * biztos jelzés arról, hogy foglalkozik velünk.
 *
 * Miért számít a tanácsadói hívásnál: aki fél éve olvassa a blogot, azzal
 * nem ugyanaz a beszélgetés kezdődik, mint egy hideg érdeklődővel.
 */
export function NewsletterEngagementBadge({
  engagement,
}: {
  engagement: NewsletterEngagementDto | null;
}) {
  if (!engagement) return null;

  // A leiratkozott/visszapattant állapotot is mutatjuk: az is információ, és
  // megelőzi a kínos „nem kaptad meg a hírlevelünket?" kérdést.
  const inactive = engagement.status !== "ACTIVE";
  const since = engagement.confirmedAt
    ? new Date(engagement.confirmedAt).toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "short",
      })
    : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-note ${
        inactive ? "bg-cream text-muted" : "bg-sage/10 text-sage-dark"
      }`}
      title={`Feliratkozás forrása: ${engagement.source}`}
    >
      {inactive
        ? engagement.status === "UNSUBSCRIBED"
          ? "Leiratkozott"
          : engagement.status === "BOUNCED"
            ? "Kézbesíthetetlen"
            : "Megerősítésre vár"
        : `Olvasó${since ? ` ${since} óta` : ""}`}
      {engagement.delivered > 0 ? (
        <span className="opacity-70">
          · {engagement.clicked}/{engagement.delivered} kattintás
        </span>
      ) : null}
    </span>
  );
}
