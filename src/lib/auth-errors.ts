export type AuthErrorTarget = "email" | "code" | "global";

export type AuthErrorContext =
  | "sign-in"
  | "sign-up"
  | "verify"
  | "resend"
  | "google-sign-in"
  | "google-sign-up";

export interface AuthErrorPresentation {
  target: AuthErrorTarget;
  translationKey: string;
}

interface ClerkErrorLike {
  code?: unknown;
  meta?: { paramName?: unknown };
}

interface ClerkResponseErrorLike {
  errors?: unknown;
  status?: unknown;
  name?: unknown;
  code?: unknown;
}

function firstClerkError(error: unknown): ClerkErrorLike | null {
  if (!error || typeof error !== "object") return null;
  const candidate = error as ClerkResponseErrorLike;
  if (!Array.isArray(candidate.errors)) return null;
  const first = candidate.errors[0];
  return first && typeof first === "object" ? (first as ClerkErrorLike) : null;
}

function normalizedCode(error: unknown): string {
  const apiError = firstClerkError(error);
  if (typeof apiError?.code === "string") return apiError.code.toLowerCase();
  if (error && typeof error === "object" && typeof (error as ClerkResponseErrorLike).code === "string") {
    return ((error as ClerkResponseErrorLike).code as string).toLowerCase();
  }
  return "";
}

function parameterName(error: unknown): string {
  const value = firstClerkError(error)?.meta?.paramName;
  return typeof value === "string" ? value.toLowerCase() : "";
}

function isRateLimited(error: unknown, code: string): boolean {
  const status = error && typeof error === "object" ? (error as ClerkResponseErrorLike).status : null;
  return status === 429 || code.includes("too_many") || code.includes("rate_limit");
}

function isNetworkError(error: unknown, code: string): boolean {
  if (code.includes("network") || code.includes("fetch")) return true;
  if (!(error && typeof error === "object")) return false;
  const name = (error as ClerkResponseErrorLike).name;
  return name === "TypeError" || name === "NetworkError";
}

/**
 * Clerk-hibakódot fordítási kulcsra és megjelenítési helyre képez.
 *
 * A szolgáltató `message` / `longMessage` szövege szándékosan nem része a
 * visszatérési értéknek: angol, technikai és kiadásról kiadásra változhat.
 * Az eredeti hiba ettől még naplózható a hívási helyen.
 */
export function presentAuthError(
  error: unknown,
  context: AuthErrorContext,
): AuthErrorPresentation {
  const code = normalizedCode(error);
  const param = parameterName(error);

  if (isRateLimited(error, code)) {
    return { target: "global", translationKey: "auth.errors.rateLimited" };
  }

  if (isNetworkError(error, code)) {
    return { target: "global", translationKey: "auth.errors.network" };
  }

  if (code.includes("captcha")) {
    return { target: "global", translationKey: "auth.errors.captcha" };
  }

  if (
    code.includes("identifier_not_found") ||
    code.includes("account_not_found") ||
    code.includes("user_not_found")
  ) {
    return { target: "email", translationKey: "auth.errors.accountUnavailable" };
  }

  if (
    code.includes("identifier_exists") ||
    code.includes("email_address_exists") ||
    code.includes("already_exists") ||
    code.includes("already_signed_up")
  ) {
    return { target: "email", translationKey: "auth.errors.emailExists" };
  }

  if (
    code.includes("identifier_invalid") ||
    code.includes("email_address_invalid") ||
    code.includes("email_invalid") ||
    (code.includes("param_format_invalid") && param.includes("email"))
  ) {
    return { target: "email", translationKey: "auth.errors.invalidEmail" };
  }

  if (code.includes("code_expired") || code.includes("verification_expired")) {
    return { target: "code", translationKey: "auth.errors.expiredCode" };
  }

  if (
    code.includes("code_incorrect") ||
    code.includes("code_invalid") ||
    code.includes("verification_failed") ||
    code.includes("verification_invalid")
  ) {
    return { target: "code", translationKey: "auth.errors.incorrectCode" };
  }

  if (context === "verify") {
    return { target: "code", translationKey: "auth.errors.verificationGeneric" };
  }

  const fallback: Record<AuthErrorContext, string> = {
    "sign-in": "auth.errors.signInGeneric",
    "sign-up": "auth.errors.signUpGeneric",
    verify: "auth.errors.verificationGeneric",
    resend: "auth.errors.resendGeneric",
    "google-sign-in": "auth.errors.googleSignIn",
    "google-sign-up": "auth.errors.googleSignUp",
  };

  return { target: "global", translationKey: fallback[context] };
}
