import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { resolveCandidateApplyPageModel } from "@/lib/acceptance/service";
import { CandidateClient } from "./CandidateClient";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("candidate.metaTitle", locale),
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  };
}

interface ApplyPageProps {
  params: Promise<{ token: string }>;
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { token } = await params;
  const locale = await getServerLocale();

  const model = await resolveCandidateApplyPageModel({ token });
  if (model.state === "invalid_token") {
    notFound();
  }
  const invite = model.invite;

  if (model.state === "already_accepted") {
    return (
      <div className="min-h-dvh bg-cream">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
            <div className="text-5xl leading-none">🎉</div>
            <h1 className="mt-4 font-fraunces text-2xl text-ink">
              {t("candidate.pageCompletedTitle", locale)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-body">
              {t("candidate.pageCompletedBody", locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (model.state === "policy_restricted") {
    return (
      <div className="min-h-dvh bg-cream">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-sand bg-white p-8 shadow-sm">
            <div className="text-5xl leading-none">🔒</div>
            <h1 className="mt-4 font-fraunces text-2xl text-ink">
              {t("candidate.pageCanceledTitle", locale)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-body">
              {t("candidate.pageCanceledBody", locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (model.state === "expired_token") {
    return (
      <div className="min-h-dvh bg-cream">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-sand bg-white p-8 shadow-sm">
            <div className="text-5xl leading-none">⏰</div>
            <h1 className="mt-4 font-fraunces text-2xl text-ink">
              {t("candidate.pageExpiredTitle", locale)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-body">
              {t("candidate.pageExpiredBody", locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const testType = invite.testType as TestType;
  const config = getTestConfig(testType, locale);

  return (
    <CandidateClient
      token={token}
      position={invite.position ?? undefined}
      testName={config.name}
      questions={config.questions}
      locale={locale}
    />
  );
}
