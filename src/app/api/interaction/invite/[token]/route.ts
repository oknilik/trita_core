import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompareInviteState } from "@/lib/compare-invite";

// Meghívó-token validálás a consent-oldalhoz. Auth nélkül hívható (a
// fogadó fél belépés előtt is látja, mire mond igent) — kizárólag a
// meghívó megjelenített nevét és az állapotot adja ki, pontszámot soha.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const invite = await prisma.compareInvite.findUnique({
    where: { token },
    select: {
      status: true,
      expiresAt: true,
      inviter: { select: { username: true } },
    },
  });
  if (!invite) {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 404 });
  }

  return NextResponse.json({
    state: resolveCompareInviteState(invite),
    inviterName: invite.inviter?.username ?? null,
  });
}
