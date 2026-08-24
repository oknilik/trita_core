import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkTokenRateLimit } from "@/lib/rate-limit";
import { resolveObserverSubmitViewerClerkId } from "@/lib/observer/submit-auth";
import {
  resolveObserverTokenLifecycle,
  toObserverTokenErrorCode,
} from "@/lib/observer/token-validation";
import {
  observerDraftCookieName,
  observerDraftCookieValue,
} from "@/lib/observer/draft-cookie";

/**
 * Blokkoljuk-e a draft olvasását/írását (403)?
 * (1) Self-guard: a bejelentkezett MEGHÍVÓ (értékelt) SOHA nem férhet a rater
 *     draftjához — sem olvasni (a rater nyers válaszai), sem írni (doctored
 *     draftot a rater helyett). Ez a submit self-guard megfelelője a draftra
 *     (motor-audit: külső tokennél az addressee-ellenőrzés nem fogta meg).
 * (2) Belsős (név szerinti) meghívó: csak a bejelentkezett címzett írhat.
 * A best-effort viewer-feloldás hibát null-ra nyel (a publikus draft-út nem
 * dobhat 500-at); kijelentkezve a külső-token self-eset a W2-vel közös maradék.
 */
async function shouldBlockDraftAccess(
  inviterId: string,
  observerProfileId: string | null,
): Promise<boolean> {
  let viewerId: string | null = null;
  try {
    // A Clerk-feloldás a submit-auth seamen át fut (lazy import) — így a
    // route integrációs tesztben is betölthető (a Clerk szerver-SDK a
    // node:test + react-server condition alatt modul-betöltéskor dobna).
    const userId = await resolveObserverSubmitViewerClerkId();
    if (userId) {
      const viewer = await prisma.userProfile.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });
      viewerId = viewer?.id ?? null;
    }
  } catch {
    viewerId = null;
  }
  if (viewerId && viewerId === inviterId) return true; // self-guard
  if (observerProfileId) {
    if (!viewerId || viewerId !== observerProfileId) return true; // not addressee
  }
  return false;
}

const draftSchema = z.object({
  token: z.string().min(1),
  phase: z.enum(["intro", "assessment", "confidence"]),
  relationshipType: z.string().min(1).max(40),
  knownDuration: z.string().min(1).max(40),
  // Méret-korlát: a legnagyobb élő forma 100 item — a felső határ kizárja a
  // memória-terhelő, hitelesítés nélküli publikus endpointra küldött túlméretes
  // JSON-blobot (motor-audit W11).
  answers: z.record(z.string().max(64), z.number().int().min(1).max(5)),
  currentPage: z.number().int().min(0).max(1000),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { token, phase, relationshipType, knownDuration, answers, currentPage } = parsed.data;
  const rateLimitResponse = await checkTokenRateLimit("observer", token);
  if (rateLimitResponse) return rateLimitResponse;
  if (Object.keys(answers).length > 150) {
    return NextResponse.json({ error: "TOO_MANY_ANSWERS" }, { status: 400 });
  }

  const invitation = await prisma.observerInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      inviterId: true,
      observerProfileId: true,
    },
  });
  if (!invitation) {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
  }
  // Teljes életciklus-ellenőrzés (nem csak status === PENDING): a LEJÁRT
  // PENDING token draftot sem írhat többé — a submit/link route-okkal azonos
  // szabály (resolveObserverTokenLifecycle), rövid hibakóddal.
  const lifecycle = resolveObserverTokenLifecycle(invitation);
  if (lifecycle !== "active") {
    return NextResponse.json({ error: toObserverTokenErrorCode(lifecycle) }, { status: 400 });
  }
  if (await shouldBlockDraftAccess(invitation.inviterId, invitation.observerProfileId)) {
    return NextResponse.json({ error: "NOT_ADDRESSEE" }, { status: 403 });
  }

  await prisma.observerDraft.upsert({
    where: { invitationId: invitation.id },
    create: {
      invitationId: invitation.id,
      phase,
      relationshipType,
      knownDuration,
      answers,
      currentPage,
    },
    update: {
      phase,
      relationshipType,
      knownDuration,
      answers,
      currentPage,
    },
  });

  const res = NextResponse.json({ ok: true });
  // KÜLSŐ (nem nevesített) meghívónál a draft visszaolvasása ehhez a
  // böngészőhöz kötött: httpOnly HMAC-cookie bizonyítja, hogy a draftot ez a
  // kliens írta (részletek + trade-off: observer/draft-cookie.ts). Nevesített
  // meghívónál a bejelentkezett címzett auth alapján kapja a draftot — ott a
  // cookie-ra nincs szükség.
  if (!invitation.observerProfileId) {
    const maxAgeSeconds = Math.max(
      60,
      Math.floor((invitation.expiresAt.getTime() - Date.now()) / 1000),
    );
    res.cookies.set(observerDraftCookieName(invitation.id), observerDraftCookieValue(invitation.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: maxAgeSeconds,
    });
  }
  return res;
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  const token = body?.token;
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  const rateLimitResponse = await checkTokenRateLimit("observer", token);
  if (rateLimitResponse) return rateLimitResponse;

  const invitation = await prisma.observerInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      inviterId: true,
      observerProfileId: true,
    },
  });
  if (!invitation) {
    return NextResponse.json({ ok: true });
  }
  // Életciklus-őr a törlésre is: LEJÁRT/lezárt tokennel a draft nem
  // manipulálható. A COMPLETED ág megengedett marad — a beadás utáni kliens-
  // oldali takarítás ide fut be (a submit-tranzakció a draftot már törölte,
  // a hívás idempotens no-op).
  const lifecycle = resolveObserverTokenLifecycle(invitation);
  if (lifecycle !== "active" && lifecycle !== "completed") {
    return NextResponse.json({ error: toObserverTokenErrorCode(lifecycle) }, { status: 400 });
  }
  if (await shouldBlockDraftAccess(invitation.inviterId, invitation.observerProfileId)) {
    return NextResponse.json({ error: "NOT_ADDRESSEE" }, { status: 403 });
  }

  await prisma.observerDraft.deleteMany({
    where: { invitationId: invitation.id },
  });

  return NextResponse.json({ ok: true });
}
