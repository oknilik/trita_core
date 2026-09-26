import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { FollowupUnsubscribe } from "@/components/lifecycle/FollowupActions";

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function FollowupUnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const locale = await getServerLocale();
  const hu = locale === "hu";
  return <main className="mx-auto min-h-[60vh] max-w-xl px-5 py-16">
    <h1 className="font-fraunces text-title text-ink">{hu ? "Utánkövető levelek" : "Follow-up emails"}</h1>
    <p className="mt-4 text-ink-body">{hu ? "Itt lemondhatod a kitöltés folytatásáról, a külső visszajelzés kipróbálásáról és a reflexióról szóló leveleket." : "Unsubscribe from reminders about completing your assessment, trying colleague feedback and reflection."}</p>
    <FollowupUnsubscribe token={token.slice(0, 100)} locale={locale} />
  </main>;
}
