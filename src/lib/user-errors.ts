/**
 * Felhasználói hibák közös prezentációs szerződése.
 *
 * Az API-k stabil hibakódot adhatnak vissza, de nyers szerverüzenet vagy
 * exception.message soha nem kerülhet közvetlenül a felületre. Ez a modul
 * kizárólag i18n-kulcsot választ; a megjelenítő komponens a saját locale-jával
 * fordítja le azt.
 */

const GENERIC_ERROR_KEYS: Record<string, string> = {
  UNAUTHORIZED: "userErrors.sessionExpired",
  AUTH_REQUIRED: "userErrors.sessionExpired",
  FORBIDDEN: "userErrors.forbidden",
  NOT_FOUND: "userErrors.notFound",
  USER_NOT_FOUND: "userErrors.notFound",
  ORG_NOT_FOUND: "userErrors.notFound",
  TEAM_NOT_FOUND: "userErrors.notFound",
  INVALID_INPUT: "userErrors.invalidInput",
  INVALID_PAYLOAD: "userErrors.invalidInput",
  VALIDATION_ERROR: "userErrors.invalidInput",
  CONFLICT: "userErrors.conflict",
  RATE_LIMITED: "userErrors.rateLimited",
  TOO_MANY_REQUESTS: "userErrors.rateLimited",
  NETWORK_ERROR: "userErrors.network",
  LOAD_FAILED: "userErrors.loadFailed",
  SAVE_FAILED: "userErrors.saveFailed",
  UPDATE_FAILED: "userErrors.saveFailed",
  SEND_FAILED: "userErrors.sendFailed",
  EMAIL_SEND_FAILED: "userErrors.sendFailed",
  EMAIL_MISSING: "userErrors.emailMissing",
  INVITATION_NOT_PENDING: "userErrors.invitationNotPending",
  INVITATION_EXPIRED: "userErrors.invitationExpired",
  ASSESSMENT_ALREADY_COMPLETED: "userErrors.assessmentAlreadyCompleted",
  CAMPAIGN_PARTICIPANTS_REQUIRED: "userErrors.campaignMinimumParticipants",
  CAMPAIGN_MINIMUM_PARTICIPANTS_NOT_MET: "userErrors.campaignMinimumParticipants",
  ANONYMITY_THRESHOLD_NOT_MET: "userErrors.campaignMinimumParticipants",
};

const STATUS_ERROR_KEYS: Record<number, string> = {
  400: "userErrors.invalidInput",
  401: "userErrors.sessionExpired",
  403: "userErrors.forbidden",
  404: "userErrors.notFound",
  409: "userErrors.conflict",
  429: "userErrors.rateLimited",
};

export interface PresentUserErrorOptions {
  code?: unknown;
  status?: number;
  fallbackKey?: string;
  overrides?: Readonly<Record<string, string>>;
}

/** Csak stabil, gépi hibakódot fogadunk el; mondatot vagy stack-részletet nem. */
export function normalizeUserErrorCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim();
  return /^[A-Z][A-Z0-9_]{1,79}$/.test(code) ? code : null;
}

export function presentUserError({
  code,
  status,
  fallbackKey = "userErrors.actionFailed",
  overrides,
}: PresentUserErrorOptions = {}): string {
  const normalized = normalizeUserErrorCode(code);
  if (normalized) {
    const key = overrides?.[normalized] ?? GENERIC_ERROR_KEYS[normalized];
    if (key) return key;
  }
  if (status && STATUS_ERROR_KEYS[status]) return STATUS_ERROR_KEYS[status];
  if (status && status >= 500) return "userErrors.temporary";
  return fallbackKey;
}
