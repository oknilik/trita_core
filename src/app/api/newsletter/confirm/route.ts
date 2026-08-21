import { NextRequest, NextResponse } from "next/server";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";
import { confirmSubscription } from "@/lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/newsletter/confirm?token=… — a double opt-in második fele.
 *
 * Levélből érkező link, tehát GET, és a válasz REDIRECT egy emberi oldalra
 * (`/newsletter/confirmed`) — a levelező-kliensben megnyíló nyers JSON
 * használhatatlan visszajelzés lenne.
 *
 * A `state` query-paraméter mondja meg a céloldalnak, mit mutasson:
 * `ok` | `expired` | `invalid`. Tokent SOHA nem viszünk tovább a redirectben:
 * a céloldal URL-je böngésző-előzménybe és referrerbe is bekerül.
 */
export async function GET(req: NextRequest) {
  const log = await getRequestLogger("newsletter");
  const token = req.nextUrl.searchParams.get("token") ?? "";

  const target = (state: string) => {
    const url = new URL("/newsletter/confirmed", req.nextUrl.origin);
    url.searchParams.set("state", state);
    return NextResponse.redirect(url, { status: 303 });
  };

  if (!token) return target("invalid");

  try {
    const result = await confirmSubscription(token);
    if (!result.ok) return target(result.reason ?? "invalid");

    trackServerEvent("newsletter.confirm", {});
    return target("ok");
  } catch (error) {
    log.error({ event: "newsletter.confirm_failed", err: error }, "Newsletter confirm failed");
    return target("invalid");
  }
}
