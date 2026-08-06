import { notFound } from "next/navigation";
import { DEFAULT_ASSESSMENT_FORM } from "@/lib/operating-mode";
import type { Metadata } from "next";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { resolveCandidateApplyPageModel } from "@/lib/acceptance/service";
import { CandidateClient } from "./CandidateClient";
import { CandidateStateCard } from "./CandidateStateCard";

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
      <CandidateStateCard
        icon="🎉"
        title={t("candidate.pageCompletedTitle", locale)}
        body={t("candidate.pageCompletedBody", locale)}
      />
    );
  }

  if (model.state === "policy_restricted") {
    return (
      <CandidateStateCard
        icon="🔒"
        title={t("candidate.pageCanceledTitle", locale)}
        body={t("candidate.pageCanceledBody", locale)}
      />
    );
  }

  if (model.state === "expired_token") {
    return (
      <CandidateStateCard
        icon="⏰"
        title={t("candidate.pageExpiredTitle", locale)}
        body={t("candidate.pageExpiredBody", locale)}
      />
    );
  }

  const testType = invite.testType as TestType;
  const config = getTestConfig(testType, locale, DEFAULT_ASSESSMENT_FORM);

  return (
    <CandidateClient
      token={token}
      position={invite.position ?? undefined}
      testName={config.name}
      questions={config.questions}
      locale={locale}
      includeTeamRole={invite.includeTeamRole}
    />
  );
}
