import "server-only";

import type {
  JourneyActionId,
  JourneyNextBestAction,
  JourneyResolvedCta,
  JourneyState,
} from "./types";

export type JourneyResolverLocale = "hu" | "en";
export type { JourneyNextBestAction, JourneyResolvedCta as ResolvedJourneyCta } from "./types";

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
): JourneyResolvedCta {
  return {
    id: actionId,
    label: LABELS[locale][actionId],
    href: actionHref(state, actionId),
  };
}

function txt(locale: JourneyResolverLocale, hu: string, en: string): string {
  return locale === "hu" ? hu : en;
}

function pendingMembershipInvites(state: JourneyState): number {
  return (
    state.completionSummary.self.pendingTeamInvites +
    state.completionSummary.self.pendingOrgInvites
  );
}

function hasTeamRelevantContext(state: JourneyState): boolean {
  return (
    state.completionSummary.self.explicitTeamIntent ||
    pendingMembershipInvites(state) > 0 ||
    state.completionSummary.team.joined ||
    state.completionSummary.org.joined
  );
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
  const pendingMembershipInviteCount = pendingMembershipInvites(state);
  const teamRelevantContext = hasTeamRelevantContext(state);

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
      if (pendingMembershipInviteCount > 0) {
        return {
          primary: "JOIN_TEAM",
          secondary: "INVITE_OBSERVERS",
          explanation: txt(
            locale,
            "A saját profilod elkészült, és van függő csatlakozási meghívásod. Elsőként érdemes ezt elfogadni.",
            "Your self profile is complete and you have a pending membership invite. Accepting it is the clearest next step.",
          ),
        };
      }
      if (self.explicitTeamIntent) {
        return {
          primary: "CREATE_TEAM",
          secondary: "INVITE_OBSERVERS",
          explanation: txt(
            locale,
            "A saját insight elkészült. Ha csapatfókusszal indultál, most érdemes létrehozni az első csapatot.",
            "Your self insight is ready. If you started with team intent, creating your first team is the right next step.",
          ),
        };
      }
      return {
        primary: "INVITE_OBSERVERS",
        secondary: "REVIEW_SELF_RESULTS",
        explanation: txt(
          locale,
          "Megvan az első self insight. Következő lépésként kérj visszajelzést vagy mélyítsd a saját eredményeidet.",
          "Your self insight is ready. Next, collect observer feedback or deepen your personal insights.",
        ),
      };
    case "OBSERVER_PENDING":
      if (pendingMembershipInviteCount > 0) {
        return {
          primary: "MANAGE_OBSERVER_INVITES",
          secondary: "JOIN_TEAM",
          explanation: txt(
            locale,
            "Az observer kör még fut, közben a függő csatlakozási meghívásodat is lezárhatod.",
            "Observer feedback is still in progress; meanwhile, you can also complete your pending membership invite.",
          ),
        };
      }
      if (self.explicitTeamIntent) {
        return {
          primary: "MANAGE_OBSERVER_INVITES",
          secondary: "CREATE_TEAM",
          explanation: txt(
            locale,
            "Az observer kör fut. Team fókusznál közben előkészítheted az első csapatot is.",
            "Observer feedback is in progress. With team intent, you can also prepare your first team.",
          ),
        };
      }
      return {
        primary: "MANAGE_OBSERVER_INVITES",
        secondary: "REVIEW_SELF_RESULTS",
        explanation: txt(
          locale,
          "A visszajelzési kör még nyitott. Most a saját köröd lezárása és az eredmények követése a fókusz.",
          "Observer feedback is still open. Focus on closing this round and reviewing your own insight quality.",
        ),
      };
    case "TEAM_NOT_JOINED":
      if (pendingMembershipInviteCount > 0) {
        return {
          primary: "JOIN_TEAM",
          secondary: "REVIEW_SELF_RESULTS",
          explanation: txt(
            locale,
            "Van csatlakozási meghívásod, így a következő lépés ennek elfogadása.",
            "You have a pending membership invite, so accepting it is the next best action.",
          ),
        };
      }
      if (self.explicitTeamIntent || teamRelevantContext) {
        return {
          primary: "CREATE_TEAM",
          secondary: "JOIN_TEAM",
          explanation: txt(
            locale,
            "Van releváns csapatkontextus, ezért most a csapatréteg felépítése a legjobb következő lépés.",
            "You have relevant team context, so building your team layer is the best next step.",
          ),
        };
      }
      return {
        primary: "INVITE_OBSERVERS",
        secondary: "REVIEW_SELF_RESULTS",
        explanation: txt(
          locale,
          "A self journey önmagában is teljes. Ha szeretnéd, innen tudsz továbbmenni observer vagy team irányba.",
          "The self journey is complete on its own. From here, you can optionally continue with observers or team context.",
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
  const availableIds = new Set(state.availableNextActions.map((action) => action.id));
  const fallbackPrimary = state.availableNextActions[0]?.id ?? null;

  const primaryId =
    availableIds.size === 0 || availableIds.has(resolved.primary)
      ? resolved.primary
      : (fallbackPrimary ?? resolved.primary);
  const fallbackSecondary =
    state.availableNextActions.find((action) => action.id !== primaryId)?.id ?? null;
  const secondaryId = resolved.secondary
    ? availableIds.has(resolved.secondary) && resolved.secondary !== primaryId
      ? resolved.secondary
      : fallbackSecondary
    : fallbackSecondary;

  return {
    stage: state.currentStage,
    primary: toCta(state, safeLocale, primaryId),
    secondary: secondaryId ? toCta(state, safeLocale, secondaryId) : null,
    explanation: resolved.explanation,
  };
}
