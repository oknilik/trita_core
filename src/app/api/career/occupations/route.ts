import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOccupations } from "@/lib/career/catalog";
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
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

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
