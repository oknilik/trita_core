import type { Locale } from "@/lib/i18n";

export interface MembershipProfileFormInput {
  username: string;
  gender: string;
  birthYear: string;
  consent: boolean;
}

export interface MembershipProfileValidationOptions {
  requireConsent?: boolean;
  currentYear?: number;
  locale?: Locale;
}

export interface MembershipJoinApiResponse {
  ok?: boolean;
  inviteState?: string;
  nextPath?: string;
  error?: string;
  details?: {
    missingFields?: string[];
  };
}

const DEFAULT_SUBMIT_ERROR: Record<Locale, string> = {
  hu: "Hiba történt, kérjük próbáld újra.",
  en: "Something went wrong. Please try again.",
};

const MEMBERSHIP_GENDER_OPTIONS_BY_LOCALE: Record<
  Locale,
  ReadonlyArray<{ value: string; label: string }>
> = {
  hu: [
    { value: "male", label: "Férfi" },
    { value: "female", label: "Nő" },
    { value: "other", label: "Egyéb" },
    { value: "prefer_not_to_say", label: "Nem kívánom megadni" },
  ],
  en: [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
  ],
} as const;

export const MEMBERSHIP_GENDER_OPTIONS =
  MEMBERSHIP_GENDER_OPTIONS_BY_LOCALE.hu;

export function getMembershipGenderOptions(locale: Locale) {
  return MEMBERSHIP_GENDER_OPTIONS_BY_LOCALE[locale];
}

export function getBirthYearBounds(currentYear = new Date().getFullYear()) {
  return {
    minBirthYear: currentYear - 100,
    maxBirthYear: currentYear - 16,
  };
}

export function validateMembershipProfileForm(
  input: MembershipProfileFormInput,
  options: MembershipProfileValidationOptions = {},
): Record<string, string> {
  const locale = options.locale ?? "hu";
  const { minBirthYear, maxBirthYear } = getBirthYearBounds(options.currentYear);
  const errors: Record<string, string> = {};

  const username = input.username.trim();
  if (username.length < 2) {
    errors.username =
      locale === "hu"
        ? "Legalább 2 karakter szükséges"
        : "At least 2 characters are required";
  } else if (username.length > 20) {
    errors.username =
      locale === "hu"
        ? "Maximum 20 karakter"
        : "Maximum 20 characters";
  }

  if (!input.gender) {
    errors.gender = locale === "hu" ? "Kérjük válassz" : "Please choose one";
  }

  const year = Number(input.birthYear);
  if (
    !input.birthYear ||
    input.birthYear.length !== 4 ||
    Number.isNaN(year) ||
    year < minBirthYear ||
    year > maxBirthYear
  ) {
    errors.birthYear =
      locale === "hu"
        ? `${minBirthYear}–${maxBirthYear} között`
        : `Between ${minBirthYear} and ${maxBirthYear}`;
  }

  if (options.requireConsent && !input.consent) {
    errors.consent =
      locale === "hu"
        ? "A hozzájárulás szükséges"
        : "Consent is required";
  }

  return errors;
}

function parseJsonSafely<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function submitMembershipProfile(payload: {
  username: string;
  gender: string;
  birthYear: number;
  consentedAt: string;
  country?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/profile/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) return { ok: true };

  const parsed = parseJsonSafely<{ error?: string }>(await res.text());
  return { ok: false, error: parsed?.error ?? "PROFILE_SAVE_FAILED" };
}

export async function submitMembershipJoin(
  endpoint: "/api/team/join" | "/api/org/join",
  inviteId: string,
): Promise<{ ok: true; nextPath: string } | { ok: false; error: string; details?: MembershipJoinApiResponse["details"] }> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inviteId }),
  });

  const payload = parseJsonSafely<MembershipJoinApiResponse>(await res.text());

  if (!res.ok) {
    return {
      ok: false,
      error: payload?.error ?? "JOIN_FAILED",
      details: payload?.details,
    };
  }

  if (!payload?.nextPath) {
    return {
      ok: false,
      error: "JOIN_NEXT_PATH_MISSING",
      details: payload?.details,
    };
  }

  return {
    ok: true,
    nextPath: payload.nextPath,
  };
}

export function getMembershipSubmitErrorMessage(
  errorCode?: string,
  locale: Locale = "hu",
): string {
  if (errorCode === "PROFILE_INCOMPLETE") {
    return locale === "hu"
      ? "Előbb töltsd ki a profil adataidat a csatlakozáshoz."
      : "Complete your profile details before joining.";
  }
  if (errorCode === "INVITE_NOT_FOUND") {
    return locale === "hu"
      ? "A meghívó már nem érvényes."
      : "This invitation is no longer valid.";
  }
  if (errorCode === "ALREADY_IN_ORG") {
    return locale === "hu"
      ? "Már van aktív szervezeti tagságod."
      : "You already have an active organization context.";
  }
  if (errorCode === "INVITE_EMAIL_MISMATCH") {
    return locale === "hu"
      ? "Ez a meghívó egy másik email-címre szól. Jelentkezz be azzal a fiókkal, amelyre a meghívót kaptad."
      : "This invitation was sent to a different email address. Sign in with the account it was sent to.";
  }
  return DEFAULT_SUBMIT_ERROR[locale];
}
