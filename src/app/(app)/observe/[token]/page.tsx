import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { DEFAULT_ASSESSMENT_FORM } from "@/lib/operating-mode";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { resolveObserverTokenLifecycle } from "@/lib/observer/token-validation";
import {
  isValidObserverDraftCookie,
  observerDraftCookieName,
} from "@/lib/observer/draft-cookie";
import { ObserverClient } from "./ObserverClient";
import { buildSignInPath } from "@/lib/navigation/auth-redirects";
import { PageState } from "@/components/ui/primitives/StatePanel";

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

  const lifecycle = resolveObserverTokenLifecycle(invitation);

  if (lifecycle === "completed") {
    return (
      <PageState
        tone="success"
        title={t("observer.completeTitle", locale)}
        body={t("observer.completeBody", locale)}
      />
    );
  }

  if (lifecycle === "canceled") {
    return (
      <PageState
        tone="error"
        title={t("observer.inactiveTitle", locale)}
        body={t("observer.inactiveBody", locale)}
      />
    );
  }

  if (lifecycle === "expired") {
    return (
      <PageState
        tone="error"
        title={t("observer.expiredTitle", locale)}
        body={t("observer.expiredBody", locale)}
      />
    );
  }

  // Jóváhagyásra váró (külső) meghívó: a rater még NEM tölthet ki — a beküldés
  // 403 INVITE_NOT_APPROVED-dal el is utasítaná. Külön állapot-lap, nem az űrlap.
  if (lifecycle === "awaiting_approval") {
    return (
      <PageState
        tone="pending"
        title={t("observer.awaitingTitle", locale)}
        body={t("observer.awaitingBody", locale)}
      />
    );
  }

  // A néző (ha bejelentkezett) feloldott profilja — best-effort, egyszer.
  const { userId: viewerClerkId } = await auth();
  const viewer = viewerClerkId
    ? await prisma.userProfile.findUnique({
        where: { clerkId: viewerClerkId },
        select: { id: true },
      })
    : null;

  // Self-guard: a bejelentkezett MEGHÍVÓ (értékelt) nem nyithatja meg a saját
  // meghívóját — sem a kitöltő űrlapot, sem a rater szerver-oldali draftját (a
  // rater nyers item-válaszait). Külső tokennél is (ott az addressee-check
  // nincs). Kijelentkezve a külső-token self-eset a W2-vel közös maradék.
  if (viewer && viewer.id === invitation.inviterId) {
    return (
      <PageState
        tone="locked"
        title={t("observer.notAddresseeTitle", locale)}
        body={t("observer.notAddresseeBody", locale)}
      />
    );
  }

  // Belsős (név szerinti kollégának szóló) meghívó: CSAK a bejelentkezett
  // címzett töltheti ki. Külsős meghívónál (nincs observerProfileId) ilyen
  // validáció nem lehetséges — az marad publikus.
  const isInternalInvite = Boolean(invitation.observerProfileId);
  if (isInternalInvite) {
    if (!viewerClerkId) {
      redirect(buildSignInPath(`/observe/${token}`));
    }
    if (!viewer || viewer.id !== invitation.observerProfileId) {
      return (
        <PageState
          tone="locked"
          title={t("observer.notAddresseeTitle", locale)}
          body={t("observer.notAddresseeBody", locale)}
        />
      );
    }
  }

  const config = getTestConfig(invitation.testType as TestType, locale, DEFAULT_ASSESSMENT_FORM);
  const inviterName = invitation.inviter.username ?? t("common.someone", locale);

  // A szerver-oldali draft (a rater NYERS válaszai) csak annak jár, aki írta:
  //  (a) nevesített meghívónál a bejelentkezett címzett (a fenti guard után a
  //      viewer garantáltan ő), VAGY
  //  (b) külső meghívónál az a böngésző, amelyik a draft-mentéskor kapott
  //      HMAC-cookie-t hordozza (részletek + trade-off: observer/draft-cookie.ts).
  // Enélkül a token bármely (akár kijelentkezett) birtokosa – tipikusan maga
  // az ÉRTÉKELT, aki a linket küldte – elolvashatná a folyamatban lévő
  // válaszokat (motor-audit: logged-out draft leak). Cookie nélkül a kitöltő
  // egyszerűen elölről kezdi – a draft NEM törlődik, csak nem jelenik meg.
  const cookieStore = await cookies();
  const canReceiveDraft = isInternalInvite
    ? true
    : isValidObserverDraftCookie(
        invitation.id,
        cookieStore.get(observerDraftCookieName(invitation.id))?.value,
      );

  const draft = canReceiveDraft
    ? await prisma.observerDraft.findUnique({
        where: { invitationId: invitation.id },
      })
    : null;

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
      // Belsős kollégánál a kapcsolat adott: kolléga (a többi opció szürke).
      lockedRelationship={isInternalInvite ? "COLLEAGUE" : null}
    />
  );
}
