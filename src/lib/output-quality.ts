export type ParsedSection = { heading: string; lines: string[] };

export type OutputAuditResult = {
  score: number;
  structureScore: number;
  specificityScore: number;
  actionScore: number;
  naturalnessScore: number;
  reasons: string[];
};

const REQUIRED_HEADINGS_HU = [
  "## Összefoglalás",
  "## ✓ Erősségek",
  "## ⚠ Fejlesztési területek",
  "## → Következő lépések",
  "## ? Coaching kérdések",
] as const;

const REQUIRED_HEADINGS_EN = [
  "## Summary",
  "## ✓ Strengths",
  "## ⚠ Development Areas",
  "## → Next Steps",
  "## ? Coaching Questions",
] as const;

const STATIC_PHRASES: Record<"hu" | "en", string[]> = {
  hu: [
    "összességében elmondható",
    "fontos, hogy",
    "érdemes lehet",
    "általánosságban",
    "mindent összevetve",
    "alapvetően",
    "jó kiindulópont lehet",
  ],
  en: [
    "overall it can be said",
    "it is important to",
    "it may be worth",
    "in general",
    "all things considered",
    "as a starting point",
  ],
};

const ACTION_WORDS: Record<"hu" | "en", string[]> = {
  hu: [
    "próbáld",
    "írd",
    "kérdezd",
    "figyeld",
    "gyakorold",
    "tervezd",
    "vállald",
    "elemezd",
    "beszéld",
    "egyeztesd",
    "jegyezd",
  ],
  en: [
    "try",
    "write",
    "ask",
    "observe",
    "practice",
    "plan",
    "commit",
    "analyze",
    "discuss",
    "schedule",
    "track",
  ],
};

const SITUATION_MARKERS: Record<"hu" | "en", string[]> = {
  hu: [
    "amikor",
    "helyzetben",
    "például",
    "konkrétan",
    "tipikusan",
    "gyakran",
    "konfliktus",
    "megbeszélés",
    "visszajelzés",
  ],
  en: [
    "when",
    "in situations",
    "for example",
    "specifically",
    "typically",
    "often",
    "conflict",
    "meeting",
    "feedback",
  ],
};

const MEASUREMENT_MARKERS: Record<"hu" | "en", string[]> = {
  hu: [
    "naponta",
    "hetente",
    "alkalom",
    "időpont",
    "határidő",
    "mérd",
    "visszajelzés",
  ],
  en: [
    "daily",
    "weekly",
    "times",
    "schedule",
    "deadline",
    "measure",
    "feedback",
  ],
};

function localeKey(locale: string): "hu" | "en" {
  return locale === "hu" ? "hu" : "en";
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function requiredHeadingsForLocale(locale: string): readonly string[] {
  return locale === "hu" ? REQUIRED_HEADINGS_HU : REQUIRED_HEADINGS_EN;
}

export function validateGeneratedContent(content: string, locale: string): string[] {
  const errors: string[] = [];
  const trimmed = content.trim();

  if (!trimmed) {
    errors.push("empty response");
    return errors;
  }

  if (trimmed.length < 220) {
    errors.push(`too short (${trimmed.length} chars)`);
  }

  const requiredHeadings = requiredHeadingsForLocale(locale);
  const missingHeadings = requiredHeadings.filter((heading) => !trimmed.includes(heading));
  if (missingHeadings.length > 0) {
    errors.push(`missing headings: ${missingHeadings.join(", ")}`);
  }

  return errors;
}

function parseSections(content: string): ParsedSection[] {
  const lines = content.split("\n");
  const sections: ParsedSection[] = [];
  let currentHeading = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentHeading || currentLines.length > 0) {
        sections.push({ heading: currentHeading, lines: currentLines });
      }
      currentHeading = line.trim();
      currentLines = [];
      continue;
    }
    if (line.startsWith("---")) continue;
    currentLines.push(line);
  }

  if (currentHeading || currentLines.length > 0) {
    sections.push({ heading: currentHeading, lines: currentLines });
  }

  return sections;
}

function findSection(sections: ParsedSection[], pattern: RegExp): ParsedSection | null {
  return sections.find((s) => pattern.test(s.heading)) ?? null;
}

function countNumbered(lines: string[]): number {
  return lines.filter((l) => /^\s*\d+\.\s+/.test(l)).length;
}

function countBullets(lines: string[]): number {
  return lines.filter((l) => /^\s*[-*]\s+/.test(l)).length;
}

function normalizeSentence(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[“”"„]/g, "")
    .replace(/\s+/g, " ");
}

function keywordMatches(text: string, words: string[]): number {
  if (words.length === 0) return 0;
  const pattern = new RegExp(`\\b(${words.map(escapeRegex).join("|")})\\b`, "gi");
  return (text.match(pattern) ?? []).length;
}

export function auditGeneratedContent(content: string, locale: string): OutputAuditResult {
  const reasons: string[] = [];
  const sections = parseSections(content);
  const requiredHeadings = requiredHeadingsForLocale(locale);
  const lang = localeKey(locale);

  let structureScore = 30;
  let specificityScore = 20;
  let actionScore = 20;
  let naturalnessScore = 30;

  for (const heading of requiredHeadings) {
    if (!content.includes(heading)) {
      structureScore -= 6;
      reasons.push(`Missing heading: ${heading}`);
    }
  }

  const strengths = findSection(sections, /erősség|strength/i);
  const development = findSection(sections, /fejlesztési|development/i);
  const nextSteps = findSection(sections, /következő lépések|next steps/i);
  const questions = findSection(sections, /coaching kérdések|coaching questions/i);

  const strengthsBullets = strengths ? countBullets(strengths.lines) : 0;
  const devBullets = development ? countBullets(development.lines) : 0;
  const nextStepsCount = nextSteps ? countNumbered(nextSteps.lines) : 0;
  const questionsCount = questions ? countNumbered(questions.lines) : 0;

  if (strengthsBullets < 2 || strengthsBullets > 4) {
    structureScore -= 4;
    reasons.push(`Strength bullets out of target (2-4): ${strengthsBullets}`);
  }
  if (devBullets < 2 || devBullets > 4) {
    structureScore -= 4;
    reasons.push(`Development bullets out of target (2-4): ${devBullets}`);
  }
  if (nextStepsCount < 3 || nextStepsCount > 5) {
    structureScore -= 4;
    reasons.push(`Next step count out of target (3-5): ${nextStepsCount}`);
  }
  if (questionsCount < 5) {
    structureScore -= 4;
    reasons.push(`Coaching question count below 5: ${questionsCount}`);
  }

  const dimScoreMentions = (content.match(/\(\d{1,3}\/100\)/g) ?? []).length;
  if (dimScoreMentions >= 4) {
    specificityScore += 0;
  } else if (dimScoreMentions >= 2) {
    specificityScore -= 5;
    reasons.push(`Low number of explicit score mentions: ${dimScoreMentions}`);
  } else {
    specificityScore -= 9;
    reasons.push(`Very low explicit score mentions: ${dimScoreMentions}`);
  }

  const situationMarkers = keywordMatches(content.toLowerCase(), SITUATION_MARKERS[lang]);
  if (situationMarkers < 3) {
    specificityScore -= 5;
    reasons.push(`Too few concrete situation markers: ${situationMarkers}`);
  }

  const nextStepLines = nextSteps?.lines.filter((l) => /^\s*\d+\.\s+/.test(l)).map((l) => l.toLowerCase()) ?? [];
  const actionWordHits = nextStepLines.reduce((acc, line) => {
    return acc + (ACTION_WORDS[lang].some((w) => line.includes(w)) ? 1 : 0);
  }, 0);

  if (nextStepsCount < 3) actionScore -= 8;
  if (actionWordHits < Math.min(3, nextStepLines.length)) {
    actionScore -= 6;
    reasons.push(`Next steps are not action-oriented enough (action verb hits: ${actionWordHits}/${nextStepLines.length}).`);
  }

  const measurementMarkers = keywordMatches(nextStepLines.join(" "), MEASUREMENT_MARKERS[lang]);
  if (measurementMarkers < 1) {
    actionScore -= 3;
    reasons.push("Next steps lack measurable or time-bound cues.");
  }

  const words = (content.toLowerCase().match(/\p{L}+/gu) ?? []).filter((w) => w.length > 1);
  const uniqueWords = new Set(words);
  const lexicalRatio = words.length > 0 ? uniqueWords.size / words.length : 0;
  if (lexicalRatio < 0.34) {
    naturalnessScore -= 9;
    reasons.push(`Low lexical variety (${lexicalRatio.toFixed(2)}).`);
  } else if (lexicalRatio < 0.4) {
    naturalnessScore -= 4;
    reasons.push(`Moderate lexical variety (${lexicalRatio.toFixed(2)}).`);
  }

  const sentences = content
    .split(/[.!?]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const sentenceWordCounts = sentences.map((s) => (s.match(/\p{L}+/gu) ?? []).length);
  const avgSentenceLen = sentenceWordCounts.length > 0
    ? sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length
    : 0;
  if (avgSentenceLen < 7 || avgSentenceLen > 26) {
    naturalnessScore -= 5;
    reasons.push(`Sentence rhythm is less natural (avg words/sentence: ${avgSentenceLen.toFixed(1)}).`);
  }

  const duplicates = new Map<string, number>();
  for (const sentence of sentences) {
    const normalized = normalizeSentence(sentence);
    if (normalized.length < 30) continue;
    duplicates.set(normalized, (duplicates.get(normalized) ?? 0) + 1);
  }
  const duplicateSentenceCount = Array.from(duplicates.values()).filter((n) => n > 1).length;
  if (duplicateSentenceCount > 0) {
    naturalnessScore -= Math.min(9, duplicateSentenceCount * 3);
    reasons.push(`Repeated sentence patterns detected: ${duplicateSentenceCount}.`);
  }

  const textLower = content.toLowerCase();
  const staticPhraseCount = STATIC_PHRASES[lang].reduce((acc, phrase) => {
    return acc + Math.max(0, textLower.split(phrase).length - 1);
  }, 0);
  if (staticPhraseCount > 1) {
    naturalnessScore -= Math.min(10, staticPhraseCount * 2);
    reasons.push(`Static phrase overuse: ${staticPhraseCount}.`);
  }

  structureScore = Math.max(0, Math.min(30, structureScore));
  specificityScore = Math.max(0, Math.min(20, specificityScore));
  actionScore = Math.max(0, Math.min(20, actionScore));
  naturalnessScore = Math.max(0, Math.min(30, naturalnessScore));

  const score = structureScore + specificityScore + actionScore + naturalnessScore;
  return { score, structureScore, specificityScore, actionScore, naturalnessScore, reasons };
}

