import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { RESULTS_VIEW_MODES } from "@/lib/results/view-mode";

// Az eredmény-nézet (egyszerű / részletes) választásának megjegyzése.
// Eszközfüggetlen: a UserProfile-on tároljuk, nem localStorage-ban — a
// tanácsadói körben ugyanaz a felhasználó több eszközről is visszanéz.
const viewModeSchema = z.object({
  mode: z.enum(RESULTS_VIEW_MODES),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = viewModeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_VIEW_MODE" }, { status: 400 });
  }

  await prisma.userProfile.updateMany({
    where: { clerkId: userId },
    data: { resultsViewMode: parsed.data.mode },
  });

  return NextResponse.json({ mode: parsed.data.mode });
}
