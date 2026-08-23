import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOccupations } from "@/lib/career/catalog";
import { CAREER_MODULE_READY } from "@/lib/career/module-state";
import { isCareerModuleHidden } from "@/lib/career/module-visibility";
import { checkRateLimit } from "@/lib/rate-limit";

// Foglalkozás-kereső a katalógusban (magyar név + FEOR-kód szerint).
// Azért szerver-oldali, mert a katalógus nem kerülhet a kliens-bundle-be.

const LIMIT = 12;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const rateLimitResponse = await checkRateLimit("api", userId);
  if (rateLimitResponse) return rateLimitResponse;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // Kapuzás a /api/career/fit mintájára: a parkolt modul (CAREER_MODULE_READY
  // =false) VAGY az org-szintű elrejtés esetén a végpont NEM létezik. Enélkül
  // a 477 tételes katalógus kapuzatlanul enumerálható volt — rejtett modulú
  // org tagjainak is. Az egyetlen hívó (CurrentRolePicker a CareerCompass-ban)
  // csak élő modulnál renderel, tehát élő flow nem törik.
  if (!CAREER_MODULE_READY || (await isCareerModuleHidden(profile.id))) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const query = normalize(new URL(req.url).searchParams.get("q")?.trim() ?? "");
  if (query.length < 2) return NextResponse.json({ items: [] });

  const items = getOccupations()
    .map((occupation) => {
      const name = normalize(occupation.hu);
      const index = name.indexOf(query);
      const feorMatch = occupation.feor?.startsWith(query) ? 0 : null;
      if (index < 0 && feorMatch === null) return null;
      // Előbb a szó eleji egyezés, majd a rövidebb (általánosabb) név.
      const score = (feorMatch ?? (index === 0 ? 0 : 1)) * 100 + occupation.hu.length;
      return { occupation, score };
    })
    .filter((entry): entry is { occupation: ReturnType<typeof getOccupations>[number]; score: number } =>
      entry !== null,
    )
    .sort((a, b) => a.score - b.score)
    .slice(0, LIMIT)
    .map(({ occupation }) => ({
      id: occupation.id,
      hu: occupation.hu,
      feor: occupation.feor,
      entry: occupation.entry,
    }));

  return NextResponse.json({ items });
}
