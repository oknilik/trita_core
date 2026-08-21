import { NextRequest, NextResponse } from "next/server";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";
import { unsubscribeByToken } from "@/lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Leiratkozás — belépés nélkül, egyetlen kattintással.
 *
 * KÉT METÓDUS, KÉT HÍVÓ:
 *   · GET  — az ember kattint a levélben lévő linkre → redirect egy emberi
 *            visszajelző oldalra.
 *   · POST — a LEVELEZŐ hívja a `List-Unsubscribe-Post` fejléc alapján
 *            (RFC 8058, egykattintásos leiratkozás). Itt nincs ember, ezért
 *            sima 200 a válasz, redirect nélkül.
 *
 * Mindkét ág IDEMPOTENS: a levelezők előzetesen és ismételten is behívhatják,
 * a már leiratkozott sorra érkező hívás is siker.
 */
async function handle(token: string, log: Awaited<ReturnType<typeof getRequestLogger>>) {
  if (!token) return { ok: false };
  try {
    const result = await unsubscribeByToken(token);
    if (result.ok) trackServerEvent("newsletter.unsubscribe", {});
    return result;
  } catch (error) {
    log.error({ event: "newsletter.unsubscribe_failed", err: error }, "Newsletter unsubscribe failed");
    return { ok: false };
  }
}

export async function GET(req: NextRequest) {
  const log = await getRequestLogger("newsletter");
  const result = await handle(req.nextUrl.searchParams.get("token") ?? "", log);

  const url = new URL("/newsletter/unsubscribed", req.nextUrl.origin);
  url.searchParams.set("state", result.ok ? "ok" : "invalid");
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: NextRequest) {
  const log = await getRequestLogger("newsletter");
  // A token jöhet a query-ből (a fejlécbe írt URL-ből) — más forrást a
  // levelezők nem garantálnak, ezért mást nem is fogadunk el.
  const result = await handle(req.nextUrl.searchParams.get("token") ?? "", log);
  return NextResponse.json({ ok: result.ok }, { status: result.ok ? 200 : 400 });
}
