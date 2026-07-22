import { requireAdmin } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FadeIn } from "@/components/landing/FadeIn";
import { AdminTabNav } from "@/app/admin/_components/AdminTabNav";
import { OverviewTab } from "@/app/admin/_tabs/OverviewTab";
import { InquiriesTab } from "@/app/admin/_tabs/InquiriesTab";
import { OrgsTab } from "@/app/admin/_tabs/OrgsTab";
import { ConsultantsTab } from "@/app/admin/_tabs/ConsultantsTab";
import { OpsTab } from "@/app/admin/_tabs/OpsTab";
import { FeedbackTab } from "@/app/admin/_tabs/FeedbackTab";
import { RemindersTab } from "@/app/admin/_tabs/RemindersTab";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("meta.adminTitle", locale),
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

// Admin oldal — vékony elosztó: fejléc + fülnavigáció + aktív fül.
// A fülök tartalma és lekérdezései a _tabs/ könyvtárban élnek.
const TAB_IDS = ["overview", "inquiries", "orgs", "consultants", "ops", "feedback", "reminders"] as const;
type TabId = (typeof TAB_IDS)[number];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const locale = await getServerLocale();
  const { tab } = await searchParams;
  const activeTab: TabId = (TAB_IDS as readonly string[]).includes(tab ?? "")
    ? (tab as TabId)
    : "overview";

  return (
    <main className="min-h-dvh bg-cream px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <p className="font-mono text-xs uppercase tracking-widest text-bronze">{"// admin"}</p>
          <h1 className="mt-1 font-fraunces text-3xl text-ink md:text-4xl">
            {t("admin.title", locale)}
          </h1>
          <p className="mt-2 text-sm text-ink-body">{t("admin.subtitle", locale)}</p>
        </FadeIn>

        <FadeIn delay={0.05}>
          <Suspense>
            <AdminTabNav />
          </Suspense>
        </FadeIn>

        <FadeIn delay={0.1}>
          {activeTab === "overview" && <OverviewTab locale={locale} />}
          {activeTab === "inquiries" && <InquiriesTab />}
          {activeTab === "orgs" && <OrgsTab />}
          {activeTab === "consultants" && <ConsultantsTab />}
          {activeTab === "ops" && <OpsTab />}
          {activeTab === "feedback" && <FeedbackTab />}
          {activeTab === "reminders" && <RemindersTab />}
        </FadeIn>
      </div>
    </main>
  );
}
