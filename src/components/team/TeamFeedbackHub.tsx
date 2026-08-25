"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { TeamKudos } from "@/components/team/TeamKudos";
import { TeamFeedbackRequests } from "@/components/team/TeamFeedbackRequests";

type FeedbackHubView = "overview" | "kudos" | "request" | "inbox";

interface TeamFeedbackHubProps {
  teamId: string;
  members: Array<{ userId: string; displayName: string }>;
  locale: Locale;
}

export function TeamFeedbackHub({ teamId, members, locale }: TeamFeedbackHubProps) {
  const [view, setView] = useState<FeedbackHubView>("overview");
  const isHu = locale !== "en";

  const copy = isHu
    ? {
        eyebrow: "visszajelzés",
        overviewTitle: "Mit szeretnél tenni?",
        overviewHint:
          "Indíts egy konkrét gesztust vagy fejlődési beszélgetést. A beérkezett visszajelzéseidet is innen éred el.",
        kudosTitle: "Köszönetet küldök",
        kudosScreenTitle: "Kinek mondanál köszönetet?",
        kudosHint: "Személyes elismerés egy konkrét helyzetért vagy viselkedésért.",
        requestTitle: "Visszajelzést kérek",
        requestScreenTitle: "Miről kérsz visszajelzést?",
        requestHint: "Kérdezd meg a csapatot egy konkrét témáról, akár név nélküli válasszal.",
        inboxTitle: "Beérkezett neked",
        inboxHint: "A köszönetek és fejlesztő visszajelzések egy közös helyen, jól elkülönítve jelennek meg.",
        inboxAction: "Megnézem",
        backLabel: "Vissza a visszajelzési központba",
        backPath: "Visszajelzés",
      }
    : {
        eyebrow: "feedback",
        overviewTitle: "What would you like to do?",
        overviewHint:
          "Start a specific gesture or development conversation. Your received feedback is available here too.",
        kudosTitle: "Send kudos",
        kudosScreenTitle: "Who would you like to thank?",
        kudosHint: "Personal recognition for a specific situation or behaviour.",
        requestTitle: "Request feedback",
        requestScreenTitle: "What would you like feedback on?",
        requestHint: "Ask the team about a specific topic, with optional anonymous responses.",
        inboxTitle: "Received for you",
        inboxHint: "Kudos and development feedback appear together, while remaining clearly distinct.",
        inboxAction: "View all",
        backLabel: "Back to the feedback hub",
        backPath: "Feedback",
      };

  const screenHeading =
    view === "kudos"
      ? { eyebrow: isHu ? "köszönet" : "kudos", title: copy.kudosScreenTitle, hint: copy.kudosHint, path: copy.kudosTitle }
      : view === "request"
        ? { eyebrow: isHu ? "fejlődés" : "growth", title: copy.requestScreenTitle, hint: copy.requestHint, path: copy.requestTitle }
        : { eyebrow: copy.eyebrow, title: copy.inboxTitle, hint: copy.inboxHint, path: copy.inboxTitle };

  return (
    <div>
      {view === "overview" ? (
        <>
          <SectionEyebrow>{copy.eyebrow}</SectionEyebrow>
          <h2 className="mt-1 font-fraunces text-3xl text-ink">{copy.overviewTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-body">{copy.overviewHint}</p>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setView("kudos")}
              className="group relative flex min-h-44 flex-col items-start rounded-2xl border border-sand bg-surface-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sage-ring hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-soft text-heading" aria-hidden="true">
                🙌
              </span>
              <span className="mt-5 block font-fraunces text-lg font-semibold text-ink">{copy.kudosTitle}</span>
              <span className="mt-1 block pr-7 text-caption leading-relaxed text-ink-body">{copy.kudosHint}</span>
              <span className="absolute bottom-5 right-5 text-heading text-[var(--color-accent-primary-strong)] transition group-hover:translate-x-0.5" aria-hidden="true">
                →
              </span>
            </button>
            <button
              type="button"
              onClick={() => setView("request")}
              className="group relative flex min-h-44 flex-col items-start rounded-2xl border border-sand bg-surface-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sage-ring hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cream text-heading" aria-hidden="true">
                💬
              </span>
              <span className="mt-5 block font-fraunces text-lg font-semibold text-ink">{copy.requestTitle}</span>
              <span className="mt-1 block pr-7 text-caption leading-relaxed text-ink-body">{copy.requestHint}</span>
              <span className="absolute bottom-5 right-5 text-heading text-[var(--color-accent-primary-strong)] transition group-hover:translate-x-0.5" aria-hidden="true">
                →
              </span>
            </button>
          </div>

          <Card as="section" variant="muted" spacing="md" className="mt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-fraunces text-lg text-ink">{copy.inboxTitle}</h3>
                <p className="mt-1 text-caption leading-relaxed text-ink-body">{copy.inboxHint}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setView("inbox")}>
                {copy.inboxAction} →
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <>
          <button
            type="button"
            aria-label={copy.backLabel}
            onClick={() => setView("overview")}
            className="mb-6 inline-flex items-center gap-2 rounded-lg px-1 py-1 text-sm font-semibold text-[var(--color-accent-primary-strong)] transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus-ring"
          >
            <span aria-hidden="true">←</span>
            <span>{copy.backPath}</span>
            <span className="font-normal text-muted" aria-hidden="true">/ {screenHeading.path}</span>
          </button>
          <SectionEyebrow>{screenHeading.eyebrow}</SectionEyebrow>
          <h2 className="mt-1 font-fraunces text-3xl text-ink">{screenHeading.title}</h2>
          <p className="mt-2 mb-6 max-w-2xl text-sm leading-relaxed text-ink-body">{screenHeading.hint}</p>

          {view === "kudos" ? (
            <TeamKudos teamId={teamId} members={members} locale={locale} view="compose" showHeader={false} />
          ) : null}
          {view === "request" ? (
            <TeamFeedbackRequests
              teamId={teamId}
              members={members}
              locale={locale}
              view="compose"
              showHeader={false}
            />
          ) : null}
          {view === "inbox" ? (
            <div className="flex flex-col gap-5">
              <TeamKudos teamId={teamId} members={members} locale={locale} view="inbox" />
              <TeamFeedbackRequests teamId={teamId} members={members} locale={locale} view="inbox" />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
