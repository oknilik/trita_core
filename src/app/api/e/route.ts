import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import { getServerAuth } from "@/lib/auth-server";
import { getProfileCoreByClerkId } from "@/lib/profile.server";
import {
  acceptsOrigin,
  isAnalyticsEventName,
  parseEventProps,
  type ValidatedEventProps,
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
import { isAnalyticsEnabled, resolveSalt } from "@/lib/analytics/server";

/**
 * `POST /api/e` — a kliens-oldali események első felű (first-party)
 * beérkeztetője.
 *
 * RÖVID NÉV SZÁNDÉKOSAN: az `/api/analytics` vagy `/api/track` mintát több
 * ad-blocker lista szűri. Ez nem trükközés a felhasználóval szemben — a
 * mérés tartalma nyilvános (adatvédelmi tájékoztató), a GPC/DNT jelzést
 * pedig a kliens tiszteletben tartja, tehát aki nemet mond, azt nem mérjük.
 *
 * BIZTONSÁGI ÉS ADATVÉDELMI SZABÁLYOK ITT:
 * - Csak a KATALÓGUSBAN szereplő, `origin: client|both` események mennek át.
 * - A tulajdonságok zárt (`.strict()`) zod-sémán mennek keresztül: ismeretlen
 *   kulcs = eldobás. Ez a PII-védelem szerkezeti garanciája.
 * - Az útvonalat a SZERVER normalizálja (a kliens által küldött path-ból) —
 *   token soha nem kerül tárolásra.
 * - Az IP-t soha nem tároljuk; csak a napi rotáló hash bemenete.
 * - A válasz MINDIG 204, hibás bemenetre is: a végpont nem ad visszajelzést,
 *   amiből a katalógust lehetne térképezni. A hiba a szerver-logban látszik.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Egy kérésben ennyi esemény — a kliens is ennyivel kötegel. */
const MAX_EVENTS_PER_REQUEST = 20;

const bodySchema = z
  .object({
    events: z
      .array(
        z
          .object({
            name: z.string().min(1).max(64),
            props: z.record(z.unknown()).optional(),
            path: z.string().max(512).optional(),
            // A böngésző `document.referrer`-e. A szerver AZONNAL hostra
            // redukálja és eldobja a többit — teljes URL nem kerül tárolásra.
            ref: z.string().max(512).optional(),
            ts: z.number().optional(),
          })
          .strict(),
      )
      .min(1)
      .max(MAX_EVENTS_PER_REQUEST),
  })
  .strict();

/** Mindig ugyanaz a válasz — se siker, se hiba nem szivárog ki. */
const NO_CONTENT = () => new NextResponse(null, { status: 204 });

export async function POST(req: Request) {
  if (!isAnalyticsEnabled()) return NO_CONTENT();

  const log = await getRequestLogger("analytics");

  // Visszaélés-védelem a meglévő mintából. Bőkezűbb keret, mint az `api`
  // tier: egy valódi munkamenet legitim módon küld sok kötegelt eseményt.
  const rateLimited = await checkRateLimit("analytics");
  if (rateLimited) return NO_CONTENT();

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    log.warn({ event: "analytics.body_invalid" }, "Érvénytelen esemény-payload");
    return NO_CONTENT();
  }

  const h = await headers();
  const get = (name: string) => h.get(name);
  const userAgent = get("user-agent");

  // Bot-forgalom nem torzíthatja a tölcsért.
  if (isBotUserAgent(userAgent)) return NO_CONTENT();

  const visitorRef = computeVisitorRef({
    salt: resolveSalt(),
    day: utcDay(new Date()),
    ip: clientIpFromHeaders(get),
    userAgent: userAgent ?? "",
  });

  // A `referer` a küldő LAP URL-je (a beacon így küldi) — ebből jön az UTM és
  // a hivatkozó host. A teljes URL-t nem tároljuk.
  const pageUrl = get("referer");
  const utm = extractUtm(pageUrl);

  // Bejelentkezett látogató: a profil-id azért kell, hogy az események
  // JOIN-olhatók legyenek a termék-adatokkal. Profil-törléskor NULL-ozzuk.
  let userProfileId: string | null = null;
  try {
    const { userId } = await getServerAuth();
    if (userId) {
      const profile = await getProfileCoreByClerkId(userId);
      userProfileId = profile?.id ?? null;
    }
  } catch {
    // Auth-hiba nem akaszthatja meg a mérést — anonimként rögzítjük.
  }

  const deviceClass = classifyDevice(userAgent);
  const appVersion = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null;
  // A felület nyelve a meglévő nyelv-sütiből (a mérés nem tesz le sütit).
  const locale = (await cookies()).get("trita_locale")?.value?.slice(0, 5) ?? null;
  const selfHost = get("host") ?? undefined;

  const rows: {
    name: string;
    origin: string;
    visitorRef: string;
    userProfileId: string | null;
    isAuthed: boolean;
    path: string | null;
    locale: string | null;
    deviceClass: string;
    referrerHost: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    appVersion: string | null;
    props?: ValidatedEventProps;
  }[] = [];

  for (const event of parsed.data.events) {
    if (!isAnalyticsEventName(event.name)) {
      log.warn({ event: "analytics.unknown_event", name: event.name }, "Ismeretlen esemény eldobva");
      continue;
    }
    if (!acceptsOrigin(event.name, "client")) {
      log.warn(
        { event: "analytics.origin_rejected", name: event.name },
        "Szerver-only esemény érkezett kliensről — eldobva",
      );
      continue;
    }
    const props = parseEventProps(event.name, event.props);
    if (!props.ok) {
      log.warn(
        { event: "analytics.props_invalid", name: event.name, issue: props.issue },
        "Érvénytelen tulajdonságok — esemény eldobva",
      );
      continue;
    }

    rows.push({
      name: event.name,
      origin: "client",
      visitorRef,
      userProfileId,
      isAuthed: Boolean(userProfileId),
      // A kliens által küldött útvonalat a SZERVER normalizálja.
      path: normalizePath(event.path ?? pageUrl),
      locale,
      deviceClass,
      referrerHost: referrerHost(event.ref ?? null, selfHost),
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      appVersion,
      ...(Object.keys(props.props).length ? { props: props.props } : {}),
    });
  }

  if (rows.length === 0) return NO_CONTENT();

  try {
    await prisma.analyticsEvent.createMany({ data: rows });
  } catch (error) {
    log.warn({ event: "analytics.write_failed", count: rows.length, err: error }, "Esemény-írás sikertelen");
  }

  return NO_CONTENT();
}
