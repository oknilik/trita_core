import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { EmailPreferencesClient } from "./EmailPreferencesClient";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";

// Életciklus-email beállítások — a reflexiós (és jövőbeni hasonló) emailek
// leiratkozó-linkje ide hoz. Auth-oldal: a címzett a termék belépett usere.

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Email-beállítások | trita" : "Email preferences | trita",
    robots: { index: false },
  };
}

export default async function EmailPreferencesPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) return redirectToSignIn();

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { lifecycleEmailsOptOut: true },
  });
  if (!profile) return redirectToSignIn();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-sand bg-surface-card p-8 md:p-10">
        <SectionEyebrow tone="muted">
          {t("results.emailPrefsEyebrow", locale)}
        </SectionEyebrow>
        <h1 className="mt-2 font-fraunces text-[26px] leading-tight tracking-tight text-ink">
          {t("results.emailPrefsTitle", locale)}
        </h1>
        <p className="mt-3 text-caption leading-relaxed text-ink-body">
          {t("results.emailPrefsBody", locale)}
        </p>
        <div className="mt-6">
          <EmailPreferencesClient initialOptOut={profile.lifecycleEmailsOptOut} />
        </div>
      </div>
    </main>
  );
}
