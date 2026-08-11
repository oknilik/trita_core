import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { linkObserverTokenToProfile } from "@/lib/observer/link-service";

const linkSchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: Request) {
  // A testvér-route-okkal (submit/draft/invite) azonos standard rate-limit.
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profil nem található." }, { status: 404 });
  }

  const linkResult = await linkObserverTokenToProfile({
    token: parsed.data.token,
    profileId: profile.id,
  });
  if (!linkResult.ok) {
    if (linkResult.code === "INVALID_TOKEN") {
      return NextResponse.json({ error: "Meghívó nem található." }, { status: 404 });
    }
    if (linkResult.code === "OBSERVER_MISMATCH") {
      return NextResponse.json(
        { error: "Ez a meghívó másik felhasználóhoz tartozik." },
        { status: 409 },
      );
    }
    // Rövid hibakód (repo-konvenció): a meghívó a SAJÁT tokenjét nem
    // claim-elheti. A hívók (sign-in/sign-up onboarding) fire-and-forget
    // hívnak — a kód a kliens-oldali lokalizáció horgonyja, ha később kell.
    if (linkResult.code === "SELF_LINK_FORBIDDEN") {
      return NextResponse.json({ error: "SELF_LINK_FORBIDDEN" }, { status: 403 });
    }
    if (linkResult.code === "ALREADY_USED") {
      return NextResponse.json(
        { error: "A meghívó már fel lett használva." },
        { status: 400 },
      );
    }
    if (linkResult.code === "INVITE_EXPIRED") {
      return NextResponse.json({ error: "A meghívó lejárt." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "A meghívó már nem aktív." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
