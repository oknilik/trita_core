import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

// ─── Score categorization ───────────────────────────────────────────────────

const HIGH_THRESHOLD = 65;
const LOW_THRESHOLD = 35;

type ScoreLevel = "h" | "m" | "l";

function categorizeScore(score: number): ScoreLevel {
  if (score > HIGH_THRESHOLD) return "h";
  if (score < LOW_THRESHOLD) return "l";
  return "m";
}

// ─── Delta band calculation ──────────────────────────────────────────────────

// Positive = self > observer; negative = self < observer
function deltaFlag(selfScore: number, observerScore: number): string {
  const diff = selfScore - observerScore;
  if (diff > 15) return "+2";
  if (diff > 5) return "+1";
  if (diff >= -5) return "0";
  if (diff >= -15) return "-1";
  return "-2";
}

// ─── Cache key ───────────────────────────────────────────────────────────────

export function buildCacheKey(
  testType: string,
  selfScores: Record<string, number>,
  observerAvgScores?: Record<string, number> | null
): string {
  const dims = Object.keys(selfScores).sort();

  const levels = dims.map((d) => `${d}-${categorizeScore(selfScores[d])}`).join(":");

  let key = `${testType}:${levels}`;

  if (observerAvgScores && Object.keys(observerAvgScores).length > 0) {
    const deltas = dims
      .filter((d) => observerAvgScores[d] !== undefined)
      .map((d) => `d${d}${deltaFlag(selfScores[d], observerAvgScores[d])}`)
      .join(":");
    if (deltas) key += `:${deltas}`;
  }

  return key;
}

// ─── Prompt building ─────────────────────────────────────────────────────────

const DIM_NAMES_HU: Record<string, string> = {
  H: "Őszinteség-Alázat",
  E: "Érzelmi stabilitás",
  X: "Extraverzió",
  A: "Barátságosság",
  C: "Lelkiismeretesség",
  O: "Nyitottság",
  N: "Neuroticizmus",
};

const DIM_NAMES_EN: Record<string, string> = {
  H: "Honesty-Humility",
  E: "Emotionality",
  X: "Extraversion",
  A: "Agreeableness",
  C: "Conscientiousness",
  O: "Openness",
  N: "Neuroticism",
};

const LEVEL_LABEL_HU: Record<ScoreLevel, string> = {
  h: "magas",
  m: "közepes",
  l: "alacsony",
};

const LEVEL_LABEL_EN: Record<ScoreLevel, string> = {
  h: "high",
  m: "medium",
  l: "low",
};

function buildSubScoreLines(
  selfScores: Record<string, number>,
  selfFacets?: Record<string, Record<string, number>> | null,
  selfAspects?: Record<string, Record<string, number>> | null,
  isHu = true
): string {
  const subData = selfFacets ?? selfAspects;
  if (!subData || Object.keys(subData).length === 0) return "";

  const label = isHu
    ? "Részletes alfaktorok (dimenzión belüli bontás):"
    : "Sub-scores (within-dimension breakdown):";

  const lines = Object.keys(selfScores)
    .sort()
    .flatMap((dim) => {
      const subs = subData[dim];
      if (!subs || Object.keys(subs).length === 0) return [];
      const subStr = Object.entries(subs)
        .map(([k, v]) => `${k}=${Math.round(v)}`)
        .join(", ");
      return [`  ${dim}: ${subStr}`];
    });

  return lines.length > 0 ? `\n${label}\n${lines.join("\n")}\n` : "";
}

function buildPrompt(
  testType: string,
  selfScores: Record<string, number>,
  observerAvgScores: Record<string, number> | null,
  locale: string,
  selfFacets?: Record<string, Record<string, number>> | null,
  selfAspects?: Record<string, Record<string, number>> | null
): string {
  const isHu = locale === "hu";
  const dimNames = isHu ? DIM_NAMES_HU : DIM_NAMES_EN;
  const levelLabels = isHu ? LEVEL_LABEL_HU : LEVEL_LABEL_EN;

  const dims = Object.keys(selfScores).sort();

  const profileLines = dims.map((d) => {
    const level = categorizeScore(selfScores[d]);
    const name = dimNames[d] ?? d;
    const label = levelLabels[level];
    const score = Math.round(selfScores[d]);

    if (observerAvgScores?.[d] !== undefined) {
      const obsScore = Math.round(observerAvgScores[d]);
      const diff = Math.round(selfScores[d] - observerAvgScores[d]);
      const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
      return isHu
        ? `- ${name} (${d}): ${score}/100 → ${label} | Observer átlag: ${obsScore}/100 (eltérés: ${diffStr})`
        : `- ${name} (${d}): ${score}/100 → ${label} | Observer avg: ${obsScore}/100 (delta: ${diffStr})`;
    }
    return `- ${name} (${d}): ${score}/100 → ${label}`;
  });

  const hasObserver = observerAvgScores && Object.keys(observerAvgScores).length > 0;

  // Classify observer deltas for use in the prompt
  let deltaAnalysis = "";
  if (hasObserver && observerAvgScores) {
    const blindSpots: string[] = [];
    const hiddenStrengths: string[] = [];
    for (const d of dims) {
      if (observerAvgScores[d] === undefined) continue;
      const diff = Math.round(selfScores[d] - observerAvgScores[d]);
      const name = (isHu ? DIM_NAMES_HU : DIM_NAMES_EN)[d] ?? d;
      if (diff >= 10) blindSpots.push(`${name} (${d}): te ${Math.round(selfScores[d])}/100, mások ${Math.round(observerAvgScores[d])}/100, eltérés: +${diff}`);
      else if (diff <= -10) hiddenStrengths.push(`${name} (${d}): te ${Math.round(selfScores[d])}/100, mások ${Math.round(observerAvgScores[d])}/100, eltérés: ${diff}`);
    }

    if (blindSpots.length > 0 || hiddenStrengths.length > 0) {
      deltaAnalysis = isHu
        ? `\nÖnismeret vs. mások képe:\n${blindSpots.length > 0 ? `Vak foltok (te magasabbra értékeled magad, mint mások látnak):\n${blindSpots.map((s) => `  - ${s}`).join("\n")}` : ""}${hiddenStrengths.length > 0 ? `\nRejtett erősségek (mások magasabbra értékelnek, mint te magad):\n${hiddenStrengths.map((s) => `  - ${s}`).join("\n")}` : ""}\n`
        : `\nSelf-image vs. how others see you:\n${blindSpots.length > 0 ? `Blind spots (you rate yourself higher than others do):\n${blindSpots.map((s) => `  - ${s}`).join("\n")}` : ""}${hiddenStrengths.length > 0 ? `\nHidden strengths (others rate you higher than you rate yourself):\n${hiddenStrengths.map((s) => `  - ${s}`).join("\n")}` : ""}\n`;
    }
  }

  const observerSectionHu = hasObserver
    ? `\n## 👁 Hogyan látnak mások?\nElemezd a vak foltokat és rejtett erősségeket (ha vannak). Minden tételnél egy bullet:\n- **Vak folt – Dimenzió neve**: mit jelent, hogy mások alacsonyabban látják ezt a területet; milyen viselkedés okozhatja; miért érdemes megvizsgálni.\n- **Rejtett erősség – Dimenzió neve**: mit jelent, hogy mások erősebbnek látnak ezen a területen; hogyan hasznosítható ez az önbizalom építésében.\nHa nincs legalább 10 pontos eltérés egyik dimenzióban sem, hagyd ki ezt a szekciót.\n`
    : "";

  const observerSectionEn = hasObserver
    ? `\n## 👁 How Others See You\nAnalyze blind spots and hidden strengths (if any). One bullet per item:\n- **Blind spot – Dimension name**: what it means that others rate this area lower; what behavior might cause it; why it's worth exploring.\n- **Hidden strength – Dimension name**: what it means that others rate this area higher; how this can build confidence.\nIf no dimension has ≥10 point discrepancy, omit this section entirely.\n`
    : "";

  const subScoreLines = buildSubScoreLines(selfScores, selfFacets, selfAspects, isHu);

  if (isHu) {
    return `Te egy tapasztalt coach asszisztens vagy. Az alábbi személyiségprofil alapján készíts coaching debrief anyagot magyar nyelven. Pontosan az alábbi szekció-struktúrát és fejléc-formátumokat kövesd — ez fontos a megjelenítés szempontjából.

Teszt típus: ${testType}
Profil dimenziói:
${profileLines.join("\n")}
${subScoreLines}${deltaAnalysis}
---

Készítsd el a debrief-et pontosan ezekkel a szekció-fejlécekkel (## jelöléssel), ebben a sorrendben:

## Összefoglalás
2-3 mondatos összefoglaló a profil legfontosabb mintázatairól. Ha van observer adat, a vak foltokat és rejtett erősségeket is emeld be természetesen a képbe. Konkrét és személyes — kerüld az általánosságokat.

## ✓ Erősségek
A profil 2-3 legfontosabb erőssége. Ha mások is megerősítik (observer megerősíti), jelezd. Minden erősséghez egy bullet: **Dimenzió neve (pontszám/100)**: mit jelent a viselkedésben, miért előny, miben nyilvánul meg.

## ⚠ Fejlesztési területek
A profil 2-3 leginkább fejlesztendő területe. Ha van vak folt (önértékelés > observer 10+ ponttal), az legyen az első — ezek a legfontosabb coaching témák. Minden területhez egy bullet: **Dimenzió neve (pontszám/100)**: mit jelent, mi a konkrét kockázata, milyen helyzetekben okozhat problémát.
${observerSectionHu}
## → Következő lépések
3-4 konkrét, rögtön alkalmazható cselekvési javaslat. Számozva. Ha van vak folt, legalább egy javaslat kapcsolódjon a mások visszajelzésének feldolgozásához.

## ? Coaching kérdések
5 mélyreható reflexiós kérdés a coach számára. Számozva. Ha van vak folt vagy rejtett erősség, legalább 2 kérdés ezekre fókuszáljon.

---

Szabályok: Pontosan a fenti fejléceket használd (## jelöléssel, az emoji-kkal együtt). Ne használj ### alcímeket. Ne ismételd ugyanazokat a gondolatokat több szekcióban. Stílus: szakmai, empatikus, cselekvésorientált.`;
  }

  return `You are an experienced coaching assistant. Based on the personality profile below, create a coaching debrief in English. Follow the exact section structure and heading format — this matters for rendering.

Test type: ${testType}
Profile dimensions:
${profileLines.join("\n")}
${subScoreLines}${deltaAnalysis}
---

Create the debrief with exactly these section headings (## format), in this order:

## Summary
2-3 sentences on the most important patterns in this profile. If observer data exists, weave in blind spots and hidden strengths naturally. Be specific and personal — avoid generic statements.

## ✓ Strengths
The 2-3 most important strengths. Note if observers confirm them. One bullet per strength: **Dimension name (score/100)**: what this means in behavior, why it's an advantage, how it shows up.

## ⚠ Development Areas
The 2-3 areas most in need of development. If there are blind spots (self > observer by 10+), list those first — they are the highest-priority coaching topics. One bullet per area: **Dimension name (score/100)**: what this means, what the concrete risk is, in which situations it causes problems.
${observerSectionEn}
## → Next Steps
3-4 concrete, immediately applicable action suggestions. Numbered. If there are blind spots, at least one suggestion should address integrating others' feedback.

## ? Coaching Questions
5 deep reflective questions. Numbered. If there are blind spots or hidden strengths, at least 2 questions should focus on these.

---

Rules: Use exactly the headings above (## format, including emojis). No ### subheadings within sections. Do not repeat the same ideas across sections. Style: professional, empathic, action-oriented.`;
}

// ─── RecommendationBlocks context ────────────────────────────────────────────

async function fetchRecommendationContext(
  testType: string,
  selfScores: Record<string, number>,
  locale: string
): Promise<string | null> {
  const dims = Object.keys(selfScores).sort();
  const blocks = await prisma.recommendationBlock.findMany({
    where: {
      dimensionCode: { in: dims },
      scoreRange: {
        in: dims.map((d) => {
          const level = categorizeScore(selfScores[d]);
          return level === "h" ? "HIGH" : level === "l" ? "LOW" : "MED";
        }),
      },
      OR: [{ testType }, { testType: "ALL" }],
      locale,
    },
    select: { dimensionCode: true, scoreRange: true, content: true },
  });

  if (blocks.length === 0) return null;

  const lines = blocks.map((b) => {
    const content = b.content as Record<string, unknown>;
    return `[${b.dimensionCode} ${b.scoreRange}] ${JSON.stringify(content)}`;
  });

  return lines.join("\n");
}

// ─── Main generate function ───────────────────────────────────────────────────

export async function generateCoachOutput(opts: {
  coachId: string;
  clientId: string;
  testType: string;
  selfScores: Record<string, number>;
  observerAvgScores?: Record<string, number> | null;
  selfFacets?: Record<string, Record<string, number>> | null;
  selfAspects?: Record<string, Record<string, number>> | null;
  locale?: string;
}): Promise<{ content: string; cacheKey: string; cached: boolean }> {
  const { coachId, clientId, testType, selfScores, observerAvgScores, selfFacets, selfAspects, locale = "hu" } = opts;

  const cacheKey = buildCacheKey(testType, selfScores, observerAvgScores);

  // Cache hit
  const existing = await prisma.generatedOutput.findUnique({
    where: { cacheKey },
    select: { id: true, content: true },
  });

  if (existing) {
    await prisma.generatedOutput.update({
      where: { id: existing.id },
      data: { hitCount: { increment: 1 } },
    });
    return { content: existing.content, cacheKey, cached: true };
  }

  // Cache miss — build prompt with optional recommendation blocks
  const recContext = await fetchRecommendationContext(testType, selfScores, locale);
  let prompt = buildPrompt(testType, selfScores, observerAvgScores ?? null, locale, selfFacets, selfAspects);

  if (recContext) {
    prompt +=
      locale === "hu"
        ? `\n\nKiegészítő kontextus a tartalom-könyvtárból:\n${recContext}`
        : `\n\nAdditional context from the content library:\n${recContext}`;
  }

  // Call Claude API (streaming to avoid timeout on longer outputs)
  const MODEL = "claude-opus-4-6";
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });
  const response = await stream.finalMessage();

  const textBlock = response.content.find((b) => b.type === "text");
  const generatedContent = textBlock?.type === "text" ? textBlock.text : "";

  // Save to cache
  const saved = await prisma.generatedOutput.create({
    data: {
      coachId,
      clientId,
      cacheKey,
      content: generatedContent,
      model: MODEL,
    },
    select: { content: true },
  });

  return { content: saved.content, cacheKey, cached: false };
}
