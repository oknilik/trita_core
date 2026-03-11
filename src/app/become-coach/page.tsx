import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import { getLanguageAlternates } from "@/lib/seo";
import { BecomeCoachForm } from "./BecomeCoachForm";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const title = `${t("becomeCoach.title", locale)} | Trita`;
  const description = t("becomeCoach.subtitle", locale);
  return {
    title,
    description,
    alternates: {
      canonical: "/become-coach",
      languages: getLanguageAlternates("/become-coach"),
    },
    openGraph: { title, description, url: "/become-coach", type: "website", siteName: "Trita" },
    robots: { index: true, follow: true },
  };
}

const features = [
  { titleKey: "becomeCoach.feature1Title", bodyKey: "becomeCoach.feature1Body", icon: PeopleIcon },
  { titleKey: "becomeCoach.feature2Title", bodyKey: "becomeCoach.feature2Body", icon: SparkIcon },
  { titleKey: "becomeCoach.feature3Title", bodyKey: "becomeCoach.feature3Body", icon: MirrorIcon },
] as const;

export default async function BecomeCoachPage() {
  const locale = await getServerLocale();
  const { userId } = await auth();
  let prefillEmail: string | undefined;
  if (userId) {
    const user = await currentUser();
    prefillEmail = user?.primaryEmailAddress?.emailAddress ?? undefined;
  }

  const splitItems = (key: string) =>
    t(key, locale).split("|").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="relative min-h-dvh bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/3 bg-gradient-to-b from-transparent to-white" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-3xl">

        {/* Hero */}
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            {t("becomeCoach.tag", locale)}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            {t("becomeCoach.title", locale)}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-gray-500">
            {t("becomeCoach.subtitle", locale)}
          </p>
        </div>

        {/* Features */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            {t("becomeCoach.featuresTitle", locale)}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.map(({ titleKey, bodyKey, icon: Icon }) => (
              <div key={titleKey} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                  <Icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">
                  {t(titleKey, locale)}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500">
                  {t(bodyKey, locale)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Who it's for */}
        <div className="mb-8 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-white p-6 md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {t("becomeCoach.forTitle", locale)}
          </h2>
          <ul className="space-y-2">
            {splitItems("becomeCoach.forItems").map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                <svg viewBox="0 0 16 16" className="h-4 w-4 flex-shrink-0 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8l3 3 7-7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Application form */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            {t("becomeCoach.formTitle", locale)}
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            {t("becomeCoach.formSubtitle", locale)}
          </p>
          <BecomeCoachForm prefillEmail={prefillEmail} />
        </div>

      </div>
    </div>
  );
}

// ─── Inline SVG icons ────────────────────────────────────────────────────────

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 17c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  );
}

function MirrorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="3" />
      <path d="M4 17c0-2 1.3-3.5 3-3.5" />
      <circle cx="13" cy="7" r="3" />
      <path d="M10 17c0-2 1.3-3.5 3-3.5" />
      <path d="M10 2v16" strokeDasharray="2 2" />
    </svg>
  );
}
