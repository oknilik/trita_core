// ─────────────────────────────────────────────────────────────────────
// A megosztott profil (/share/[token]) OG-képének és metaadatának közös
// adatmodellje. A pure builder (buildShareOgModel) tesztelhető DB nélkül;
// a loader a share-oldal token-feloldását követi. Érvénytelen/visszavont
// tokenre üres modellt adunk — az OG-route ilyenkor generikus brand-képet
// renderel, sosem 500-azik (a link-előnézetnek mindig van képe).
// ─────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import type { ScoreResult } from "@/lib/scoring";
import {
  resolvePersonalityTypeFromScores,
  type PersonalityLocale,
} from "@/lib/personality-type";
import { resolveGlyphPair } from "@/lib/type-glyph";

export interface ShareOgModel {
  displayName: string | null;
  typeLabel: string | null;
  primaryCode: string | null;
  secondaryCode: string | null;
  intensity: number;
}

const EMPTY_MODEL: ShareOgModel = {
  displayName: null,
  typeLabel: null,
  primaryCode: null,
  secondaryCode: null,
  intensity: 3,
};

/** Pure rész: dimenzió-pontszámokból OG-modell. Hiányos adatnál üres modell. */
export function buildShareOgModel(
  dimensionScores: Record<string, number> | null | undefined,
  username: string | null | undefined,
  locale: PersonalityLocale,
): ShareOgModel {
  if (!dimensionScores) return { ...EMPTY_MODEL, displayName: username ?? null };

  const dims = Object.entries(dimensionScores).map(([code, score]) => ({
    code,
    score,
  }));
  const pair = resolveGlyphPair(dims);
  if (!pair) return { ...EMPTY_MODEL, displayName: username ?? null };

  return {
    displayName: username ?? null,
    // Ugyanaz a resolver, mint a /share oldal címkéje — közeli 2-3.
    // helyezettnél az OG-kép is főnév-only címkét kap, nem térhetnek el.
    typeLabel: resolvePersonalityTypeFromScores(dims, locale),
    primaryCode: pair.primaryCode,
    secondaryCode: pair.secondaryCode,
    intensity: pair.intensity,
  };
}

/** Token → OG-modell. Érvénytelen tokenre üres modell (generikus brand-kép). */
export async function loadShareOgModel(
  token: string,
  locale: PersonalityLocale,
): Promise<ShareOgModel> {
  const result = await prisma.assessmentResult.findUnique({
    where: { shareToken: token },
    select: {
      scores: true,
      userProfile: { select: { username: true } },
    },
  });
  if (!result) return EMPTY_MODEL;

  const scores = result.scores as ScoreResult;
  if (scores.type !== "likert") return EMPTY_MODEL;

  return buildShareOgModel(
    scores.dimensions ?? null,
    result.userProfile?.username ?? null,
    locale,
  );
}
