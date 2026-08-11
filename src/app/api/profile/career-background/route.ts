import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INDUSTRIES, INTEREST_TAGS } from "@/lib/industry-fit";
import { scoreRiasec } from "@/lib/questions/riasec";
import { getOccupation } from "@/lib/career/catalog";
import { CAREER_MODULE_READY } from "@/lib/career/module-state";
import { isCareerModuleHidden } from "@/lib/career/module-visibility";
import { checkRateLimit } from "@/lib/rate-limit";

// Karrier-iránytű háttéradatok mentése — a wizard válaszai a profilra
// kerülnek, hogy visszatéréskor (és eszközök között) megmaradjanak.
//
// Kapuzás a /api/career/fit mintájára (2026-08-11): a parkolt modul
// (CAREER_MODULE_READY=false) VAGY az org-szintű elrejtés esetén a végpont
// NEM létezik (404) — parkolt modul mellett nem írható careerBackground.
// Egyetlen élő hívó a CareerCompass, az pedig csak élő modulnál renderel;
// az onboarding a saját útján (prisma-merge) ír, nem ezen a végponton.

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
  // MÉRT érdeklődés-profil (Mini-IP) — a kliens a 30 item NYERS válaszait
  // küldi (itemId → 1-5), a hat betű-pontszámot a SZERVER számolja
  // (2026-08-11, fix): a korábbi végpont hat kliens-számolt számot fogadott
  // el „measured" forrásként, amit bármilyen kézi hívás hamisíthatott. A
  // scoreRiasec a teljességet is kikényszeríti (hiányos/érvénytelen válasz-
  // halmaz → null → a mentés becsült/címke-forrásra esik vissza). Egy
  // pontszám-only payload (örökölt kliens riasecScores mezője) a zod strip
  // miatt némán kimarad — a tárolt korábbi mért kód a lentebbi megőrző
  // logikával változatlanul él tovább.
  riasecAnswers: z
    .record(z.string().regex(/^\d+$/), z.number().int().min(1).max(5))
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
  // validáció adatforrása; a rangsorolásba NEM számít bele. Csak LÉTEZŐ
  // katalógus-azonosító fogadható el: egy kitalált kód a validációs mintát
  // mérgezné (a label szabad szöveg, az id nem az).
  currentOccupationId: z
    .string()
    .max(20)
    .nullable()
    .optional()
    .refine((id) => id == null || Boolean(getOccupation(id)), {
      message: "UNKNOWN_OCCUPATION",
    }),
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
    select: { id: true, careerBackground: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  if (!CAREER_MODULE_READY || (await isCareerModuleHidden(profile.id))) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  // A MÉRT érdeklődés-kérdőív (Holland) eredménye csak ÚJRAKEZDÉSKOR vész el
  // (DELETE), módosításkor soha. A mentés teljes cserét ír, ezért ha a
  // beküldött háttér nem hoz érvényes kitöltést, a meglévő pontszámokat
  // megtartjuk — a kitöltés drága (a leghosszabb lépés), és egy hiányos
  // kliens-payload nem törölheti el. Kiürítéshez a DELETE való.
  const previous = (profile.careerBackground ?? null) as {
    riasecScores?: Record<string, number>;
  } | null;
  const { riasecAnswers, ...backgroundFields } = parsed.data;
  const next: typeof backgroundFields & { riasecScores?: Record<string, number> } = {
    ...backgroundFields,
  };
  // Szerver-oldali pontozás: a nyers válaszokból számolt betű-pontszámok
  // kerülnek a profilra. Érvénytelen/hiányos válasz-halmaz → nincs mért kód
  // (a forrás-létra becsültre esik), a korábban tárolt mért kód megmarad.
  if (riasecAnswers) {
    const answers: Record<number, number> = {};
    for (const [id, value] of Object.entries(riasecAnswers)) {
      answers[Number(id)] = value;
    }
    const scored = scoreRiasec(answers);
    if (scored) next.riasecScores = scored;
  }
  if (!next.riasecScores && previous?.riasecScores) {
    next.riasecScores = previous.riasecScores;
  }

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { careerBackground: next },
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

  if (!CAREER_MODULE_READY || (await isCareerModuleHidden(profile.id))) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { careerBackground: Prisma.DbNull },
  });

  return NextResponse.json({ ok: true });
}
