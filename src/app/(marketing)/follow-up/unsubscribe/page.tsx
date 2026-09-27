import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { FollowupUnsubscribe } from "@/components/lifecycle/FollowupActions";

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function FollowupUnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const locale = await getServerLocale();
  return <main className="mx-auto min-h-[60vh] max-w-xl px-5 py-16">
    <h1 className="font-fraunces text-title text-ink">{t("lifecycle.preferences.unsubscribeTitle", locale)}</h1>
    <p className="mt-4 text-ink-body">{t("lifecycle.preferences.unsubscribeBody", locale)}</p>
    <FollowupUnsubscribe token={token.slice(0, 100)} locale={locale} />
  </main>;
}
