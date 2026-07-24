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

const BLOCKING_CODE_LABELS: Record<string, { hu: string; en: string }> = {
  SELF_ASSESSMENT_MISSING: { hu: "Önértékelés hiányzik", en: "Self assessment missing" },
  SELF_ASSESSMENT_INCOMPLETE: { hu: "Önértékelés félbemaradt", en: "Self assessment incomplete" },
  OBSERVER_RESPONSES_PENDING: { hu: "Observer válaszok függőben", en: "Observer responses pending" },
  TEAM_MEMBERSHIP_MISSING: { hu: "Csapattagság hiányzik", en: "Team membership missing" },
  MIN_TEAM_SIZE_NOT_MET: { hu: "Minimum csapatméret nem teljesül", en: "Minimum team size not met" },
  TEAM_MEMBER_INVITES_PENDING: { hu: "Csapatmeghívók függőben", en: "Team invites pending" },
  TEAM_MEMBER_ASSESSMENTS_PENDING: { hu: "Csapattagok kitöltései folyamatban", en: "Team member assessments in progress" },
  ORG_TEAM_MISSING: { hu: "Szervezeti csapat hiányzik", en: "Org team missing" },
  ORG_MEMBER_ASSESSMENTS_PENDING: { hu: "Szervezeti kitöltések folyamatban", en: "Org member assessments in progress" },
  ORG_CAMPAIGN_MISSING: { hu: "Szervezeti kampány hiányzik", en: "Org campaign missing" },
};

function localizeBlockingCode(locale: DashboardLocale, code: string): string {
  const entry = BLOCKING_CODE_LABELS[code];
  return entry ? (locale === "hu" ? entry.hu : entry.en) : code;
}

function localizeBlockingDetail(
  locale: DashboardLocale,
  reason: JourneyLikeBlockingReason,
): string | undefined {
  if (!reason.detail) return undefined;
  // The detail strings from state.ts contain dynamic values — localize the known patterns
  const d = reason.detail;
  switch (reason.code) {
    case "OBSERVER_RESPONSES_PENDING": {
      const m = d.match(/^(\d+)/);
      const count = m ? m[1] : "?";
      return txt(locale, `${count} observer meghívás még függőben.`, d);
    }
    case "TEAM_MEMBERSHIP_MISSING":
      if (d.includes("waiting for acceptance")) {
        const m = d.match(/^(\d+)/);
        return txt(locale, `${m?.[1] ?? "?"} csatlakozási meghívó elfogadásra vár.`, d);
      }
      if (d.includes("not set up")) {
        return txt(locale, "A csapatmunkaterület még nincs beállítva.", d);
      }
      return undefined;
    case "MIN_TEAM_SIZE_NOT_MET": {
      const m = d.match(/(\d+)/);
      return txt(locale, `Legalább ${m?.[1] ?? "3"} csapattag szükséges.`, d);
    }
    case "TEAM_MEMBER_INVITES_PENDING": {
      const m = d.match(/^(\d+)/);
      return txt(locale, `${m?.[1] ?? "?"} meghívó függőben.`, d);
    }
    case "TEAM_MEMBER_ASSESSMENTS_PENDING":
    case "ORG_MEMBER_ASSESSMENTS_PENDING": {
      const m = d.match(/^(\d+)\/(\d+)/);
      return txt(locale, `${m?.[1] ?? "?"}/${m?.[2] ?? "?"} kész az insighthoz.`, d);
    }
    default:
      return reason.detail;
  }
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
      title: localizeBlockingCode(locale, reason.code),
      description: localizeBlockingDetail(locale, reason) ?? txt(locale, "Továbblépéshez szükséges feltétel.", "A condition must be met to progress."),
    })) ?? [];

  return {
    scope: "self",
    journeyStage: currentStage,
    heroSummary: {
      eyebrow: txt(locale, "Saját iránytű", "Self cockpit"),
      title: displayName,
      summary: txt(
        locale,
        "A saját képed készen áll. Innen mélyítheted observer visszajelzéssel, és ha szeretnéd, csapat- vagy szervezeti nézetbe is továbbviheted.",
        "Your self insight is ready. You can deepen it with observer feedback, and optionally expand to team or org views.",
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
      title: txt(locale, "Figyelmet igényel", "Needs attention"),
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
      // Teljes kitöltésnél kvalitatív összefoglaló — a számok az Élő
      // pillanatkép gyűrűkben élnek, itt nem ismételjük (akciólista #14).
      summary:
        input.completedCount === input.memberCount && input.memberCount > 0
          ? txt(
              input.locale,
              "Mindenki kitöltötte az önértékelést — a csapatkép él.",
              "Everyone has completed the assessment — the team picture is live.",
            )
          : txt(
              input.locale,
              `${input.memberCount} tagból ${input.completedCount} kész, ${input.waitingCount} várakozik.`,
              `${input.completedCount} of ${input.memberCount} members are done, ${input.waitingCount} are waiting.`,
            ),
      // Egyetlen állapot-chip — a tag-szám és a kitöltési % a hero
      // pillanatkép-kártyáin már látszik, a chipsor csak duplikálta.
      chips: [
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
      title: txt(input.locale, "Figyelmet igényel", "Needs attention"),
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
  const heroSummary =
    input.pendingAttentionCount > 0
      ? txt(
          input.locale,
          `${input.teamsReadyCount}/${input.teamCount} csapatkép kész. Most ${input.pendingAttentionCount} nyitott teendő igényel figyelmet. Következő lépés: zárd a nyitott pontokat, majd indítsd a javasolt akciót.`,
          `${input.teamsReadyCount}/${input.teamCount} team insights are ready. Right now ${input.pendingAttentionCount} open tasks need attention. Next step: close the open items, then run the suggested action.`,
        )
      : txt(
          input.locale,
          `${input.teamsReadyCount}/${input.teamCount} csapatkép kész, a szervezeti állapot stabil. Következő lépés: haladj tovább a javasolt következő akcióval.`,
          `${input.teamsReadyCount}/${input.teamCount} team insights are ready and the org state is stable. Next step: continue with the suggested action.`,
        );

  return {
    scope: "org",
    heroSummary: {
      eyebrow: txt(input.locale, "Szervezeti cockpit", "Organization cockpit"),
      title: input.orgName,
      summary: heroSummary,
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
        label: txt(input.locale, "Figyelmet igényel", "Needs attention"),
        value: String(input.pendingAttentionCount),
        sub: txt(
          input.locale,
          input.pendingAttentionCount > 0 ? "Ezeket zárd le a következő szervezeti lépés előtt." : "Nincs azonnali teendő.",
          input.pendingAttentionCount > 0 ? "Close these before the next organization step." : "No immediate action needed.",
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
      title: txt(input.locale, "Figyelmet igényel", "Needs attention"),
      summary:
        input.riskItems.length > 0
          ? txt(
              input.locale,
              "Először ezeket a pontokat zárd le, utána jöhet a következő lépés.",
              "Close these items first, then continue with the next step.",
            )
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
