import { NextRequest, NextResponse } from "next/server";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";
import { confirmSubscription } from "@/lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/newsletter/confirm?token=… — a double opt-in második fele.
 *
 * A levél linkje GET-tel csak a megerősítő oldalra visz. Az állapotot az ott
 * megnyomott gomb POST-ja módosítja, így a linket előre megnyitó levélszkenner
 * nem tud feliratkoztatni.
 *
 * A POST JSON `state` mezője mondja meg a kliensnek, mit mutasson:
 * `ok` | `expired` | `invalid`. Siker/hiba után a kliens token nélküli
 * státusz-URL-re cseréli az előzményt.
 */
export async function GET(req: NextRequest) {
  // Régi levél-link kompatibilitás: GET csak az emberi megerősítő oldalra
  // visz, állapotot nem módosít. Így levélszkenner nem aktivál feliratkozást.
  const url = new URL("/newsletter/confirm", req.nextUrl.origin);
  const token = req.nextUrl.searchParams.get("token");
  if (token) url.searchParams.set("token", token);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: NextRequest) {
  const log = await getRequestLogger("newsletter");
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!token) return NextResponse.json({ ok: false, state: "invalid" }, { status: 400 });

  try {
    const result = await confirmSubscription(token);
    if (!result.ok) {
      return NextResponse.json({ ok: false, state: result.reason ?? "invalid" });
    }

    trackServerEvent("newsletter.confirm", {});
    return NextResponse.json({ ok: true, state: "ok" });
  } catch (error) {
    log.error({ event: "newsletter.confirm_failed", err: error }, "Newsletter confirm failed");
    return NextResponse.json({ ok: false, state: "invalid" }, { status: 500 });
  }
}
