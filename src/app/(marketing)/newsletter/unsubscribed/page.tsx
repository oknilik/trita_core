import type { Metadata } from "next";
import { NewsletterStatusCard } from "../NewsletterStatusCard";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// A leiratkozó route handler céloldala. Az „invalid" ág is nyugtató hangú:
// aki ide eljut, jellemzően már leiratkozott — nem hibát követett el.
export default async function NewsletterUnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;

  if (state !== "ok") {
    return (
      <NewsletterStatusCard
        titleKey="newsletter.unsubscribeInvalidTitle"
        bodyKey="newsletter.unsubscribeInvalidBody"
      />
    );
  }

  return (
    <NewsletterStatusCard
      titleKey="newsletter.unsubscribedTitle"
      bodyKey="newsletter.unsubscribedBody"
    />
  );
}
