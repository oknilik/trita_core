import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import {
  acceptsOrigin,
  parseEventProps,
  type AnalyticsEventName,
  type AnalyticsEventProps,
} from "@/lib/analytics/events";
import {
  classifyDevice,
  clientIpFromHeaders,
  computeVisitorRef,
  extractUtm,
  isBotUserAgent,
  normalizePath,
  referrerHost,
  utcDay,
} from "@/lib/analytics/context";

const log = createLogger("analytics");

/**
 * SZERVER-OLDALI eseményrögzítés.
 *
 * Ez a pontosabbik fele a rendszernek: az itt rögzített események ott
 * keletkeznek, ahol a dolog TÉNYLEGESEN megtörtént (DB-írás sikerága), nem
 * kattintásból következtetve. Nem blokkolható ad-blockerrel, nem hamisítható,
 * és nem igényel eszközön tárolt azonosítót.
 *
 * KÉT SZABÁLY, amit soha nem szegünk meg:
 *   1. **A mérés nem törhet el felhasználói folyamatot.** Minden hiba
 *      elnyelve, logolva. Ha az analitika elhasal, a felhasználó ebből
 *      semmit nem vesz észre.
 *   2. **Nem várunk rá.** A hívó nem `await`-eli (fire-and-forget); a
 *      függvény ezért maga kezeli a Promise-t.
 */

/** Kapcsoló: `ANALYTICS_ENABLED=0` esetén a rendszer némán kikapcsol. */
export function isAnalyticsEnabled(): boolean {
  return process.env.ANALYTICS_ENABLED !== "0";
}

/**
 * A napi rotáló hash sója. Élesben KÖTELEZŐ beállítani (`ANALYTICS_SALT`) —
 * enélkül a látogató-azonosító kitalálható lenne egy ismert IP+UA párból.
 */
export function resolveSalt(): string {
  const fromEnv = process.env.ANALYTICS_SALT?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    log.warn(
      { event: "analytics.salt_missing" },
      "ANALYTICS_SALT nincs beállítva — a látogató-azonosító kitalálható",
    );
  }
  return "trita-dev-analytics-salt";
}

export interface ServerEventContext {
  /** UserProfile.id, ha ismert. Profil-törléskor NULL-ra állítjuk. */
  userProfileId?: string | null;
  /** anon | member | manager | admin | consultant | candidate */
  roleClass?: string | null;
  /** Ha a hívó pontosabban tudja, mint a kérés-fejléc. */
  path?: string | null;
  locale?: string | null;
}

interface RequestContext {
  visitorRef: string;
  path: string | null;
  deviceClass: string | null;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  isBot: boolean;
}

/**
 * Kérés-kontextus a fejlécekből. Kérés-kontextuson kívül (cron,
 * háttérfeladat) `null` — ilyenkor szintetikus látogató-ref képződik.
 */
async function readRequestContext(): Promise<RequestContext | null> {
  try {
    const h = await headers();
    const get = (name: string) => h.get(name);
    const userAgent = get("user-agent");
    const url = get("referer");
    const path = get("x-pathname");

    return {
      visitorRef: computeVisitorRef({
        salt: resolveSalt(),
        day: utcDay(new Date()),
        ip: clientIpFromHeaders(get),
        userAgent: userAgent ?? "",
      }),
      path: normalizePath(path),
      deviceClass: classifyDevice(userAgent),
      referrerHost: referrerHost(url, get("host") ?? undefined),
      ...extractUtm(url),
      isBot: isBotUserAgent(userAgent),
    };
  } catch {
    return null;
  }
}

/**
 * Esemény rögzítése szerver-oldalról. **Ne `await`-eld** a kérés-útvonalon —
 * a függvény maga nyeli el a hibát és a késleltetést.
 *
 * ```ts
 * void trackServerEvent("inquiry.submit", { topic, source: "contact_form" });
 * ```
 */
export function trackServerEvent<N extends AnalyticsEventName>(
  name: N,
  props: AnalyticsEventProps<N>,
  context: ServerEventContext = {},
): void {
  if (!isAnalyticsEnabled()) return;

  void (async () => {
    try {
      if (!acceptsOrigin(name, "server")) {
        log.warn({ event: "analytics.origin_rejected", name }, "Szerver-oldalról nem küldhető esemény");
        return;
      }

      const parsed = parseEventProps(name, props);
      if (!parsed.ok) {
        log.warn(
          { event: "analytics.props_invalid", name, issue: parsed.issue },
          "Érvénytelen esemény-tulajdonságok",
        );
        return;
      }

      const request = await readRequestContext();
      // Bot-forgalom nem torzíthatja a tölcsért.
      if (request?.isBot) return;

      await prisma.analyticsEvent.create({
        data: {
          name,
          origin: "server",
          // Kérés-kontextuson kívül (cron) nincs látogató — az esemény
          // ilyenkor rendszer-eredetű, saját, nem rotáló refet kap.
          visitorRef: request?.visitorRef ?? "system",
          userProfileId: context.userProfileId ?? null,
          isAuthed: Boolean(context.userProfileId),
          roleClass: context.roleClass ?? null,
          path: normalizePath(context.path) ?? request?.path ?? null,
          locale: context.locale ?? null,
          deviceClass: request?.deviceClass ?? null,
          referrerHost: request?.referrerHost ?? null,
          utmSource: request?.utmSource ?? null,
          utmMedium: request?.utmMedium ?? null,
          utmCampaign: request?.utmCampaign ?? null,
          appVersion: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
          props: Object.keys(parsed.props).length ? parsed.props : undefined,
        },
      });
    } catch (error) {
      // A mérés SOHA nem törhet el felhasználói folyamatot.
      log.warn({ event: "analytics.write_failed", name, err: error }, "Esemény-írás sikertelen");
    }
  })();
}
