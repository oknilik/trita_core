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
          "Válassz a szándékod szerint — az elküldött és beérkezett visszajelzéseid ugyanitt maradnak.",
        kudosTitle: "Köszönetet küldök",
        kudosHint: "Személyes elismerés egy konkrét helyzetért vagy viselkedésért.",
        requestTitle: "Visszajelzést kérek",
        requestHint: "Kérdezd meg a csapatot egy konkrét témáról, akár név nélküli válasszal.",
        inboxTitle: "Beérkezett neked",
        inboxHint: "A köszönetek és fejlesztő visszajelzések egy közös helyen, jól elkülönítve jelennek meg.",
        inboxAction: "Beérkezett visszajelzések megnyitása",
        back: "Vissza a központhoz",
        overviewNav: "Központ",
        kudosNav: "Köszönet",
        requestNav: "Fejlődés",
        inboxNav: "Beérkezett",
      }
    : {
        eyebrow: "feedback",
        overviewTitle: "What would you like to do?",
        overviewHint:
          "Choose based on your intent — sent and received feedback stays together in this hub.",
        kudosTitle: "Send kudos",
        kudosHint: "Personal recognition for a specific situation or behaviour.",
        requestTitle: "Request feedback",
        requestHint: "Ask the team about a specific topic, with optional anonymous responses.",
        inboxTitle: "Received for you",
        inboxHint: "Kudos and development feedback appear together, while remaining clearly distinct.",
        inboxAction: "Open received feedback",
        back: "Back to the hub",
        overviewNav: "Hub",
        kudosNav: "Kudos",
        requestNav: "Growth",
        inboxNav: "Received",
      };

  const navigation: Array<{ id: FeedbackHubView; label: string }> = [
    { id: "overview", label: copy.overviewNav },
    { id: "kudos", label: copy.kudosNav },
    { id: "request", label: copy.requestNav },
    { id: "inbox", label: copy.inboxNav },
  ];

  const screenHeading =
    view === "kudos"
      ? { eyebrow: isHu ? "köszönet" : "kudos", title: copy.kudosTitle, hint: copy.kudosHint }
      : view === "request"
        ? { eyebrow: isHu ? "fejlődés" : "growth", title: copy.requestTitle, hint: copy.requestHint }
        : { eyebrow: copy.eyebrow, title: copy.inboxTitle, hint: copy.inboxHint };

  return (
    <div>
      {view !== "overview" ? (
        <nav
          aria-label={isHu ? "Visszajelzés nézetek" : "Feedback views"}
          className="mb-6 grid grid-cols-2 gap-1.5 rounded-xl bg-cream p-1 sm:grid-cols-4"
        >
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => setView(item.id)}
              className={`rounded-lg px-3 py-2.5 text-caption font-semibold transition ${
                view === item.id
                  ? "bg-surface-card text-ink shadow-sm"
                  : "text-muted hover:bg-surface-card/60 hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      ) : null}

      {view === "overview" ? (
        <>
          <SectionEyebrow>{copy.eyebrow}</SectionEyebrow>
          <h2 className="mt-1 font-fraunces text-3xl text-ink">{copy.overviewTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-body">{copy.overviewHint}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setView("kudos")}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-sand bg-surface-card p-5 text-left shadow-sm transition hover:border-sage-ring hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-soft text-heading" aria-hidden="true">
                🙌
              </span>
              <span>
                <span className="block font-fraunces text-lg font-semibold text-ink">{copy.kudosTitle}</span>
                <span className="mt-1 block text-caption leading-relaxed text-ink-body">{copy.kudosHint}</span>
              </span>
              <span className="text-heading text-[var(--color-accent-primary-strong)] transition group-hover:translate-x-0.5" aria-hidden="true">
                →
              </span>
            </button>
            <button
              type="button"
              onClick={() => setView("request")}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-sand bg-surface-card p-5 text-left shadow-sm transition hover:border-sage-ring hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cream text-heading" aria-hidden="true">
                💬
              </span>
              <span>
                <span className="block font-fraunces text-lg font-semibold text-ink">{copy.requestTitle}</span>
                <span className="mt-1 block text-caption leading-relaxed text-ink-body">{copy.requestHint}</span>
              </span>
              <span className="text-heading text-[var(--color-accent-primary-strong)] transition group-hover:translate-x-0.5" aria-hidden="true">
                →
              </span>
            </button>
          </div>

          <Card as="section" spacing="md" className="mt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-fraunces text-lg text-ink">{copy.inboxTitle}</h3>
                <p className="mt-1 text-caption leading-relaxed text-ink-body">{copy.inboxHint}</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => setView("inbox")}>
                {copy.inboxAction}
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setView("overview")}
            className="mb-4 text-caption font-semibold text-[var(--color-accent-primary-strong)] hover:underline"
          >
            ← {copy.back}
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
