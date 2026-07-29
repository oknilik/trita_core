import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INDUSTRIES, INTEREST_TAGS } from "@/lib/industry-fit";
import { checkRateLimit } from "@/lib/rate-limit";

// Karrier-iránytű háttéradatok mentése — a wizard válaszai a profilra
// kerülnek, hogy visszatéréskor (és eszközök között) megmaradjanak.

const industryKeys = INDUSTRIES.map((industry) => industry.key) as [string, ...string[]];

const schema = z.object({
  status: z.enum(["studying", "working", "switching"]),
  eduLevel: z.enum(["primary", "secondary", "vocational", "higher"]).nullable(),
  eduField: z
    .enum([
      "tech_engineering",
      "economics",
      "health",
      "humanities",
      "natural_science",
      "legal",
      "arts",
      "pedagogy",
      "trade",
      "none_other",
    ])
    .nullable(),
  ageBand: z.enum(["under20", "20s", "30s", "40s", "50plus"]).nullable(),
  currentIndustry: z.enum(industryKeys).nullable(),
  interests: z.array(z.enum(industryKeys)).max(3),
  eduFields: z
    .array(
      z.enum([
        "tech_engineering",
        "economics",
        "health",
        "humanities",
        "natural_science",
        "legal",
        "arts",
        "pedagogy",
        "trade",
        "none_other",
      ]),
    )
    .max(3)
    .optional(),
  interestTags: z
    .array(z.enum(INTEREST_TAGS.map((tag) => tag.key) as [string, ...string[]]))
    .max(4)
    .optional(),
  // MÉRT érdeklődés-profil (Mini-IP) — betűnként 0-100
  riasecScores: z
    .record(z.enum(["R", "I", "A", "S", "E", "C"]), z.number().min(0).max(100))
    .optional(),
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

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { careerBackground: parsed.data },
  });

  return NextResponse.json({ ok: true });
}
