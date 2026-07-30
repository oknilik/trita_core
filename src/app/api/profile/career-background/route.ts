import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INDUSTRIES, INTEREST_TAGS } from "@/lib/industry-fit";
import { checkRateLimit } from "@/lib/rate-limit";

// Karrier-iránytű háttéradatok mentése — a wizard válaszai a profilra
// kerülnek, hogy visszatéréskor (és eszközök között) megmaradjanak.

const industryKeys = INDUSTRIES.map((industry) => industry.key) as [string, ...string[]];

const schema = z.object({
  status: z.enum(["studying", "working", "switching"]),
  eduLevel: z.enum(["primary", "secondary", "vocational", "higher", "specialized"]).nullable(),
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
  // Preferencia- és környezet-tengelyek: a wizard 2 lépésének válaszai. Eddig
  // csak kliens-state volt, ezért újratöltés után MÁS rangsor jött, mint amit a
  // user a wizard végén látott (és a PDF-ág is kihagyta).
  prefs: z
    .record(
      z.enum(["people", "variety", "autonomy", "creation", "pace", "structure", "setting"]),
      z.union([z.literal(-1), z.literal(0), z.literal(1)]),
    )
    .optional(),
  // Vezetői ambíció — a vezetői komponensek súlyát emeli a motorban.
  leadIntent: z.enum(["lead", "expert", "unsure"]).optional(),
  // Jelenlegi foglalkozás a katalógusból (O*NET-SOC) — a known-groups
  // validáció adatforrása; a rangsorolásba NEM számít bele.
  currentOccupationId: z.string().max(20).nullable().optional(),
  currentOccupationLabel: z.string().max(120).nullable().optional(),
  // Vétó-chipek: kizárt munka-tulajdonságok — a motor kemény szűrője.
  vetoes: z
    .array(
      z.enum([
        "children",
        "care",
        "blood",
        "customers",
        "sales",
        "conflict",
        "shift",
        "physical",
        "outdoor",
        "screen",
        "driving",
        "heights",
        "hazard",
        "monotony",
        "animals",
      ]),
    )
    .max(6)
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

/**
 * Teljes visszaállítás: a wizard MINDEN mentett válasza törlődik — háttér,
 * preferenciák, vezetői szándék és a kitöltött érdeklődés-kérdőív (Holland)
 * eredménye is. A személyiség-eredmény nem érintett: a user tiszta lappal, csak
 * a profiljával kezd újra.
 */
export async function DELETE() {
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { careerBackground: Prisma.DbNull },
  });

  return NextResponse.json({ ok: true });
}
