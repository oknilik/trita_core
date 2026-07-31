import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateCardSchema } from "@/lib/quote/rate-card";
import { loadRateCard, saveRateCard } from "@/lib/quote/rate-card.server";

// Díjtételek olvasása/mentése. Admin-only: ezek a számok belső adatok, a
// platform kifelé nem publikál listaárat.

export async function GET() {
  await requireAdmin();
  const { rate, stored } = await loadRateCard();
  return NextResponse.json({ rate, stored });
}

export async function PUT(req: Request) {
  const { userId } = await requireAdmin();

  const parsed = rateCardSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    // A hibalista visszamegy: a felületen látszódjon, MELYIK tétel rossz —
    // egy néma elutasítás után a felhasználó rossz számokkal ajánlana.
    return NextResponse.json(
      { error: "INVALID_RATE_CARD", issues: parsed.error.issues.map((i) => i.path.join(".")) },
      { status: 400 },
    );
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  await saveRateCard(parsed.data, profile?.id ?? null);
  return NextResponse.json({ ok: true });
}
