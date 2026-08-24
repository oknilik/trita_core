// ─────────────────────────────────────────────────────────────────────
// A Clerk Frontend API hostja a PUBLISHABLE KEY-ből.
//
// MIÉRT NEM KONSTANS: a kulcs instance-onként más — dev instance-nál egy
// `*.clerk.accounts.dev` aldomain, éles instance-nál a saját domainünk
// (pl. `clerk.trita.io`). Ha ezt bedrótozzuk, a prod build a FEJLESZTŐI
// instance-ra mutat: a preconnect rossz hostra nyit TLS-kapcsolatot (tehát
// lassít, nem gyorsít), kiszórja a dev-instance nevét minden látogatónak,
// és — ami a legrosszabb — a CSP nem engedi az éles Clerk-szkriptet, így az
// enforce-ra váltás a bejelentkezést törné el.
//
// A kulcs formátuma dokumentált és stabil:
//     pk_(test|live)_<base64url(frontendApiHost + "$")>
// tehát a host magából a kulcsból kiolvasható — nem kell külön env.
//
// Prisma- és React-mentes, a next.config.ts is importálja (build-időben fut).
// ─────────────────────────────────────────────────────────────────────

/** A Clerk publishable key két legális előtagja. */
const KEY_PREFIXES = ["pk_test_", "pk_live_"] as const;

/** Csak host-nak látszó értéket fogadunk el (fejléc- és CSP-injektálás ellen). */
const HOSTNAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

/**
 * A Frontend API hostja a publishable key-ből, vagy `null`, ha a kulcs
 * hiányzik / nem értelmezhető. Sosem dob: build-időben egy kivétel az egész
 * deployt megállítaná, miközben a hiány csak egy resource hint elvesztése.
 */
export function resolveClerkFrontendApiHost(
  publishableKey: string | undefined = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
): string | null {
  if (!publishableKey) return null;

  const prefix = KEY_PREFIXES.find((candidate) => publishableKey.startsWith(candidate));
  if (!prefix) return null;

  const encoded = publishableKey.slice(prefix.length);
  if (!encoded) return null;

  let decoded: string;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }

  // A kódolt érték záró `$`-t visz — ez a Clerk elválasztója, nem a hosté.
  const host = decoded.endsWith("$") ? decoded.slice(0, -1) : decoded;
  return HOSTNAME_RE.test(host) ? host : null;
}

/**
 * A CSP-be és a preconnect fejlécbe kerülő Clerk-originek.
 *
 * A két wildcard (`*.clerk.accounts.dev`, `*.clerk.com`) MARAD a feloldott
 * host mellett: dev/preview instance-oknál a Clerk több aldomaint is használ
 * (satellite, image CDN), és a `*.clerk.com` az éles instance kiszolgáló
 * oldala is. A feloldott host ezekhez ADÓDIK, nem helyettük áll.
 */
export function resolveClerkCspOrigins(
  publishableKey?: string,
): string[] {
  const host = resolveClerkFrontendApiHost(publishableKey);
  const wildcards = ["https://*.clerk.accounts.dev", "https://*.clerk.com"];
  if (!host) return wildcards;

  const origin = `https://${host}`;
  // A wildcard már fedheti (dev instance) — ilyenkor ne duplikáljunk.
  if (host.endsWith(".clerk.accounts.dev") || host.endsWith(".clerk.com")) {
    return wildcards;
  }
  return [origin, ...wildcards];
}
