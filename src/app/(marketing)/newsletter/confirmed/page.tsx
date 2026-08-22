import type { Metadata } from "next";
import { NewsletterStatusCard } from "../NewsletterStatusCard";

// A double opt-in céloldala. `noindex`: tranzakciós visszajelzés, nem
// tartalom — a keresőben semmi keresnivalója.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// A megerősítő route handler (`/api/newsletter/confirm`) 303-mal ide küld, és
// a KIMENETET a `state` paraméter hordozza — token nélkül, mert a céloldal
// URL-je böngésző-előzménybe és referrerbe is bekerül.
export default async function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;

  if (state === "expired") {
    return (
      <NewsletterStatusCard
        titleKey="newsletter.confirmExpiredTitle"
        bodyKey="newsletter.confirmExpiredBody"
        showForm
      />
    );
  }

  if (state !== "ok") {
    return (
      <NewsletterStatusCard
        titleKey="newsletter.confirmInvalidTitle"
        bodyKey="newsletter.confirmInvalidBody"
        showForm
      />
    );
  }

  return (
    <NewsletterStatusCard
      titleKey="newsletter.confirmedTitle"
      bodyKey="newsletter.confirmedBody"
    />
  );
}
