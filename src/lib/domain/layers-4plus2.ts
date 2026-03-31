export type LayerLocale = "hu" | "en";
export type LayerType = "core" | "plus";

export type ProductLayerId =
  | "personality"
  | "team_role"
  | "strength_profile"
  | "psychological_safety"
  | "values"
  | "conflict_management";

export type LayerCompletionRuleKind =
  | "SELF_ASSESSMENT_STARTED"
  | "SELF_ASSESSMENT_COMPLETED"
  | "BELBIN_STARTED"
  | "BELBIN_COMPLETED"
  | "STRENGTH_PROFILE_AVAILABLE"
  | "OBSERVER_FEEDBACK_RECEIVED"
  | "TEAM_INSIGHTS_READY"
  | "ORG_CAMPAIGN_ACTIVE"
  | "VALUES_MODULE_STARTED"
  | "VALUES_MODULE_COMPLETED"
  | "CONFLICT_MODULE_STARTED"
  | "CONFLICT_MODULE_COMPLETED";

export type LayerCompletionStatus =
  | "LOCKED"
  | "AVAILABLE"
  | "IN_PROGRESS"
  | "COMPLETED";

export type LayerSurfaceScope = "self" | "team" | "org";
export type LayerRenderingChannel = "results" | "dashboard";

export interface LayerCompletionRule {
  kind: LayerCompletionRuleKind;
}

export interface LayerRenderingMap {
  results: {
    surface: "self" | "team" | "org";
    sectionKey: string;
  };
  dashboard: {
    surface: "self" | "team" | "org";
    sectionKey: string;
  };
}

export interface ProductLayerConfig {
  id: ProductLayerId;
  slug: string;
  type: LayerType;
  label: { hu: string; en: string };
  description: { hu: string; en: string };
  order: number;
  dependencies: ProductLayerId[];
  progressStartRules?: LayerCompletionRule[];
  completionRules: LayerCompletionRule[];
  renderingMap: LayerRenderingMap;
}

export interface LayerCompletionSignals {
  hasSelfAssessmentStarted?: boolean;
  hasSelfAssessment: boolean;
  hasBelbinStarted?: boolean;
  hasBelbin: boolean;
  hasStrengthProfile: boolean;
  hasObserverFeedback: boolean;
  hasTeamInsights: boolean;
  hasOrgCampaign: boolean;
  hasValuesLayerStarted?: boolean;
  hasValuesLayer: boolean;
  hasConflictLayerStarted?: boolean;
  hasConflictLayer: boolean;
  hasPlusAccess: boolean;
}

export interface ProductLayerStatus {
  id: ProductLayerId;
  slug: string;
  type: LayerType;
  label: string;
  description: string;
  order: number;
  dependencies: ProductLayerId[];
  completionRules: LayerCompletionRule[];
  renderingMap: LayerRenderingMap;
  status: LayerCompletionStatus;
}

export const PRODUCT_LAYERS_4_PLUS_2: readonly ProductLayerConfig[] = [
  {
    id: "personality",
    slug: "personality",
    type: "core",
    label: { hu: "Személyiség", en: "Personality" },
    description: {
      hu: "Pszichometriai alapréteg: a személyes működési mintázat.",
      en: "Psychometric base layer: your personal operating pattern.",
    },
    order: 1,
    dependencies: [],
    progressStartRules: [{ kind: "SELF_ASSESSMENT_STARTED" }],
    completionRules: [{ kind: "SELF_ASSESSMENT_COMPLETED" }],
    renderingMap: {
      results: { surface: "self", sectionKey: "profile-core" },
      dashboard: { surface: "self", sectionKey: "self-overview" },
    },
  },
  {
    id: "team_role",
    slug: "team-role",
    type: "core",
    label: { hu: "Csapatszerep", en: "Team role" },
    description: {
      hu: "Belbin-szint: hogyan járulsz hozzá a csapat működéséhez.",
      en: "Belbin layer: how you contribute to team execution.",
    },
    order: 2,
    dependencies: ["personality"],
    progressStartRules: [{ kind: "BELBIN_STARTED" }],
    completionRules: [{ kind: "BELBIN_COMPLETED" }],
    renderingMap: {
      results: { surface: "self", sectionKey: "belbin-roles" },
      dashboard: { surface: "team", sectionKey: "team-role-map" },
    },
  },
  {
    id: "strength_profile",
    slug: "strength-profile",
    type: "core",
    label: { hu: "Erősségprofil", en: "Strength profile" },
    description: {
      hu: "A kiemelkedő működési dimenziók és fejlesztési fókuszok.",
      en: "Dominant dimensions and development focus areas.",
    },
    order: 3,
    dependencies: ["personality"],
    progressStartRules: [{ kind: "SELF_ASSESSMENT_STARTED" }],
    completionRules: [{ kind: "STRENGTH_PROFILE_AVAILABLE" }],
    renderingMap: {
      results: { surface: "self", sectionKey: "strength-focus" },
      dashboard: { surface: "self", sectionKey: "strength-snapshot" },
    },
  },
  {
    id: "psychological_safety",
    slug: "psychological-safety",
    type: "core",
    label: { hu: "Pszichológiai biztonság", en: "Psychological safety" },
    description: {
      hu: "Bizalom és visszajelzési biztonság a team/org működésben.",
      en: "Trust and feedback safety across team/org collaboration.",
    },
    order: 4,
    dependencies: ["personality", "team_role"],
    progressStartRules: [{ kind: "OBSERVER_FEEDBACK_RECEIVED" }],
    completionRules: [
      { kind: "OBSERVER_FEEDBACK_RECEIVED" },
      { kind: "TEAM_INSIGHTS_READY" },
    ],
    renderingMap: {
      results: { surface: "team", sectionKey: "observer-bridge" },
      dashboard: { surface: "team", sectionKey: "safety-signal" },
    },
  },
  {
    id: "values",
    slug: "values",
    type: "plus",
    label: { hu: "Értékek", en: "Values" },
    description: {
      hu: "A döntési és együttműködési értékpreferenciák mélyítő rétege.",
      en: "Deepening layer for decision and collaboration values.",
    },
    order: 5,
    dependencies: ["strength_profile", "psychological_safety"],
    progressStartRules: [{ kind: "VALUES_MODULE_STARTED" }],
    completionRules: [{ kind: "VALUES_MODULE_COMPLETED" }],
    renderingMap: {
      results: { surface: "self", sectionKey: "values-module" },
      dashboard: { surface: "org", sectionKey: "values-trends" },
    },
  },
  {
    id: "conflict_management",
    slug: "conflict-management",
    type: "plus",
    label: { hu: "Konfliktuskezelés", en: "Conflict management" },
    description: {
      hu: "A feszültségek kezelésének és feloldásának fejlett rétege.",
      en: "Advanced layer for handling and resolving tensions.",
    },
    order: 6,
    dependencies: ["psychological_safety", "values"],
    progressStartRules: [{ kind: "CONFLICT_MODULE_STARTED" }],
    completionRules: [{ kind: "CONFLICT_MODULE_COMPLETED" }],
    renderingMap: {
      results: { surface: "team", sectionKey: "conflict-playbook" },
      dashboard: { surface: "org", sectionKey: "conflict-risks" },
    },
  },
] as const;

function satisfiesRule(
  rule: LayerCompletionRule,
  signals: LayerCompletionSignals,
): boolean {
  switch (rule.kind) {
    case "SELF_ASSESSMENT_STARTED":
      return Boolean(signals.hasSelfAssessmentStarted);
    case "SELF_ASSESSMENT_COMPLETED":
      return signals.hasSelfAssessment;
    case "BELBIN_STARTED":
      return Boolean(signals.hasBelbinStarted);
    case "BELBIN_COMPLETED":
      return signals.hasBelbin;
    case "STRENGTH_PROFILE_AVAILABLE":
      return signals.hasStrengthProfile;
    case "OBSERVER_FEEDBACK_RECEIVED":
      return signals.hasObserverFeedback;
    case "TEAM_INSIGHTS_READY":
      return signals.hasTeamInsights;
    case "ORG_CAMPAIGN_ACTIVE":
      return signals.hasOrgCampaign;
    case "VALUES_MODULE_STARTED":
      return Boolean(signals.hasValuesLayerStarted);
    case "VALUES_MODULE_COMPLETED":
      return signals.hasValuesLayer;
    case "CONFLICT_MODULE_STARTED":
      return Boolean(signals.hasConflictLayerStarted);
    case "CONFLICT_MODULE_COMPLETED":
      return signals.hasConflictLayer;
    default:
      return false;
  }
}

function resolveLayerStatus(
  layer: ProductLayerConfig,
  signals: LayerCompletionSignals,
  completedSet: Set<ProductLayerId>,
): LayerCompletionStatus {
  const dependenciesDone = layer.dependencies.every((dependency) =>
    completedSet.has(dependency),
  );
  const hasAccess = layer.type === "plus" ? signals.hasPlusAccess : true;

  if (!dependenciesDone || !hasAccess) return "LOCKED";

  const completed = layer.completionRules.every((rule) => satisfiesRule(rule, signals));
  if (completed) return "COMPLETED";

  const hasStartedByExplicitRule = (layer.progressStartRules ?? []).some((rule) =>
    satisfiesRule(rule, signals),
  );
  const hasPartialCompletionSignals = layer.completionRules.some((rule) =>
    satisfiesRule(rule, signals),
  );

  if (hasStartedByExplicitRule || hasPartialCompletionSignals) {
    return "IN_PROGRESS";
  }

  return "AVAILABLE";
}

export function evaluateProductLayers(
  locale: LayerLocale,
  signals: LayerCompletionSignals,
): ProductLayerStatus[] {
  const sorted = [...PRODUCT_LAYERS_4_PLUS_2].sort((a, b) => a.order - b.order);
  const completedSet = new Set<ProductLayerId>();
  const evaluated: ProductLayerStatus[] = [];

  for (const layer of sorted) {
    const status = resolveLayerStatus(layer, signals, completedSet);
    if (status === "COMPLETED") completedSet.add(layer.id);

    evaluated.push({
      ...layer,
      label: layer.label[locale],
      description: layer.description[locale],
      status,
    });
  }

  return evaluated;
}

export function evaluateProductLayersForScope(
  locale: LayerLocale,
  signals: LayerCompletionSignals,
  channel: LayerRenderingChannel,
  scope: LayerSurfaceScope,
): ProductLayerStatus[] {
  return evaluateProductLayers(locale, signals).filter(
    (layer) => layer.renderingMap[channel].surface === scope,
  );
}
