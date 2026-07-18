import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INDUSTRIES } from "@/lib/industry-fit";
import { checkRateLimit } from "@/lib/rate-limit";

// Kalibrációs visszajelzés: „dolgoztál hasonló szerepben — találó volt?"
// A súlyok hosszú távú validálásának adatforrása. Upsert: az utolsó
// válasz számít, szerepenként egy.

const schema = z.object({
  industryKey: z.string().min(1).max(40),
  roleKey: z.string().min(1).max(40),
  fitScore: z.number().int().min(0).max(100),
  verdict: z.enum(["accurate", "inaccurate"]),
});

export async function POST(req: Request) {
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const { industryKey, roleKey, fitScore, verdict } = parsed.data;

  // Csak létező katalógus-elemre fogadunk visszajelzést.
  const industry = INDUSTRIES.find((i) => i.key === industryKey);
  if (!industry || !industry.roles.some((r) => r.key === roleKey)) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  await prisma.feedback.upsert({
    where: {
      userProfileId_kind_targetKey: {
        userProfileId: profile.id,
        kind: "role_fit",
        targetKey: `${industryKey}:${roleKey}`,
      },
    },
    create: {
      userProfileId: profile.id,
      kind: "role_fit",
      targetKey: `${industryKey}:${roleKey}`,
      rating: fitScore,
      payload: { verdict },
    },
    update: { rating: fitScore, payload: { verdict } },
  });

  return NextResponse.json({ ok: true });
}
