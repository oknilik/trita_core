export type DashboardLocale = "hu" | "en";
export type DashboardScope = "self" | "team" | "org";

export type DashboardInsightAvailability = "LOCKED" | "PARTIAL" | "UNLOCKED";
export type DashboardRiskSeverity = "low" | "medium" | "high";
export type DashboardActivityKind = "completed" | "joined" | "pending" | "system";

export interface DashboardActionLink {
  label: string;
  href: string;
}

export interface DashboardHeroSummary {
  eyebrow: string;
  title: string;
  summary: string;
  chips: string[];
  updatedAtLabel?: string;
}

export interface DashboardCompletionStatusCard {
  id: string;
  label: string;
  value: string;
  sub: string;
  progressPct?: number;
}

export interface DashboardRiskAttentionItem {
  id: string;
  severity: DashboardRiskSeverity;
  title: string;
  description: string;
  cta?: DashboardActionLink;
}

export interface DashboardRiskAttentionPanel {
  title: string;
  summary: string;
  items: DashboardRiskAttentionItem[];
}

export interface DashboardRecommendedAction {
  title: string;
  description: string;
  primary: DashboardActionLink;
  secondary: DashboardActionLink | null;
}

export interface DashboardRecentActivityItem {
  id: string;
  kind: DashboardActivityKind;
  title: string;
  meta: string;
  timestampLabel?: string;
}

export interface DashboardInsightState {
  self: DashboardInsightAvailability;
  team: DashboardInsightAvailability;
  org: DashboardInsightAvailability;
}

export interface DashboardIAViewModel {
  scope: DashboardScope;
  journeyStage?: string;
  heroSummary: DashboardHeroSummary;
  completionStatusCards: DashboardCompletionStatusCard[];
  riskAttentionPanel: DashboardRiskAttentionPanel;
  recommendedAction: DashboardRecommendedAction;
  recentActivity: DashboardRecentActivityItem[];
  insightState: DashboardInsightState;
}

interface JourneyLikeNextBestAction {
  explanation: string;
  primary: DashboardActionLink;
  secondary?: DashboardActionLink | null;
}

interface JourneyLikeCompletionSummary {
  self: {
    started: boolean;
    completed: boolean;
    pendingInvites: number;
    completedObservers: number;
  };
  team: {
    joined: boolean;
    memberCount: number;
    completedMemberCount: number;
    pendingInviteCount: number;
    ready: boolean;
  };
  org: {
    joined: boolean;
    teamCount: number;
    memberCount: number;
    completedMemberCount: number;
    pendingInviteCount: number;
    activeCampaignCount: number;
    ready: boolean;
  };
}

interface JourneyLikeBlockingReason {
  code: string;
  detail?: string;
}

export interface SelfDashboardIAInput {
  locale: DashboardLocale;
  displayName: string;
  currentStage: string;
  completionSummary: JourneyLikeCompletionSummary;
  nextBestAction: JourneyLikeNextBestAction;
  blockingReasons?: JourneyLikeBlockingReason[];
  generatedAt?: string;
}

export interface TeamDashboardIAInput {
  locale: DashboardLocale;
  teamName: string;
  memberCount: number;
  completedCount: number;
  inProgressCount: number;
  waitingCount: number;
  hasPattern: boolean;
  hasActiveObserverRound: boolean;
  observerDoneCount?: number;
  observerParticipantCount?: number;
  pendingInviteCount?: number;
  recommendedAction: DashboardRecommendedAction;
  recentActivity?: DashboardRecentActivityItem[];
  updatedAtLabel?: string;
}

export interface OrgDashboardIAInput {
  locale: DashboardLocale;
  orgName: string;
  totalMembers: number;
  completedMembers: number;
  teamCount: number;
  teamsReadyCount: number;
  pendingAttentionCount: number;
  activeCampaignCount: number;
  recommendedAction: DashboardRecommendedAction;
  riskItems: DashboardRiskAttentionItem[];
  recentActivity: DashboardRecentActivityItem[];
  updatedAtLabel?: string;
}

function txt(locale: DashboardLocale, hu: string, en: string): string {
  return locale === "hu" ? hu : en;
}

function toPct(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

function buildInsightStateFromJourney(
  completionSummary: JourneyLikeCompletionSummary,
): DashboardInsightState {
  const self = completionSummary.self.completed ? "UNLOCKED" : completionSummary.self.started ? "PARTIAL" : "LOCKED";
  const team = completionSummary.team.ready
    ? "UNLOCKED"
    : completionSummary.team.joined
      ? "PARTIAL"
      : "LOCKED";
  const org = completionSummary.org.ready
    ? "UNLOCKED"
    : completionSummary.org.joined
      ? "PARTIAL"
      : "LOCKED";

  return { self, team, org };
}

export function createSelfDashboardIA(input: SelfDashboardIAInput): DashboardIAViewModel {
  const { locale, displayName, currentStage, completionSummary, nextBestAction, blockingReasons } = input;
  const selfCompletion = toPct(
    completionSummary.self.completed ? 1 : completionSummary.self.started ? 1 : 0,
    1,
  );
  const teamCompletion = toPct(
    completionSummary.team.completedMemberCount,
    Math.max(completionSummary.team.memberCount, 1),
  );

  const riskItems =
    blockingReasons?.map((reason, index) => ({
      id: `${reason.code}-${index}`,
      severity: "medium" as const,
      title: reason.code,
      description: reason.detail ?? txt(locale, "Továbblépéshez szükséges feltétel.", "A condition must be met to progress."),
    })) ?? [];

  return {
    scope: "self",
    journeyStage: currentStage,
    heroSummary: {
      eyebrow: txt(locale, "Saját iránytű", "Self cockpit"),
      title: displayName,
      summary: txt(
        locale,
        "A saját képed készen áll, innen épül tovább a csapat- és szervezeti nézet.",
        "Your self insight is ready. Team and org views are built from this layer.",
      ),
      chips: [
        `${completionSummary.self.completedObservers} ${txt(locale, "observer kész", "observer done")}`,
        `${completionSummary.self.pendingInvites} ${txt(locale, "függő meghívás", "pending invite")}`,
        txt(
          locale,
          `team: ${completionSummary.team.ready ? "kész" : completionSummary.team.joined ? "részleges" : "zárt"}`,
          `team: ${completionSummary.team.ready ? "ready" : completionSummary.team.joined ? "partial" : "locked"}`,
        ),
      ],
      updatedAtLabel: input.generatedAt,
    },
    completionStatusCards: [
      {
        id: "self-completion",
        label: txt(locale, "Saját kitöltés", "Self completion"),
        value: `${selfCompletion}%`,
        sub: completionSummary.self.completed
          ? txt(locale, "A személyes profil elkészült.", "Your personal profile is completed.")
          : txt(locale, "A személyes kitöltés még folyamatban van.", "Self assessment is still in progress."),
        progressPct: selfCompletion,
      },
      {
        id: "observer-status",
        label: txt(locale, "Observer kör", "Observer round"),
        value: String(completionSummary.self.completedObservers),
        sub: txt(
          locale,
          `${completionSummary.self.pendingInvites} függő meghívás`,
          `${completionSummary.self.pendingInvites} pending invites`,
        ),
      },
      {
        id: "team-readiness",
        label: txt(locale, "Team készültség", "Team readiness"),
        value: `${teamCompletion}%`,
        sub: txt(
          locale,
          `${completionSummary.team.completedMemberCount}/${completionSummary.team.memberCount} kész`,
          `${completionSummary.team.completedMemberCount}/${completionSummary.team.memberCount} done`,
        ),
        progressPct: teamCompletion,
      },
    ],
    riskAttentionPanel: {
      title: txt(locale, "Figyelmet kér", "Needs attention"),
      summary:
        riskItems.length > 0
          ? txt(locale, "Van néhány blokk, amit érdemes lezárni.", "There are blockers to resolve.")
          : txt(locale, "Nincs kritikus blokk a következő lépéshez.", "No critical blocker for your next step."),
      items: riskItems,
    },
    recommendedAction: {
      title: txt(locale, "Következő legjobb lépés", "Next best action"),
      description: nextBestAction.explanation,
      primary: nextBestAction.primary,
      secondary: nextBestAction.secondary ?? null,
    },
    recentActivity: [],
    insightState: buildInsightStateFromJourney(completionSummary),
  };
}

export function createTeamDashboardIA(input: TeamDashboardIAInput): DashboardIAViewModel {
  const completionPct = toPct(input.completedCount, Math.max(input.memberCount, 1));
  const observerPct =
    input.hasActiveObserverRound && (input.observerParticipantCount ?? 0) > 0
      ? toPct(input.observerDoneCount ?? 0, input.observerParticipantCount ?? 1)
      : toPct(input.completedCount, 3);

  return {
    scope: "team",
    heroSummary: {
      eyebrow: txt(input.locale, "Csapat cockpit", "Team cockpit"),
      title: input.teamName,
      summary: txt(
        input.locale,
        `${input.memberCount} tagból ${input.completedCount} kész, ${input.waitingCount} várakozik.`,
        `${input.completedCount} of ${input.memberCount} members are done, ${input.waitingCount} are waiting.`,
      ),
      chips: [
        `${input.memberCount} ${txt(input.locale, "tag", "members")}`,
        `${completionPct}% ${txt(input.locale, "kitöltés", "completion")}`,
        input.hasPattern
          ? txt(input.locale, "csapatkép elérhető", "pattern available")
          : txt(input.locale, "csapatkép zárolt", "pattern locked"),
      ],
      updatedAtLabel: input.updatedAtLabel,
    },
    completionStatusCards: [
      {
        id: "team-completion",
        label: txt(input.locale, "Kitöltési arány", "Completion rate"),
        value: `${completionPct}%`,
        sub: txt(
          input.locale,
          `${input.completedCount} kész · ${input.inProgressCount} folyamatban · ${input.waitingCount} vár`,
          `${input.completedCount} done · ${input.inProgressCount} in progress · ${input.waitingCount} waiting`,
        ),
        progressPct: completionPct,
      },
      {
        id: "team-pattern",
        label: txt(input.locale, "Csapatmintázat", "Team pattern"),
        value: input.hasPattern
          ? txt(input.locale, "Elérhető", "Available")
          : txt(input.locale, "Még nem", "Not yet"),
        sub: input.hasPattern
          ? txt(input.locale, "A csapatkép már elemezhető.", "Team pattern is ready for analysis.")
          : txt(input.locale, "Minimum 3 kész kitöltés kell.", "At least 3 completed assessments required."),
        progressPct: Math.min(toPct(input.completedCount, 3), 100),
      },
      {
        id: "team-observer",
        label: txt(input.locale, "Visszajelzési kör", "Feedback round"),
        value: `${observerPct}%`,
        sub: input.hasActiveObserverRound
          ? txt(
              input.locale,
              `${input.observerDoneCount ?? 0}/${input.observerParticipantCount ?? 0} kész`,
              `${input.observerDoneCount ?? 0}/${input.observerParticipantCount ?? 0} done`,
            )
          : txt(input.locale, "Nincs aktív kör", "No active round"),
        progressPct: observerPct,
      },
    ],
    riskAttentionPanel: {
      title: txt(input.locale, "Figyelmet kér", "Needs attention"),
      summary:
        input.waitingCount > 0
          ? txt(input.locale, "A hiányzó kitöltések lassítják a csapatképet.", "Missing assessments slow down team insight.")
          : txt(input.locale, "A fő akadályok lezárva.", "Main blockers are closed."),
      items:
        input.waitingCount > 0
          ? [
              {
                id: "team-missing-members",
                severity: "high",
                title: txt(input.locale, "Hiányzó kitöltések", "Missing assessments"),
                description: txt(
                  input.locale,
                  `${input.waitingCount} fő még nem kezdte el a kitöltést.`,
                  `${input.waitingCount} members have not started yet.`,
                ),
              },
            ]
          : [],
    },
    recommendedAction: input.recommendedAction,
    recentActivity: input.recentActivity ?? [],
    insightState: {
      self: "UNLOCKED",
      team: input.hasPattern ? "UNLOCKED" : completionPct > 0 ? "PARTIAL" : "LOCKED",
      org: "LOCKED",
    },
  };
}

export function createOrgDashboardIA(input: OrgDashboardIAInput): DashboardIAViewModel {
  const completionPct = toPct(input.completedMembers, Math.max(input.totalMembers, 1));
  const teamReadinessPct = toPct(input.teamsReadyCount, Math.max(input.teamCount, 1));

  return {
    scope: "org",
    heroSummary: {
      eyebrow: txt(input.locale, "Szervezeti cockpit", "Organization cockpit"),
      title: input.orgName,
      summary: txt(
        input.locale,
        `${input.teamCount} csapatból ${input.teamsReadyCount} áll készen, ${input.pendingAttentionCount} figyelmi pont nyitott.`,
        `${input.teamsReadyCount} of ${input.teamCount} teams are ready, with ${input.pendingAttentionCount} open attention points.`,
      ),
      chips: [
        `${input.totalMembers} ${txt(input.locale, "aktív tag", "active members")}`,
        `${input.teamCount} ${txt(input.locale, "csapat", "teams")}`,
        `${input.teamsReadyCount} ${txt(input.locale, "csapatkép kész", "team insights ready")}`,
      ],
      updatedAtLabel: input.updatedAtLabel,
    },
    completionStatusCards: [
      {
        id: "org-completion",
        label: txt(input.locale, "Szervezeti kitöltés", "Org completion"),
        value: `${completionPct}%`,
        sub: txt(
          input.locale,
          `${input.completedMembers}/${input.totalMembers} kész`,
          `${input.completedMembers}/${input.totalMembers} done`,
        ),
        progressPct: completionPct,
      },
      {
        id: "org-teams",
        label: txt(input.locale, "Csapatkészültség", "Team readiness"),
        value: `${teamReadinessPct}%`,
        sub: txt(
          input.locale,
          `${input.teamsReadyCount}/${input.teamCount} csapatkép kész`,
          `${input.teamsReadyCount}/${input.teamCount} team insights ready`,
        ),
        progressPct: teamReadinessPct,
      },
      {
        id: "org-attention",
        label: txt(input.locale, "Figyelmet kér", "Needs attention"),
        value: String(input.pendingAttentionCount),
        sub: txt(
          input.locale,
          input.pendingAttentionCount > 0 ? "Nyitott teendők a stabil org képhez." : "Nincs kritikus teendő.",
          input.pendingAttentionCount > 0 ? "Open tasks before stable org insight." : "No critical tasks.",
        ),
        progressPct: Math.min(input.pendingAttentionCount * 33, 100),
      },
      {
        id: "org-campaigns",
        label: txt(input.locale, "Aktív körök", "Active rounds"),
        value: String(input.activeCampaignCount),
        sub: txt(
          input.locale,
          input.activeCampaignCount > 0 ? "Folyamatban lévő szervezeti körök." : "Még nincs aktív szervezeti kör.",
          input.activeCampaignCount > 0 ? "Organization rounds are active." : "No active organization rounds yet.",
        ),
      },
    ],
    riskAttentionPanel: {
      title: txt(input.locale, "Figyelmet kér", "Needs attention"),
      summary:
        input.riskItems.length > 0
          ? txt(input.locale, "A következő döntés előtt ezeket zárd le.", "Close these before the next decision cycle.")
          : txt(input.locale, "Nincs nyitott kritikus jelzés.", "No open critical warning."),
      items: input.riskItems,
    },
    recommendedAction: input.recommendedAction,
    recentActivity: input.recentActivity,
    insightState: {
      self: input.completedMembers > 0 ? "UNLOCKED" : "LOCKED",
      team: input.teamsReadyCount > 0 ? "UNLOCKED" : input.teamCount > 0 ? "PARTIAL" : "LOCKED",
      org:
        input.activeCampaignCount > 0 && completionPct >= 50
          ? "UNLOCKED"
          : completionPct > 0
            ? "PARTIAL"
            : "LOCKED",
    },
  };
}
