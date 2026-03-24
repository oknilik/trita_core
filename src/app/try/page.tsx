import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { AssessmentClient } from "@/app/assessment/AssessmentClient";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("meta.assessmentTitle", locale),
    robots: { index: false },
  };
}

export default async function TryPage() {
  // If already logged in, use the normal assessment flow
  const { userId } = await auth();
  if (userId) redirect("/assessment");

  const locale = await getServerLocale();
  const config = getTestConfig("HEXACO", locale);
  const questions = config.questions.map((q) => ({ id: q.id, text: q.text }));

  return (
    <AssessmentClient
      testType="HEXACO"
      testName={config.name}
      totalQuestions={config.questions.length}
      questions={questions}
      guestMode
    />
  );
}
