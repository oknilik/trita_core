import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";
import { getServerLocale } from "@/lib/i18n-server";
import { CandidateClient } from "./CandidateClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Personality Assessment | Trita",
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

  const invite = await prisma.candidateInvite.findUnique({
    where: { token },
    select: {
      id: true,
      testType: true,
      position: true,
      name: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invite) {
    notFound();
  }

  const isHu = locale !== "en" && locale !== "de";

  if (invite.status === "COMPLETED") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
            <div className="text-5xl leading-none">🎉</div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {isHu ? "Már kitöltötted!" : "Already completed!"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {isHu
                ? "Ezt a felmérést már korábban sikeresen beküldted. Köszönjük a részvételt!"
                : "You have already submitted this assessment. Thank you for your participation!"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-amber-100 bg-white p-8 shadow-sm">
            <div className="text-5xl leading-none">⏰</div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {isHu ? "A meghívó lejárt" : "Invitation expired"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {isHu
                ? "Ez a meghívó link sajnos már nem érvényes. Kérj új linket a szervezőtől."
                : "This invitation link is no longer valid. Please request a new link from the organiser."}
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
