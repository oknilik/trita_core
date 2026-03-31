import "server-only";

import type { JourneyActionId, JourneyStage, JourneyState } from "./state";

export type JourneyResolverLocale = "hu" | "en";

export interface ResolvedJourneyCta {
  id: JourneyActionId;
  label: string;
  href: string;
}

export interface JourneyNextBestAction {
  stage: JourneyStage;
  primary: ResolvedJourneyCta;
  secondary: ResolvedJourneyCta | null;
  explanation: string;
}

const LABELS: Record<JourneyResolverLocale, Record<JourneyActionId, string>> = {
  hu: {
    START_SELF_ASSESSMENT: "Indítsd el az önértékelést",
    CONTINUE_SELF_ASSESSMENT: "Folytasd a kérdőívet",
    REVIEW_SELF_RESULTS: "Nézd át a személyes eredményt",
    INVITE_OBSERVERS: "Kérj observer visszajelzést",
    MANAGE_OBSERVER_INVITES: "Kezeld a függő observer meghívásokat",
    CREATE_TEAM: "Hozd létre az első csapatodat",
    JOIN_TEAM: "Csatlakozz egy meglévő csapathoz",
    INVITE_TEAM_MEMBERS: "Hívd meg a hiányzó csapattagokat",
    COMPLETE_TEAM_ASSESSMENTS: "Zárd le a csapat kitöltéseit",
    VIEW_TEAM_INSIGHTS: "Nyisd meg a csapat insightokat",
    CREATE_ORG_TEAM: "Aktiváld a szervezeti csapatokat",
    INVITE_ORG_MEMBERS: "Hívd meg a szervezeti tagokat",
    LAUNCH_ORG_CAMPAIGN: "Indíts szervezeti feedback kört",
    VIEW_ORG_INSIGHTS: "Nyisd meg a szervezeti insightokat",
  },
  en: {
    START_SELF_ASSESSMENT: "Start your self assessment",
    CONTINUE_SELF_ASSESSMENT: "Continue the questionnaire",
    REVIEW_SELF_RESULTS: "Review your self insights",
    INVITE_OBSERVERS: "Invite observers for feedback",
    MANAGE_OBSERVER_INVITES: "Manage pending observer invites",
    CREATE_TEAM: "Create your first team",
    JOIN_TEAM: "Join an existing team",
    INVITE_TEAM_MEMBERS: "Invite missing team members",
    COMPLETE_TEAM_ASSESSMENTS: "Complete team assessments",
    VIEW_TEAM_INSIGHTS: "Open team insights",
    CREATE_ORG_TEAM: "Activate organization teams",
    INVITE_ORG_MEMBERS: "Invite organization members",
    LAUNCH_ORG_CAMPAIGN: "Launch an org feedback round",
    VIEW_ORG_INSIGHTS: "Open organization insights",
  },
};

function actionHref(state: JourneyState, actionId: JourneyActionId): string {
  const fromAvailable = state.availableNextActions.find((action) => action.id === actionId);
  if (fromAvailable) return fromAvailable.href;

  const teamId = state.completionSummary.team.teamId;
  const orgId = state.completionSummary.org.orgId;

  switch (actionId) {
    case "START_SELF_ASSESSMENT":
    case "CONTINUE_SELF_ASSESSMENT":
      return "/assessment";
    case "REVIEW_SELF_RESULTS":
      return "/profile/results";
    case "INVITE_OBSERVERS":
    case "MANAGE_OBSERVER_INVITES":
      return "/profile/results?tab=invites";
    case "CREATE_TEAM":
      return "/onboarding?intent=team";
    case "JOIN_TEAM":
      return "/join";
    case "INVITE_TEAM_MEMBERS":
      return teamId ? `/team/${teamId}?tab=members` : "/team";
    case "COMPLETE_TEAM_ASSESSMENTS":
    case "VIEW_TEAM_INSIGHTS":
      return teamId ? `/team/${teamId}` : "/team";
    case "CREATE_ORG_TEAM":
      return orgId ? `/org/${orgId}?tab=teams` : "/org";
    case "INVITE_ORG_MEMBERS":
      return orgId ? `/org/${orgId}?tab=members` : "/org";
    case "LAUNCH_ORG_CAMPAIGN":
      return orgId ? `/org/${orgId}/campaigns/new` : "/org";
    case "VIEW_ORG_INSIGHTS":
      return orgId ? `/org/${orgId}` : "/org";
    default:
      return "/dashboard";
  }
}

function toCta(
  state: JourneyState,
  locale: JourneyResolverLocale,
  actionId: JourneyActionId,
): ResolvedJourneyCta {
  return {
    id: actionId,
    label: LABELS[locale][actionId],
    href: actionHref(state, actionId),
  };
}

function txt(locale: JourneyResolverLocale, hu: string, en: string): string {
  return locale === "hu" ? hu : en;
}

function resolveCtaIdsWithLocale(
  state: JourneyState,
  locale: JourneyResolverLocale,
): {
  primary: JourneyActionId;
  secondary: JourneyActionId | null;
  explanation: string;
} {
  const { currentStage, completionSummary } = state;
  const { self, team, org } = completionSummary;

  switch (currentStage) {
    case "SELF_NOT_STARTED":
      return {
        primary: "START_SELF_ASSESSMENT",
        secondary: null,
        explanation: txt(
          locale,
          "A journey akkor indul, ha elkészül az első self assessment.",
          "Your journey starts once your first self assessment is completed.",
        ),
      };
    case "SELF_IN_PROGRESS":
      return {
        primary: "CONTINUE_SELF_ASSESSMENT",
        secondary: null,
        explanation: txt(
          locale,
          "A személyes eredmény feloldásához fejezd be a félbehagyott kitöltést.",
          "Finish your in-progress assessment to unlock your personal insights.",
        ),
      };
    case "SELF_COMPLETED":
      return {
        primary: "INVITE_OBSERVERS",
        secondary: "CREATE_TEAM",
        explanation: txt(
          locale,
          "Megvan az első self insight, a következő érték a külső visszajelzés és a team kontextus felépítése.",
          "Your self insight is ready. The next value comes from observer feedback and building team context.",
        ),
      };
    case "OBSERVER_PENDING":
      return {
        primary: "MANAGE_OBSERVER_INVITES",
        secondary: "CREATE_TEAM",
        explanation: txt(
          locale,
          "A visszajelzési kör fut, közben érdemes előkészíteni a csapatszintet a következő lépéshez.",
          "Observer feedback is in progress. In parallel, prepare your team layer for the next step.",
        ),
      };
    case "TEAM_NOT_JOINED":
      return {
        primary: "CREATE_TEAM",
        secondary: "JOIN_TEAM",
        explanation: txt(
          locale,
          "A self eredmény után a csapatkontextus adja a következő szintű insightot.",
          "After self insights, team context unlocks the next level of understanding.",
        ),
      };
    case "TEAM_PENDING_MEMBERS":
      return {
        primary: "INVITE_TEAM_MEMBERS",
        secondary: "VIEW_TEAM_INSIGHTS",
        explanation: txt(
          locale,
          "A team insight feloldásához először legyen meg a minimális aktív csapattagszám.",
          "To unlock team insights, first reach the minimum active team size.",
        ),
      };
    case "TEAM_PARTIAL":
      return {
        primary: "COMPLETE_TEAM_ASSESSMENTS",
        secondary: "INVITE_TEAM_MEMBERS",
        explanation: txt(
          locale,
          "A csapat részben kész: a hiányzó kitöltések lezárása után lesz stabil team kép.",
          "Your team is partially ready: close missing assessments to get a stable team picture.",
        ),
      };
    case "TEAM_READY":
      return {
        primary: "VIEW_TEAM_INSIGHTS",
        secondary: "LAUNCH_ORG_CAMPAIGN",
        explanation: txt(
          locale,
          "A team szint már használható, most érdemes insightot olvasni és szervezeti szintre lépni.",
          "Your team layer is ready. Review insights now and step up to org-level work.",
        ),
      };
    case "ORG_PARTIAL":
      if (org.teamCount === 0) {
        return {
          primary: "CREATE_ORG_TEAM",
          secondary: "INVITE_ORG_MEMBERS",
          explanation: txt(
            locale,
            "A szervezeti nézet alapja az aktív csapatstruktúra, ezt érdemes először felépíteni.",
            "Org insights are built on active teams, so set up your team structure first.",
          ),
        };
      }
      if (org.completedMemberCount < 3) {
        return {
          primary: "INVITE_ORG_MEMBERS",
          secondary: "LAUNCH_ORG_CAMPAIGN",
          explanation: txt(
            locale,
            "A szervezeti insighthoz még kevés a kész kitöltés, növelni kell az aktív részvételt.",
            "You need more completed assessments to unlock robust org-level insights.",
          ),
        };
      }
      if (org.activeCampaignCount === 0) {
        return {
          primary: "LAUNCH_ORG_CAMPAIGN",
          secondary: "VIEW_ORG_INSIGHTS",
          explanation: txt(
            locale,
            "A szervezeti folyamat részben kész: egy aktív feedback körrel lesz teljes a működési kép.",
            "The org flow is partially ready. Launching an active feedback round completes the picture.",
          ),
        };
      }
      return {
        primary: "VIEW_ORG_INSIGHTS",
        secondary: "INVITE_ORG_MEMBERS",
        explanation: txt(
          locale,
          "A szervezeti nézet már részben él, további részvétellel tud stabil és reprezentatív maradni.",
          "Your org view is active. Keep participation high to maintain representative insight quality.",
        ),
      };
    case "ORG_READY":
      return {
        primary: "VIEW_ORG_INSIGHTS",
        secondary: "LAUNCH_ORG_CAMPAIGN",
        explanation: txt(
          locale,
          "A szervezeti cockpit készen áll, a következő lépés az insightok alapján futó akciók kezelése.",
          "Your org cockpit is ready. Next, run actions based on the insights.",
        ),
      };
    default:
      return {
        primary: self.completed ? "REVIEW_SELF_RESULTS" : "START_SELF_ASSESSMENT",
        secondary: team.joined ? "VIEW_TEAM_INSIGHTS" : null,
        explanation: txt(
          locale,
          "A jelenlegi állapothoz a legbiztonságosabb következő lépést ajánljuk.",
          "We recommend the safest next action for your current state.",
        ),
      };
  }
}

export function resolveNextBestAction(
  state: JourneyState,
  locale: JourneyResolverLocale = "en",
): JourneyNextBestAction {
  const safeLocale: JourneyResolverLocale = locale === "hu" ? "hu" : "en";
  const resolved = resolveCtaIdsWithLocale(state, safeLocale);

  return {
    stage: state.currentStage,
    primary: toCta(state, safeLocale, resolved.primary),
    secondary: resolved.secondary ? toCta(state, safeLocale, resolved.secondary) : null,
    explanation: resolved.explanation,
  };
}
