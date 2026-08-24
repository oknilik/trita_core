import { after, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import {
  sanitizeDiagnosticPath,
  sanitizeDiagnosticText,
  sendErrorAlert,
} from "@/lib/error-alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/client-error — a kliens-oldali hibahatár jelentése.
 *
 * MIÉRT KELL: a hibahatár (`ErrorScreen`) eddig a client-loggerrel a LÁTOGATÓ
 * böngésző-konzoljára írt. Ott a hiba láthatatlan a számunkra: a felhasználó
 * lát egy hibaképernyőt, mi pedig semmit. A szerver-oldali kezeletlen hibáknak
 * megvan a maguk útja (`instrumentation.ts`), a kliens-oldaliaknak eddig nem volt.
 *
 * Szándékosan publikus (a hiba a bejelentkezés előtt is megtörténhet) és
 * szándékosan szűk: ZÁRT séma, csonkolt mezők, semmi szabad szöveg a
 * felhasználótól. A válasz mindig 204 — a végpont nem ad visszajelzést,
 * amiből tapogatni lehetne.
 */

const clientErrorSchema = z
  .object({
    /** Melyik hibahatár fogta (pl. "root", "team") — zárt karakterkészlet. */
    surface: z.string().trim().max(40).regex(/^[a-z0-9_-]+$/i),
    /** A hiba neve/típusa, pl. "TypeError". */
    name: z.string().trim().max(80).optional(),
    /** Üzenet-fej. Csonkolva megy tovább; stacket NEM fogadunk. */
    message: z.string().trim().max(500).optional(),
    /** Next szerver-hiba hash, ha a hiba SSR-ből jött. */
    digest: z.string().trim().max(120).optional(),
    /** Útvonal, ahol történt — query és hash nélkül. */
    path: z.string().trim().max(200).optional(),
  })
  .strict();

export async function POST(req: Request) {
  // Diagnosztikai tier: bőkezű keret, és SZÁNDÉKOSAN fail-open — ld. a
  // `diagnostics` sort a src/lib/rate-limit.ts-ben. Egy hibajelentés akkor
  // kell a legjobban, amikor épp baj van.
  const rateLimited = await checkRateLimit("diagnostics");
  if (rateLimited) return new NextResponse(null, { status: 204 });

  const log = await getRequestLogger("client-error");

  const parsed = clientErrorSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 204 });

  const { surface, name, message, digest, path } = parsed.data;
  const safeMessage = sanitizeDiagnosticText(message);
  const safePath = sanitizeDiagnosticPath(path);

  log.error(
    { event: "client.boundary_error", surface, name, message: safeMessage, digest, path: safePath },
    "Client error boundary reported an error",
  );

  after(async () => {
    await sendErrorAlert({
      event: "client.boundary_error",
      origin: "client",
      path: safePath,
      name: name ?? null,
      message: safeMessage,
      digest: digest ?? null,
    });
  });

  return new NextResponse(null, { status: 204 });
}
