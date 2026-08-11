import { createHmac, timingSafeEqual } from "node:crypto";

// ─────────────────────────────────────────────────────────────────────
// Observer-draft „birtoklás-bizonyíték" cookie (motor-audit: logged-out
// draft-szivárgás). A KÜLSŐ (observerProfileId nélküli) meghívó tokenje
// bearer-token: a linket az ÉRTÉKELT birtokolja és osztja meg — ha a
// szerver-oldali draftot bárkinek kiadnánk, aki a tokent ismeri, az
// értékelt kijelentkezve elolvashatná a nevesített rater folyamatban lévő
// nyers válaszait. Séma-változtatás nélkül ezért a draft KIADÁSÁT ahhoz a
// böngészőhöz kötjük, amelyik írta: a draft-mentés (POST /api/observer/
// draft) httpOnly cookie-t állít, aminek értéke a meghívó-id HMAC-je egy
// szerver-oldali titokkal — a draftot csak érvényes cookie-val adjuk vissza.
//
// TUDATOS TRADE-OFF: eszköz-/böngészőváltásnál (vagy cookie-törlés után) a
// kitöltő a szerver-draftját nem tudja folytatni — elölről kezdi (a
// localStorage-mentés az adott böngészőben így is él). Ez elfogadható ár a
// rater-válaszok bizalmasságáért; a nevesített (belsős) meghívó viselkedése
// változatlan: ott a bejelentkezett címzett auth alapján kapja a draftot.
// ─────────────────────────────────────────────────────────────────────

// Meglévő szerver-oldali titkot használunk újra (nincs új env-változó).
// Dev-fallback: publikus konstans — dev-ben a bizonyíték kitalálható, de ott
// nincs valós rater-adat. Élesben az ANALYTICS_SALT kötelező env
// (.env.example), így a fallback ott nem él. (Minta: analytics/server.ts
// DEV_FALLBACK_SALT.)
const DEV_FALLBACK_SECRET = "trita-dev-observer-draft-secret";

function resolveDraftSecret(): string {
  return process.env.ANALYTICS_SALT?.trim() || DEV_FALLBACK_SECRET;
}

/** A meghívóhoz tartozó draft-cookie neve. */
export function observerDraftCookieName(invitationId: string): string {
  return `trita_obsdraft_${invitationId}`;
}

/**
 * A cookie értéke: HMAC-SHA256(invitationId, titok) hexben. Az érték nem
 * hordoz adatot — csak azt bizonyítja, hogy a szerver állította be ehhez a
 * meghívóhoz (a kliens nem tudja más meghívóra hamisítani).
 */
export function observerDraftCookieValue(invitationId: string): string {
  return createHmac("sha256", resolveDraftSecret())
    .update(invitationId)
    .digest("hex");
}

/** Konstans idejű összevetés — a cookie-érték nem találgatható ki bájtonként. */
export function isValidObserverDraftCookie(
  invitationId: string,
  cookieValue: string | null | undefined,
): boolean {
  if (!cookieValue) return false;
  const expected = Buffer.from(observerDraftCookieValue(invitationId), "utf8");
  const actual = Buffer.from(cookieValue, "utf8");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
