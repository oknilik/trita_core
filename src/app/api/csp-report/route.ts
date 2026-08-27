import { after, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import { sendErrorAlert } from "@/lib/error-alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/csp-report — a Content-Security-Policy `report-uri` célpontja.
 *
 * MIÉRT KELL: report-only CSP report-uri nélkül csak a LÁTOGATÓ konzoljára ír,
 * tehát nálunk nem keletkezik adat arról, mit blokkolna az enforce mód. Enélkül
 * a „figyeljük élesben, aztán élesítjük" terv nem hajtható végre.
 *
 * A végpont szándékosan publikus (a böngésző auth nélkül POST-ol) és
 * szándékosan „néma": mindig 204, sosem mond semmit a kérőnek. Amit naplóz, az
 * a sértés három azonosító mezője — a teljes reportot NEM írjuk ki, mert a
 * `script-sample` a felhasználó által beírt szöveget is tartalmazhatja.
 */

/** A böngésző reportja tetszőlegesen nagy lehet; ennél többet nem olvasunk. */
const MAX_BODY_BYTES = 16 * 1024;

/** Naplóba kerülő mező-hossz felső korlátja (a URI-k nagyon hosszúak tudnak lenni). */
const MAX_FIELD_LEN = 300;

function clip(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value.length > MAX_FIELD_LEN ? `${value.slice(0, MAX_FIELD_LEN)}…` : value;
}

async function readLimitedBody(req: Request): Promise<string | null> {
  const declaredLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return null;
  if (!req.body) return null;

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }

  const joined = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
}

interface ExtractedViolation {
  directive: string | null;
  blockedUri: string | null;
  documentUri: string | null;
}

/**
 * Két riport-formátum él a böngészőkben: a régi `application/csp-report`
 * (`{ "csp-report": {...} }`) és a Reporting API `application/reports+json`
 * (`[{ type, body: {...} }]`). Mindkettőt ugyanarra a három mezőre hozzuk.
 */
function extractViolations(payload: unknown): ExtractedViolation[] {
  const bodies: Record<string, unknown>[] = [];

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      if (entry && typeof entry === "object") {
        const body = (entry as { body?: unknown }).body;
        if (body && typeof body === "object") bodies.push(body as Record<string, unknown>);
      }
    }
  } else if (payload && typeof payload === "object") {
    const legacy = (payload as { "csp-report"?: unknown })["csp-report"];
    if (legacy && typeof legacy === "object") bodies.push(legacy as Record<string, unknown>);
  }

  return bodies.map((body) => ({
    directive: clip(body["effective-directive"] ?? body.effectiveDirective ?? body["violated-directive"]),
    blockedUri: clip(body["blocked-uri"] ?? body.blockedURL),
    documentUri: clip(body["document-uri"] ?? body.documentURL),
  }));
}

export async function POST(req: Request) {
  // Diagnosztikai tier: bőkezű keret, és SZÁNDÉKOSAN fail-open. Egy CSP-
  // sértés jelentése pont akkor a legértékesebb, amikor a rendszerben baj
  // van – ha a hiányzó Redis miatt eldobnánk, a látásunkat veszítenénk el.
  const rateLimited = await checkRateLimit("diagnostics");
  if (rateLimited) return new NextResponse(null, { status: 204 });

  const log = await getRequestLogger("csp");

  const raw = await readLimitedBody(req);
  if (!raw) return new NextResponse(null, { status: 204 });

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const violations = extractViolations(payload).filter((violation) => violation.directive);
  for (const violation of violations) {
    if (!violation.directive) continue;
    log.warn({ event: "csp.violation", ...violation }, "CSP violation reported");
  }
  if (violations.length > 0) {
    after(async () => {
      await Promise.all(
        violations.map((violation) =>
          sendErrorAlert({
            event: "csp.violation",
            origin: "client",
            name: "ContentSecurityPolicyViolation",
            path: violation.documentUri,
            message: `${violation.directive}: ${violation.blockedUri ?? "unknown"}`,
          }),
        ),
      );
    });
  }

  // 204 mindig – a böngésző nem vár tartalmat, és a hallgatás nem ad
  // visszajelzést egy végpont-tapogató szkriptnek sem.
  return new NextResponse(null, { status: 204 });
}
