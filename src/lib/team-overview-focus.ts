import {
  CAMPAIGN_STEP_LABELS,
  getCampaignStepLink,
  type CampaignStepType,
} from "@/lib/campaign-steps-core";

export interface TeamOverviewMeasurementTask {
  campaignId: string;
  campaignName: string;
  stepType: CampaignStepType;
  opensAt: Date | null;
  started: boolean;
}

export interface TeamOverviewObserverTask {
  campaignName: string;
  sent: number;
  received: number;
  min: number;
}

export interface TeamOverviewFeedbackTask {
  token: string;
  inviterName: string;
  answered: number;
  total: number;
}

export interface TeamOverviewFocus {
  kind: "measurement" | "feedback" | "observer" | "scheduled";
  eyebrow: string;
  title: string;
  description: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string } | null;
  scheduledAt: Date | null;
}

type Locale = "hu" | "en";

function measurementDescription(stepType: CampaignStepType, locale: Locale): string {
  const hu = locale === "hu";

  switch (stepType) {
    case "PSYCH_SAFETY":
      return hu
        ? "8 rövid, névtelen állítás; körülbelül 2 perc."
        : "8 short, anonymous statements; about 2 minutes.";
    case "TRUST_360":
      return hu
        ? "5 rövid kérdés csapattársanként; körülbelül 2–3 perc."
        : "5 short questions per teammate; about 2–3 minutes.";
    case "TEAM_ROLE_360":
      return hu
        ? "Jelöld ki a csapattársaidra leginkább jellemző állításokat."
        : "Select the statements that best describe your teammates.";
    case "TEAM_ROLE":
      return hu
        ? "Rövid kérdőív arról, milyen szerepeket viszel a csapatban."
        : "A short questionnaire about the roles you play in the team.";
    case "PEER_FEEDBACK":
      return hu
        ? "Adj rövid, jövőorientált visszajelzést a csapattársaidnak."
        : "Give your teammates short, future-focused feedback.";
    case "SELF_ASSESSMENT":
    case "OBSERVER_360":
      return hu
        ? "Töltsd ki az önértékelést; ez alapozza meg a csapatképet."
        : "Complete the self-assessment; it provides the basis for the team view.";
  }
}

function tasksLinkLabel(locale: Locale, remainingCount: number): string {
  if (remainingCount <= 0) {
    return locale === "hu" ? "Minden mérési feladatom" : "All my measurement tasks";
  }
  return locale === "hu"
    ? `További ${remainingCount} teendő`
    : `${remainingCount} more ${remainingCount === 1 ? "task" : "tasks"}`;
}

export function resolveTeamOverviewFocus(input: {
  locale: Locale;
  pendingMeasurement: TeamOverviewMeasurementTask | null;
  observerGathering: TeamOverviewObserverTask | null;
  receivedFeedbackRequests: TeamOverviewFeedbackTask[];
}): TeamOverviewFocus | null {
  const { locale, pendingMeasurement, observerGathering, receivedFeedbackRequests } = input;
  const hu = locale === "hu";
  const totalTaskCount =
    (pendingMeasurement ? 1 : 0) +
    receivedFeedbackRequests.length +
    (observerGathering ? 1 : 0);

  if (totalTaskCount === 0) return null;

  const secondary = (primaryLivesInTasks: boolean) => {
    const remainingCount = totalTaskCount - 1;
    if (!primaryLivesInTasks && remainingCount === 0) return null;
    return {
      label: tasksLinkLabel(locale, remainingCount),
      href: "/tasks",
    };
  };

  if (pendingMeasurement && !pendingMeasurement.opensAt) {
    const label = CAMPAIGN_STEP_LABELS[pendingMeasurement.stepType][locale];
    return {
      kind: "measurement",
      eyebrow: hu ? "Következő teendőd" : "Your next task",
      title: label,
      description: `${pendingMeasurement.campaignName}. ${measurementDescription(
        pendingMeasurement.stepType,
        locale,
      )}`,
      primary: {
        label: pendingMeasurement.started
          ? hu
            ? "Folytatom"
            : "Continue"
          : pendingMeasurement.stepType === "PEER_FEEDBACK"
            ? hu
              ? "Visszajelzést adok"
              : "Give feedback"
            : hu
              ? "Kitöltöm most"
              : "Start now",
        href: getCampaignStepLink(
          pendingMeasurement.stepType,
          pendingMeasurement.campaignId,
        ),
      },
      secondary: secondary(true),
      scheduledAt: null,
    };
  }

  const feedbackRequest =
    receivedFeedbackRequests.find((request) => request.answered > 0) ??
    receivedFeedbackRequests[0];
  if (feedbackRequest) {
    return {
      kind: "feedback",
      eyebrow: hu ? "Következő teendőd" : "Your next task",
      title: hu
        ? `Adj visszajelzést ${feedbackRequest.inviterName} számára`
        : `Give feedback to ${feedbackRequest.inviterName}`,
      description:
        feedbackRequest.answered > 0
          ? hu
            ? `${feedbackRequest.answered}/${feedbackRequest.total} kérdés kész – folytasd ott, ahol abbahagytad.`
            : `${feedbackRequest.answered}/${feedbackRequest.total} questions complete – continue where you left off.`
          : hu
            ? "Egy csapattársad rövid visszajelzést kért tőled."
            : "A teammate asked you for a short piece of feedback.",
      primary: {
        label: feedbackRequest.answered > 0
          ? hu
            ? "Folytatom"
            : "Continue"
          : hu
            ? "Kitöltöm"
            : "Give feedback",
        href: `/observe/${feedbackRequest.token}`,
      },
      secondary: secondary(true),
      scheduledAt: null,
    };
  }

  if (observerGathering) {
    return {
      kind: "observer",
      eyebrow: hu ? "Következő teendőd" : "Your next task",
      title: hu ? "Zárd le a külső visszajelzési köröd" : "Complete your external feedback round",
      description: hu
        ? `${observerGathering.campaignName}: ${observerGathering.received}/${observerGathering.min} visszajelzés érkezett, ${observerGathering.sent} meghívó ment ki.`
        : `${observerGathering.campaignName}: ${observerGathering.received}/${observerGathering.min} responses received, ${observerGathering.sent} invites sent.`,
      primary: {
        label:
          observerGathering.sent < observerGathering.min
            ? hu
              ? "Kérek visszajelzést"
              : "Request feedback"
            : hu
              ? "Meghívók kezelése"
              : "Manage invites",
        href: "/profile/results?tab=comparison#observer-flow",
      },
      secondary: secondary(false),
      scheduledAt: null,
    };
  }

  if (pendingMeasurement?.opensAt) {
    return {
      kind: "scheduled",
      eyebrow: hu ? "Következő mérés" : "Next measurement",
      title: CAMPAIGN_STEP_LABELS[pendingMeasurement.stepType][locale],
      description: hu
        ? `${pendingMeasurement.campaignName}. A lépés még nem nyílt meg.`
        : `${pendingMeasurement.campaignName}. This step is not open yet.`,
      primary: {
        label: hu ? "Feladataim áttekintése" : "Review my tasks",
        href: "/tasks",
      },
      secondary: null,
      scheduledAt: pendingMeasurement.opensAt,
    };
  }

  return null;
}
