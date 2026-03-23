import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { ObserverClient } from "./ObserverClient";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("meta.observeTitle", locale),
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

interface ObservePageProps {
  params: Promise<{ token: string }>;
}

export default async function ObservePage({ params }: ObservePageProps) {
  const { token } = await params;
  const locale = await getServerLocale();

  const invitation = await prisma.observerInvitation.findUnique({
    where: { token },
    include: {
      inviter: {
        select: { username: true },
      },
    },
  });

  if (!invitation) {
    notFound();
  }

  if (invitation.status === "COMPLETED") {
    return (
      <div className="min-h-screen bg-cream">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-[#cfe2d6] bg-white p-8 shadow-sm">
            <div className="text-5xl leading-none">🎉</div>
            <h1 className="mt-4 text-2xl font-bold text-ink">
              {t("observer.completeTitle", locale)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-body">
              {t("observer.completeBody", locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (invitation.status === "CANCELED") {
    return (
      <div className="min-h-screen bg-cream">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-sand bg-white p-8 shadow-sm">
            <div className="text-5xl leading-none">😕</div>
            <h1 className="mt-4 text-2xl font-bold text-ink">
              {t("observer.inactiveTitle", locale)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-body">
              {t("observer.inactiveBody", locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-sage-ring bg-white p-8 shadow-sm">
            <div className="text-5xl leading-none">⏰</div>
            <h1 className="mt-4 text-2xl font-bold text-ink">
              {t("observer.expiredTitle", locale)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-body">
              {t("observer.expiredBody", locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const config = getTestConfig(invitation.testType as TestType, locale);
  const inviterName = invitation.inviter.username ?? t("common.someone", locale);

  const draft = await prisma.observerDraft.findUnique({
    where: { invitationId: invitation.id },
  });

  const initialDraft = draft
    ? {
        phase: draft.phase as "assessment" | "confidence",
        relationshipType: draft.relationshipType,
        knownDuration: draft.knownDuration,
        answers: draft.answers as Record<number, number>,
        currentPage: draft.currentPage,
      }
    : undefined;

  return (
    <ObserverClient
      token={token}
      inviterName={inviterName}
      testName={config.name}
      questions={config.questions}
      initialDraft={initialDraft}
    />
  );
}
