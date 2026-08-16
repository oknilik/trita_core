import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { Metadata } from "next";
import { FadeIn } from "@/components/landing/FadeIn";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { AdminNav, type AdminTabId } from "@/app/(app)/admin/_components/AdminNav";
import { isAdminRange, isAdminSegment, type AdminRange, type AdminSegment } from "@/app/(app)/admin/_components/AdminRangeFilter";
import { OPEN_DEAL_STAGES } from "@/lib/crm/constants";
import { resolveCrmDueWindow } from "@/lib/crm/guards";
import { OverviewTab } from "@/app/(app)/admin/_tabs/OverviewTab";
import { AnalyticsTab } from "@/app/(app)/admin/_tabs/AnalyticsTab";
import { CrmTab } from "@/app/(app)/admin/_tabs/CrmTab";
import { InquiriesTab } from "@/app/(app)/admin/_tabs/InquiriesTab";
import { OrgsTab } from "@/app/(app)/admin/_tabs/OrgsTab";
import { ConsultantsTab } from "@/app/(app)/admin/_tabs/ConsultantsTab";
import { OpsTab } from "@/app/(app)/admin/_tabs/OpsTab";
import { FeedbackTab } from "@/app/(app)/admin/_tabs/FeedbackTab";
import { RemindersTab } from "@/app/(app)/admin/_tabs/RemindersTab";
import { BlogTab } from "@/app/(app)/admin/_tabs/BlogTab";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";

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

// ─────────────────────────────────────────────────────────────────────
// Admin oldal — modern dashboard-váz (2026-07-28 átrendezés):
//   · desktopon bal oldalsáv (csoportosított navigáció) + tartalom,
//   · mobilon görgethető pill-sor (a régi egyenlő-szélességű fülsor
//     kilógott és eltörte a UI-t).
// A fülök tartalma és lekérdezései változatlanul a _tabs/ könyvtárban.
// ─────────────────────────────────────────────────────────────────────
const TAB_IDS = ["overview", "analytics", "crm", "inquiries", "orgs", "consultants", "blog", "ops", "feedback", "reminders"] as const;

function isAdminTabActive(tab: AdminTabId): boolean {
  if (tab === "crm") return isPortfolioSurfaceActive("crm");
  if (tab === "blog") return isPortfolioSurfaceActive("blog");
  return true;
}

const TAB_TITLES: Record<AdminTabId, string> = {
  overview: "Vezérlő",
  analytics: "Analitika",
  crm: "CRM",
  inquiries: "Kérdések",
  orgs: "Szervezetek",
  consultants: "Tanácsadók",
  blog: "Blog",
  ops: "Rendszer",
  feedback: "Visszajelzések",
  reminders: "Emlékeztetők",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; range?: string; seg?: string; view?: string }>;
}) {
  await requireAdmin();
  const locale = await getServerLocale();
  const { tab, range: rangeParam, seg: segParam, view } = await searchParams;
  const range: AdminRange = isAdminRange(rangeParam) ? rangeParam : "30d";
  const segment: AdminSegment = isAdminSegment(segParam) ? segParam : "all";
  const requestedTab: AdminTabId = (TAB_IDS as readonly string[]).includes(tab ?? "")
    ? (tab as AdminTabId)
    : "overview";
  const activeTab: AdminTabId = isAdminTabActive(requestedTab) ? requestedTab : "overview";

  // Nav-badge-ek (olcsó indexelt countok): új megkeresések + esedékes
  // (lejárt vagy mai) CRM next actionök nyitott dealeken.
  const crmActive = isPortfolioSurfaceActive("crm");
  const { dueBefore } = resolveCrmDueWindow();
  const [newInquiryCount, crmDueCount] = await Promise.all([
    prisma.inquiry.count({ where: { status: "NEW" } }).catch(() => 0),
    crmActive
      ? prisma.deal
          .count({
            where: { stage: { in: [...OPEN_DEAL_STAGES] }, nextActionAt: { lt: dueBefore } },
          })
          .catch(() => 0)
      : Promise.resolve(0),
  ]);

  return (
    <main className="min-h-dvh bg-cream px-4 pt-6 pb-24 md:px-6 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 lg:mb-6">
            <SectionEyebrow>admin</SectionEyebrow>
            <h1 className="font-fraunces text-2xl text-ink md:text-3xl">
              {TAB_TITLES[activeTab]}
            </h1>
            <p className="w-full text-sm text-ink-body lg:w-auto">{t("admin.subtitle", locale)}</p>
          </div>
        </FadeIn>

        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <FadeIn delay={0.05}>
            <AdminNav
              active={activeTab}
              newInquiryCount={newInquiryCount}
              crmDueCount={crmDueCount}
            />
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="min-w-0">
              {activeTab === "overview" && <OverviewTab locale={locale} range={range} segment={segment} />}
              {activeTab === "analytics" && <AnalyticsTab range={range} />}
              {crmActive && activeTab === "crm" && <CrmTab view={view} />}
              {activeTab === "inquiries" && <InquiriesTab />}
              {activeTab === "orgs" && <OrgsTab />}
              {activeTab === "consultants" && <ConsultantsTab />}
              {activeTab === "ops" && <OpsTab />}
              {activeTab === "feedback" && <FeedbackTab />}
              {activeTab === "reminders" && <RemindersTab />}
              {isPortfolioSurfaceActive("blog") && activeTab === "blog" && <BlogTab />}
            </div>
          </FadeIn>
        </div>
      </div>
    </main>
  );
}
