import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import {
  CAMPAIGN_STEP_LABELS,
  CAMPAIGN_STEP_LINKS,
  getCampaignSteps,
  isCampaignStepDone,
  isCampaignStepType,
  isStepGateOpen,
} from "@/lib/campaign-steps-core";
import {
  getStepPartialProgress,
  hasStartedStep,
  releaseDueCampaignSteps,
} from "@/lib/campaign-steps";
import { DEFAULT_ASSESSMENT_FORM } from "@/lib/operating-mode";
import { OBSERVER_MIN_FOR_REVEAL } from "@/lib/observer-flow";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Mérési feladataim | trita", robots: { index: false } };
}

// Tag-oldali kampány-nézet: a saját aktív méréseim, lépésenkénti
// állapottal (kész / nyitott / ütemezett / hátralévő), rész-haladással
// (pl. „2/5 értékelés kész") és vissza-linkkel a kitöltő-felületre.
export default async function MyMeasurementsPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");
  const loc = locale as Locale;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  // Esedékes ütemezett lépések kinyitása (a látogatás maga a trigger).
  await releaseDueCampaignSteps({ userId: profile.id }).catch(() => {});

  const participations = await prisma.campaignParticipant.findMany({
    where: { userId: profile.id, campaign: { status: "ACTIVE" } },
    orderBy: { campaign: { createdAt: "desc" } },
    select: {
      currentStep: true,
      nextStepOpensAt: true,
      stepCompletions: true,
      campaign: {
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          steps: true,
          teamId: true,
          teamIds: true,
          requireFreshResults: true,
          activatedAt: true,
        },
      },
    },
  });

  // Rólam kért visszajelzések MELLETT: amit TŐLEM kértek (belsős observer-
  // meghívók) — ezek is mérési teendők, rész-haladással (szerver-draft).
  const feedbackRequests = (
    await prisma.observerInvitation.findMany({
      where: {
        observerProfileId: profile.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        token: true,
        testType: true,
        expiresAt: true,
        inviter: { select: { username: true, email: true } },
        draft: { select: { answers: true } },
      },
    })
  ).map((inv) => {
    const total = getTestConfig(
      inv.testType as TestType,
      locale as Locale,
      DEFAULT_ASSESSMENT_FORM,
    ).questions.length;
    const answered =
      inv.draft?.answers && typeof inv.draft.answers === "object" && !Array.isArray(inv.draft.answers)
        ? Object.keys(inv.draft.answers as Record<string, unknown>).length
        : 0;
    return {
      token: inv.token,
      inviterName: inv.inviter.username ?? inv.inviter.email ?? "—",
      expiresAt: inv.expiresAt,
      answered: Math.min(answered, total),
      total,
    };
  });

  // Saját observer-meghívóim (küldött + beérkezett) — az OBSERVER_360
  // kampány-kártyán a gyűjtés haladása ebből számolódik (fresh-tudatosan).
  const myInvitations =
    participations.length > 0
      ? await prisma.observerInvitation.findMany({
          where: {
            inviterId: profile.id,
            status: { in: ["AWAITING_APPROVAL", "PENDING", "COMPLETED"] },
          },
          select: { status: true, createdAt: true, completedAt: true },
        })
      : [];

  // OBSERVER_360 legacy fallback-hoz: van-e (fresh-tudatos) self-eredmény.
  const latestSelf =
    participations.length > 0
      ? await prisma.assessmentResult.findFirst({
          where: { userProfileId: profile.id, isSelfAssessment: true },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        })
      : null;

  const dateLocale = loc === "en" ? "en-GB" : "hu-HU";

  const cards = await Promise.all(
    participations.map(async (p) => {
      const steps = getCampaignSteps(p.campaign);
      const freshFrom =
        p.campaign.requireFreshResults && p.campaign.activatedAt
          ? p.campaign.activatedAt.getTime()
          : null;
      const selfDone = Boolean(
        latestSelf &&
          (freshFrom === null || latestSelf.createdAt.getTime() >= freshFrom),
      );
      const doneFlags = steps.map((_, idx) =>
        isCampaignStepDone(steps, idx, p, selfDone),
      );
      const doneCount = doneFlags.filter(Boolean).length;
      const currentIdx = doneFlags.findIndex((f) => !f);
      const gateOpen = isStepGateOpen(p);

      // Rész-haladás a nyitott lépésen (értékelős lépések) + „megkezdte-e"
      // (OBSERVER_360-nál a szerver-oldali felmérés-piszkozat is számít).
      const currentType = currentIdx >= 0 ? steps[currentIdx] : null;
      const [partial, started] = currentType
        ? await Promise.all([
            getStepPartialProgress(p.campaign, currentType, profile.id),
            hasStartedStep(p.campaign, currentType, profile.id),
          ])
        : [null, false];

      // Observer-gyűjtés haladása (OBSERVER_360 kampányban): hány meghívót
      // küldött a tag, és hány visszajelzés érkezett be (küszöb: 3). A lépés
      // maga a self-kitöltéssel teljesül, de a kör addig „él", amíg a külső
      // kép össze nem áll — ez a kártyán is látszik.
      const observer = steps.includes("OBSERVER_360")
        ? (() => {
            const relevant = myInvitations.filter(
              (inv) => freshFrom === null || inv.createdAt.getTime() >= freshFrom,
            );
            const received = myInvitations.filter(
              (inv) =>
                inv.status === "COMPLETED" &&
                (freshFrom === null ||
                  (inv.completedAt && inv.completedAt.getTime() >= freshFrom)),
            ).length;
            return { sent: relevant.length, received, min: OBSERVER_MIN_FOR_REVEAL };
          })()
        : null;

      return {
        id: p.campaign.id,
        name: p.campaign.name,
        description: p.campaign.description,
        steps,
        doneFlags,
        doneCount,
        currentIdx,
        gateOpen,
        nextStepOpensAt: p.nextStepOpensAt,
        partial,
        started,
        observer,
      };
    }),
  );

  return (
    <main className="min-h-dvh bg-cream">
      <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-20">
        <p className="font-mono text-xs uppercase tracking-widest text-bronze">
          {t("myTasks.eyebrow", loc)}
        </p>
        <h1 className="mt-1 font-fraunces text-3xl text-ink">
          {t("myTasks.title", loc)}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-body">
          {t("myTasks.intro", loc)}
        </p>

        {/* Tőlem kért visszajelzések (belsős observer-meghívók) */}
        {feedbackRequests.length > 0 && (
          <section className="mt-8 rounded-2xl border border-sand bg-surface-card p-6 shadow-sm md:p-7">
            <p className="font-mono text-micro uppercase tracking-widest text-bronze">
              {t("myTasks.feedbackRequestsEyebrow", loc)}
            </p>
            <h2 className="mt-1 font-fraunces text-xl text-ink">
              {t("myTasks.feedbackRequestsTitle", loc)}
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {feedbackRequests.map((req) => (
                <div
                  key={req.token}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-bronze/40 bg-cream px-3.5 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bronze text-[11px] font-bold text-white">
                      ★
                    </span>
                    <span className="text-caption font-medium text-ink">
                      {tf("myTasks.feedbackRequestFrom", loc, { name: req.inviterName })}
                    </span>
                    {req.answered > 0 && (
                      <span className="rounded-full bg-bronze/10 px-2 py-0.5 text-micro font-semibold text-bronze">
                        {tf("myTasks.feedbackRequestProgress", loc, {
                          done: req.answered,
                          total: req.total,
                        })}
                      </span>
                    )}
                  </span>
                  <Link
                    href={`/observe/${req.token}`}
                    className="inline-flex min-h-[44px] shrink-0 items-center rounded-lg bg-action-primary-bg px-3.5 text-xs font-semibold text-white transition hover:brightness-110"
                  >
                    {req.answered > 0
                      ? t("myTasks.stepOpen", loc)
                      : t("myTasks.stepStart", loc)}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {cards.length === 0 && feedbackRequests.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-sand bg-surface-card p-8 text-center shadow-sm">
            <h2 className="font-fraunces text-xl text-ink">
              {t("myTasks.noneTitle", loc)}
            </h2>
            <p className="mt-2 text-sm text-ink-body">
              {t("myTasks.noneBody", loc)}
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-action-primary-bg px-6 text-caption font-semibold text-white transition hover:brightness-110"
            >
              {t("myTasks.backToDashboard", loc)}
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-5">
            {cards.map((card) => {
              const allDone = card.doneCount >= card.steps.length;
              // Observer-gyűjtés még fut → a kártya ne mondja, hogy minden kész.
              const gathering =
                card.observer !== null && card.observer.received < card.observer.min;
              return (
                <section
                  key={card.id}
                  className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm md:p-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-fraunces text-xl text-ink">{card.name}</h2>
                      {card.description && (
                        <p className="mt-1 text-xs text-ink-body/70">{card.description}</p>
                      )}
                    </div>
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        allDone && !gathering
                          ? "bg-sage/15 text-sage-dark"
                          : allDone
                            ? "bg-bronze/10 text-bronze"
                            : "bg-sand text-ink-body",
                      ].join(" ")}
                    >
                      {allDone && !gathering
                        ? t("myTasks.allDoneBadge", loc)
                        : allDone
                          ? t("myTasks.observerGatheringBadge", loc)
                          : tf("myTasks.progressLabel", loc, {
                              done: card.doneCount,
                              total: card.steps.length,
                            })}
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
                    <div
                      className="h-full rounded-full bg-sage transition-all duration-500"
                      style={{
                        width: `${(card.doneCount / Math.max(card.steps.length, 1)) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {card.steps.map((stepType, idx) => {
                      const label = isCampaignStepType(stepType)
                        ? CAMPAIGN_STEP_LABELS[stepType][loc === "en" ? "en" : "hu"]
                        : stepType;
                      const isDone = card.doneFlags[idx];
                      const isCurrent = idx === card.currentIdx;
                      const link = isCampaignStepType(stepType)
                        ? CAMPAIGN_STEP_LINKS[stepType]
                        : "/dashboard";
                      const started = isCurrent && card.started;
                      // OBSERVER_360: a lépés a self-kitöltéssel teljesül, de a
                      // külső kép gyűjtése tovább fut — min. 3 beérkezésig a
                      // sor a meghívó-haladást és a meghívó-CTA-t mutatja.
                      const observerGathering =
                        stepType === "OBSERVER_360" &&
                        isDone &&
                        card.observer !== null &&
                        card.observer.received < card.observer.min
                          ? card.observer
                          : null;
                      return (
                        <div
                          key={stepType}
                          className={[
                            "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5",
                            isDone
                              ? "border-sage/30 bg-sage/5"
                              : isCurrent
                                ? "border-bronze/40 bg-cream"
                                : "border-sand bg-surface-card opacity-80",
                          ].join(" ")}
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={[
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                                isDone
                                  ? "bg-sage text-white"
                                  : isCurrent
                                    ? "bg-bronze text-white"
                                    : "bg-sand text-muted",
                              ].join(" ")}
                            >
                              {isDone ? "✓" : idx + 1}
                            </span>
                            <span className="text-caption font-medium text-ink">
                              {label}
                            </span>
                            {isCurrent && card.partial && (
                              <span className="rounded-full bg-bronze/10 px-2 py-0.5 text-micro font-semibold text-bronze">
                                {tf("myTasks.partialProgress", loc, {
                                  done: card.partial.done,
                                  total: card.partial.total,
                                })}
                              </span>
                            )}
                            {observerGathering && (
                              <span className="rounded-full bg-bronze/10 px-2 py-0.5 text-micro font-semibold text-bronze">
                                {tf("myTasks.observerProgress", loc, {
                                  received: observerGathering.received,
                                  min: observerGathering.min,
                                })}
                                {" · "}
                                {tf("myTasks.observerSent", loc, {
                                  sent: observerGathering.sent,
                                })}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0">
                            {observerGathering ? (
                              <Link
                                href="/profile/results?tab=comparison#observer-flow"
                                className="inline-flex min-h-[44px] items-center rounded-lg bg-action-primary-bg px-3.5 text-xs font-semibold text-white transition hover:brightness-110"
                              >
                                {observerGathering.sent < observerGathering.min
                                  ? tf("myTasks.observerAskCta", loc, {
                                      min: observerGathering.min,
                                    })
                                  : t("myTasks.observerManageCta", loc)}
                              </Link>
                            ) : isDone ? (
                              <span className="text-xs font-semibold text-sage-dark">
                                {t("myTasks.stepDone", loc)}
                              </span>
                            ) : isCurrent && card.gateOpen ? (
                              <Link
                                href={link}
                                className="inline-flex min-h-[44px] items-center rounded-lg bg-action-primary-bg px-3.5 text-xs font-semibold text-white transition hover:brightness-110"
                              >
                                {started
                                  ? t("myTasks.stepOpen", loc)
                                  : t("myTasks.stepStart", loc)}
                              </Link>
                            ) : isCurrent && card.nextStepOpensAt ? (
                              <span className="text-xs text-muted">
                                {tf("myTasks.stepOpensAt", loc, {
                                  date: card.nextStepOpensAt.toLocaleString(dateLocale, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }),
                                })}
                              </span>
                            ) : (
                              <span className="text-xs text-muted">
                                {t(
                                  isCurrent
                                    ? "myTasks.stepLocked"
                                    : "myTasks.stepUpcoming",
                                  loc,
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
