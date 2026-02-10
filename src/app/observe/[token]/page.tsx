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
  return { title: t("meta.observeTitle", locale) };
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
        select: { name: true },
      },
    },
  });

  if (!invitation) {
    notFound();
  }

  if (invitation.status === "COMPLETED") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("observer.completeTitle", locale)}
        </h1>
        <p className="text-sm text-gray-600">
          {t("observer.completeBody", locale)}
        </p>
      </main>
    );
  }

  if (invitation.status === "CANCELED") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("observer.inactiveTitle", locale)}
        </h1>
        <p className="text-sm text-gray-600">
          {t("observer.inactiveBody", locale)}
        </p>
      </main>
    );
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("observer.expiredTitle", locale)}
        </h1>
        <p className="text-sm text-gray-600">
          {t("observer.expiredBody", locale)}
        </p>
      </main>
    );
  }

  const config = getTestConfig(invitation.testType as TestType, locale);
  const inviterName = invitation.inviter.name ?? t("common.someone", locale);

  return (
    <ObserverClient
      token={token}
      inviterName={inviterName}
      testName={config.name}
      format={config.format}
      questions={config.questions}
    />
  );
}
