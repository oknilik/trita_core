import type { Metadata } from "next";
import { NewsletterActionCard } from "../NewsletterActionCard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  return <NewsletterActionCard action="unsubscribe" token={token} />;
}
