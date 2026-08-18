const AUTH_ENTRY_PATHS = new Set(["/sign-in", "/sign-up", "/sign-out"]);

/**
 * Csak alkalmazáson belüli, abszolút útvonalat enged át.
 *
 * A `startsWith("/")` önmagában nem elég: a `//evil.example` protokoll-
 * relatív külső URL. A backslash és a vezérlőkarakterek böngészőnként eltérő
 * normalizálása miatt szintén tiltottak. Auth-belépőre nem térünk vissza,
 * mert abból redirect loop lenne.
 */
export function sanitizeInternalRedirect(value: string | null | undefined): string | null {
  if (!value || value !== value.trim()) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return null;

  try {
    const base = new URL("https://trita.internal");
    const parsed = new URL(value, base);
    if (parsed.origin !== base.origin) return null;
    if (AUTH_ENTRY_PATHS.has(parsed.pathname)) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

function buildAuthPath(entryPath: "/sign-in" | "/sign-up", returnTo?: string | null): string {
  const safeReturnTo = sanitizeInternalRedirect(returnTo);
  return safeReturnTo
    ? `${entryPath}?redirect_url=${encodeURIComponent(safeReturnTo)}`
    : entryPath;
}

export function buildSignInPath(returnTo?: string | null): string {
  return buildAuthPath("/sign-in", returnTo);
}

export function buildSignUpPath(returnTo?: string | null): string {
  return buildAuthPath("/sign-up", returnTo);
}
