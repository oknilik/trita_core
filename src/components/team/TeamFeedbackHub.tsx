"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { BackChevronIcon } from "@/components/ui/primitives/BackChevronIcon";
import { ChevronRightIcon } from "@/components/ui/icons";
import { TeamKudos } from "@/components/team/TeamKudos";
import { TeamFeedbackRequests } from "@/components/team/TeamFeedbackRequests";

type FeedbackHubView = "overview" | "kudos" | "request" | "inbox";

interface TeamFeedbackHubProps {
  teamId: string;
  members: Array<{ userId: string; displayName: string }>;
  locale: Locale;
  initialView?: FeedbackHubView;
}

export function TeamFeedbackHub({ teamId, members, locale, initialView = "overview" }: TeamFeedbackHubProps) {
  const [view, setView] = useState<FeedbackHubView>(initialView);
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
        inboxTitle: "A te visszajelzéseid",
        inboxHint: "Itt találod a neked küldött köszöneteket és a kéréseidre érkezett válaszokat.",
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
        inboxTitle: "Your feedback",
        inboxHint: "Find kudos sent to you and responses to your feedback requests here.",
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
              <ChevronRightIcon className="absolute bottom-5 right-5 h-5 w-5 text-[var(--color-accent-primary-strong)] transition group-hover:translate-x-0.5" />
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
              <ChevronRightIcon className="absolute bottom-5 right-5 h-5 w-5 text-[var(--color-accent-primary-strong)] transition group-hover:translate-x-0.5" />
            </button>
          </div>

          <Card as="section" variant="muted" spacing="md" className="mt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-fraunces text-lg text-ink">{copy.inboxTitle}</h3>
                <p className="mt-1 text-caption leading-relaxed text-ink-body">{copy.inboxHint}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconRight={<ChevronRightIcon />}
                onClick={() => setView("inbox")}
                style={{ color: "var(--color-accent-primary-strong)" }}
              >
                {copy.inboxAction}
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
            className="group mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl py-1 pl-1.5 pr-3 text-sm font-semibold text-[var(--color-accent-primary-strong)] transition hover:bg-[var(--color-surface-highlight-warm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus-ring"
          >
            <BackChevronIcon tone="accent" />
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
