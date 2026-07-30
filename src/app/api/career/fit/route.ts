import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import { computeCareerForProfile } from "@/lib/career/service";
import { INDUSTRY_ISCO } from "@/lib/career/industries";
import { AXIS_KEYS, VETO_TAGS } from "@/lib/career/types";

// Karrier-illeszkedés számítása SZERVER-oldalon: a katalógus (477 foglalkozás)
// nem kerül a kliens bundle-jébe, és a képernyő, a PDF és a jelölt-réteg
// ugyanazt a motort hívja.

const axisValue = z.union([z.literal(-1), z.literal(0), z.literal(1)]);
const industryKeys = Object.keys(INDUSTRY_ISCO) as [string, ...string[]];

const schema = z.object({
  // a wizard friss válaszai (a mentés külön hívásban történik)
  prefs: z.record(z.enum(AXIS_KEYS as [string, ...string[]]), axisValue).optional(),
  leadIntent: z.enum(["lead", "expert", "unsure"]).optional(),
  eduLevel: z
    .enum(["primary", "secondary", "vocational", "higher", "specialized"])
    .nullable()
    .optional(),
  industries: z.array(z.enum(industryKeys)).max(3).optional(),
  currentIndustry: z.enum(industryKeys).nullable().optional(),
  status: z.enum(["studying", "working", "switching"]).nullable().optional(),
  ignoreScope: z.boolean().optional(),
  vetoes: z.array(z.enum(VETO_TAGS as [string, ...string[]])).max(6).optional(),
  limit: z.number().int().min(1).max(40).optional(),
  readyOnly: z.boolean().optional(),
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

  const log = await getRequestLogger("career");
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const { prefs, leadIntent, eduLevel, industries, currentIndustry, status, ignoreScope, vetoes, limit, readyOnly } =
    parsed.data;

  const result = await computeCareerForProfile(profile.id, {
    limit: limit ?? 18,
    readyOnly,
    industries,
    currentIndustry,
    status,
    ignoreScope,
    overrides: {
      ...(prefs ? { prefs: prefs as never } : {}),
      ...(leadIntent ? { leadIntent } : {}),
      ...(eduLevel !== undefined ? { eduLevel } : {}),
      ...(vetoes ? { vetoes: vetoes as never } : {}),
    },
  });

  if (!result.hasSelfResult) {
    return NextResponse.json({ error: "NO_ASSESSMENT" }, { status: 409 });
  }

  log.info(
    {
      event: "career.fit.computed",
      occupations: result.meta.occupationCount,
      atLevel: result.sections.atLevel.length,
      afterTraining: result.sections.afterTraining.length,
      observerWeight: result.observerWeight,
      interestSource: result.interestSource ?? "none",
    },
    "Career fit computed",
  );

  return NextResponse.json(result);
}
