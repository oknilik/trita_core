import { createHash } from "node:crypto";

/**
 * Az esemény KONTEXTUSÁNAK kiszámítása — tiszta függvények, I/O nélkül,
 * hogy unit-teszttel őrizhetők legyenek.
 *
 * Itt dől el a rendszer két adatvédelmi ígérete:
 *   1. az útvonalból SOHA nem kerül token/azonosító az adatbázisba
 *      (`normalizePath`),
 *   2. a látogató azonosítója NAPI ROTÁLÓ pszeudonim, amit nem tárolunk
 *      eszközön és nem lehet visszafejteni (`computeVisitorRef`).
 */

// ─────────────────────────────────────────────────────────────────────
// Útvonal-normalizálás
// ─────────────────────────────────────────────────────────────────────

/**
 * Token-/azonosító-tartalmú útvonal-prefixek → sablon.
 *
 * A leghosszabb egyezés nyer, ezért a lista a specifikusabbtól halad az
 * általánosabb felé. Ami itt nincs, arra a generikus id-felismerés fut.
 */
const PATH_TEMPLATES: { prefix: string; template: string }[] = [
  { prefix: "/interaction/compare/", template: "/interaction/compare/[token]" },
  { prefix: "/join/org/", template: "/join/org/[inviteId]" },
  { prefix: "/join/", template: "/join/[token]" },
  { prefix: "/observe/", template: "/observe/[token]" },
  { prefix: "/share/", template: "/share/[token]" },
  { prefix: "/apply/", template: "/apply/[token]" },
  { prefix: "/hiring/", template: "/hiring/[orgId]" },
];

/**
 * Útvonal-szegmensek, amelyek után egy AZONOSÍTÓ jön, de a mögötte lévő
 * al-útvonal (pl. `/settings`) megőrzendő — abból derül ki, melyik felületet
 * használják.
 */
const ID_AFTER_SEGMENT = new Set(["team", "org", "candidates", "campaigns", "members"]);

/** Tartalom-útvonalak, ahol a slug ÉRTÉK (nem személyes adat), ezért marad. */
const KEEP_SLUG_PREFIXES = ["/blog/"];

const CUID_LIKE = /^c[a-z0-9]{20,}$/i;
const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LONG_OPAQUE = /^[A-Za-z0-9_-]{16,}$/;

function looksLikeIdentifier(segment: string): boolean {
  if (CUID_LIKE.test(segment)) return true;
  if (UUID_LIKE.test(segment)) return true;
  // Hosszú, vegyes karakterű szelet — token-gyanús. A tisztán kisbetűs,
  // kötőjeles slugot (blog-cikk) NEM ejtjük ide.
  if (LONG_OPAQUE.test(segment) && /[A-Z0-9]/.test(segment)) return true;
  return false;
}

/** Az útvonal maximális tárolt hossza — a többit levágjuk. */
const MAX_PATH_LENGTH = 120;

/**
 * Nyers útvonalból tárolható, normalizált útvonal.
 *
 * - a query stringet ELDOBJA (az UTM külön mezőkbe megy),
 * - a token-alapú útvonalakat sablonra cseréli,
 * - az azonosító-gyanús szegmenseket `[id]`-re cseréli,
 * - a blog-slugot megtartja (tartalom-azonosító).
 */
export function normalizePath(rawPath: string | null | undefined): string | null {
  if (!rawPath) return null;

  // Csak az útvonal-rész; a query és a fragment sosem kerül tárolásra.
  let path = rawPath.split("?")[0].split("#")[0].trim();
  if (!path.startsWith("/")) path = `/${path}`;
  // Záró perjel egységesítése (a gyökér kivételével)
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  for (const { prefix, template } of PATH_TEMPLATES) {
    if (path.startsWith(prefix)) return template;
  }

  for (const prefix of KEEP_SLUG_PREFIXES) {
    if (path.startsWith(prefix)) {
      const slug = path.slice(prefix.length).split("/")[0];
      return slug ? `${prefix}${slug}`.slice(0, MAX_PATH_LENGTH) : prefix.slice(0, -1);
    }
  }

  const segments = path.split("/").filter(Boolean);
  const normalized = segments.map((segment, index) => {
    const previous = index > 0 ? segments[index - 1] : null;
    if (previous && ID_AFTER_SEGMENT.has(previous)) return "[id]";
    if (looksLikeIdentifier(segment)) return "[id]";
    return segment;
  });

  const result = normalized.length ? `/${normalized.join("/")}` : "/";
  return result.slice(0, MAX_PATH_LENGTH);
}

// ─────────────────────────────────────────────────────────────────────
// Látogató-azonosító
// ─────────────────────────────────────────────────────────────────────

/** Dev-fallback só. Élesben SOHA nem ez a helyes érték. */
export const DEV_FALLBACK_SALT = "trita-dev-analytics-salt";

/**
 * Be van-e állítva a valódi só (`ANALYTICS_SALT`)?
 *
 * A rendszer só nélkül is MŰKÖDIK — szándékosan: a mérés soha nem áll az
 * üzemeltetés útjába. De ilyenkor a fallback só publikus, tehát a napi
 * látogató-álnév KITALÁLHATÓ egy ismert IP + böngésző párból, és az
 * adatvédelmi tájékoztatóban vállalt pszeudonimitás nem tartható.
 *
 * Ezért kell látnia valakinek:
 *   · szerver-log: egyszeri figyelmeztetés indulásonként (`server.ts`),
 *   · admin-felület: állandó, látható sáv az Analitika fülön.
 * A második a lényegesebb — egy logsort senki nem olvas el.
 *
 * Itt él, és nem a `server.ts`-ben, mert az `import "server-only"`-t hordoz,
 * amit unit-tesztből nem lehet betölteni; ez viszont tiszta env-olvasás.
 */
export function isAnalyticsSaltConfigured(): boolean {
  return Boolean(process.env.ANALYTICS_SALT?.trim());
}

/**
 * Napi rotáló pszeudonim látogató-azonosító.
 *
 * `sha256(salt + "|" + YYYY-MM-DD + "|" + ip + "|" + userAgent)`, hex,
 * 32 karakterre vágva.
 *
 * MIÉRT ÍGY:
 * - **Nincs eszköz-oldali tárolás** → nem esik az ePrivacy hozzájárulási
 *   kötelezettsége alá, tehát nem kell süti-elfogadó sáv.
 * - **Naponta rotál** → holnap ugyanaz a látogató más ref alatt jelenik meg,
 *   így hosszú távú profil nem épül. Ára: több napon átívelő attribúció
 *   nincs (tudatos döntés, ld. analytics-plan-2026-08.md IV.2).
 * - **Az IP-t soha nem tároljuk**, csak a hash bemenete — a hash nem
 *   fordítható vissza a titok ismerete nélkül, és a titok nem kerül DB-be.
 *
 * A `salt` az `ANALYTICS_SALT` env. Ha hiányzik, dev-fallback lép be (a
 * hívó figyelmeztet) — élesben beállítandó, mert enélkül a hash kitalálható.
 */
export function computeVisitorRef(input: {
  salt: string;
  /** ISO dátum (YYYY-MM-DD) UTC szerint. */
  day: string;
  ip: string;
  userAgent: string;
}): string {
  return createHash("sha256")
    .update(`${input.salt}|${input.day}|${input.ip}|${input.userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

/** UTC nap (YYYY-MM-DD) — a visitorRef rotációs kulcsa. */
export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────
// Eszköz- és forrás-osztályozás
// ─────────────────────────────────────────────────────────────────────

export type DeviceClass = "mobile" | "tablet" | "desktop";

/**
 * Durva eszköz-osztály a User-Agentből. SZÁNDÉKOSAN durva: három vödör
 * elég a „mobilon másképp viselkednek" kérdéshez, és nem visz minket az
 * eszköz-ujjlenyomat felé.
 */
export function classifyDevice(userAgent: string | null | undefined): DeviceClass {
  const ua = (userAgent ?? "").toLowerCase();
  if (/ipad|tablet|playbook|silk|android(?!.*mobile)/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/.test(ua)) return "mobile";
  return "desktop";
}

/**
 * Ismert bot/crawler? A botok forgalma torzítja a tölcsért — nem mérjük.
 * (A lista nem teljes és nem is lehet az; a cél a nagy tömeg kiszűrése.)
 */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return true; // UA nélküli kérés: gépi
  return /bot|crawler|spider|crawling|headless|preview|monitor|lighthouse|pingdom|slurp|curl|wget|python-requests|axios|node-fetch/.test(
    ua,
  );
}

/** Csak a hivatkozó HOST — teljes URL soha (az query-t is hordozhatna). */
export function referrerHost(referrer: string | null | undefined, selfHost?: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).host.toLowerCase();
    if (!host) return null;
    // A saját oldalunkon belüli navigáció nem „forrás"
    if (selfHost && host === selfHost.toLowerCase()) return null;
    return host.slice(0, 120);
  } catch {
    return null;
  }
}

/** UTM-paraméterek kinyerése egy URL-ből vagy query stringből. */
export function extractUtm(rawUrl: string | null | undefined): {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
} {
  const empty = { utmSource: null, utmMedium: null, utmCampaign: null };
  if (!rawUrl) return empty;

  let params: URLSearchParams;
  try {
    params = rawUrl.includes("?")
      ? new URLSearchParams(rawUrl.slice(rawUrl.indexOf("?") + 1))
      : new URLSearchParams(rawUrl);
  } catch {
    return empty;
  }

  const clean = (value: string | null) => {
    if (!value) return null;
    const trimmed = value.trim().slice(0, 64);
    return trimmed.length ? trimmed : null;
  };

  return {
    utmSource: clean(params.get("utm_source")),
    utmMedium: clean(params.get("utm_medium")),
    utmCampaign: clean(params.get("utm_campaign")),
  };
}

/**
 * Kliens IP kinyerése a proxy-fejlécekből.
 *
 * Csak a `visitorRef` hash bemenete — sehol nem tárolódik.
 */
export function clientIpFromHeaders(get: (name: string) => string | null): string {
  const forwarded = get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return get("x-real-ip")?.trim() || get("x-vercel-forwarded-for")?.trim() || "unknown";
}
