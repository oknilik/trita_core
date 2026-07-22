import type { TestType } from "@prisma/client";
import { runProfileEngine } from "@/lib/profile-engine";
import {
  RESOLUTION_NARRATIVES, BLOCK3_SUMMARIES,
  SOLO_DIM_NARRATIVES,
  ROLE_TEXTS, SOLO_DIM_ROLE_TEXTS,
  getEnvRows,
} from "@/lib/profile-content";
import type { Locale } from "@/lib/i18n";

// Munkastílus-tartalom (Ahogy működsz / Ideális környezet / Szerep-illeszkedés)
// közös generátora — a saját eredmény-oldal és a megosztott (/share/[token])
// nézet ugyanebből dolgozik, hogy a két felület soha ne csússzon szét.

export interface WorkstyleContent {
  howYouWork: string[];
  envItems: { label: string; value: string }[];
  roleFit: {
    strong: string;
    might: string;
    prep: string;
    strongRoles?: string[];
    mightRoles?: string[];
    prepRoles?: string[];
  };
  takeaways: string[];
}

// Role tags — concrete position names per content key
const ROLE_TAGS: Record<string, Record<string, { strong: string[]; might: string[]; prep: string[] }>> = {
  hu: {
    resilientLeader: { strong: ["Vezető", "Értékesítési vezető", "Kríziskoordinátor", "Változásmenedzsment"], might: ["Projektvezetés", "Ügyfélkapcsolat"], prep: ["Hosszú egyéni fókusz", "Izolált munkakörök"] },
    supportedVisibility: { strong: ["Ügyfélkapcsolat", "Tréning", "HR"], might: ["Prezentáció", "Facilitáció"], prep: ["Izolált munka", "Magas nyomás"] },
    structuredStability: { strong: ["Minőségbiztosítás", "Adminisztráció", "Compliance"], might: ["Projektmenedzsment", "Tanácsadás"], prep: ["Startup", "Változékony környezet"] },
    safeExperimentation: { strong: ["Design Thinking", "Prototípus-készítés", "Innováció"], might: ["Tanácsadás", "Stratégia"], prep: ["Határidő-kritikus végrehajtás"] },
    deepCollaboration: { strong: ["Kiscsapatos kutatás", "Mentorálás", "Páros munka"], might: ["Tanácsadás", "Szakértő"], prep: ["Vállalati networking"] },
    solitaryInnovator: { strong: ["Kutató", "Elemző", "Architect"], might: ["Tanácsadás", "Design"], prep: ["Csapatmunka", "Gyakori meetingek"] },
    facilitatedInnovation: { strong: ["Workshop-facilitálás", "Design Thinking", "Változásmenedzsment"], might: ["Projektmenedzsment", "Oktatás"], prep: ["Top-down döntéshozatal"] },
    responsibleInnovator: { strong: ["Fenntarthatóság", "K+F", "Társadalmi innováció"], might: ["Stratégia", "Termékfejlesztés"], prep: ["Gyors kompromisszum"] },
  },
  en: {
    resilientLeader: { strong: ["Leader", "Sales Lead", "Crisis Coordinator", "Change Management"], might: ["Project Management", "Client Relations"], prep: ["Long solo focus", "Isolated roles"] },
    supportedVisibility: { strong: ["Client Relations", "Training", "HR"], might: ["Presenting", "Facilitation"], prep: ["Isolated work", "High pressure"] },
    structuredStability: { strong: ["Quality Assurance", "Admin", "Compliance"], might: ["Project Management", "Consulting"], prep: ["Startup", "Volatile environment"] },
    safeExperimentation: { strong: ["Design Thinking", "Prototyping", "Innovation"], might: ["Consulting", "Strategy"], prep: ["Deadline-critical execution"] },
    deepCollaboration: { strong: ["Small-team Research", "Mentoring", "Pair work"], might: ["Consulting", "Expert"], prep: ["Corporate networking"] },
    solitaryInnovator: { strong: ["Researcher", "Analyst", "Architect"], might: ["Consulting", "Design"], prep: ["Teamwork", "Frequent meetings"] },
    facilitatedInnovation: { strong: ["Workshop Facilitation", "Design Thinking", "Change Management"], might: ["Project Management", "Education"], prep: ["Top-down decision-making"] },
    responsibleInnovator: { strong: ["Sustainability", "R&D", "Social Innovation"], might: ["Strategy", "Product Development"], prep: ["Quick compromise"] },
  },
};

// Solo dim role tags fallback
const SOLO_ROLE_TAGS: Record<string, Record<string, { strong: string[]; might: string[]; prep: string[] }>> = {
  hu: {
    H_high: { strong: ["Compliance", "Etika", "Nonprofit", "Közszféra"], might: ["Vezetés", "Szakértő"], prep: ["Versengő üzlet"] },
    H_low: { strong: ["Üzletfejlesztés", "Értékesítés", "Growth", "Vállalkozás"], might: ["Vezetés", "Stratégia"], prep: ["Csapatépítés"] },
    E_high: { strong: ["HR", "Coaching", "Egészségügy", "Ügyfélélmény"], might: ["Oktatás", "Tárgyalás"], prep: ["Magas nyomás", "Krízis"] },
    E_low: { strong: ["Krízismenedzsment", "Döntéshozatal", "Vezetés"], might: ["Változásvezetés", "Startup"], prep: ["Empatikus közeg"] },
    X_high: { strong: ["Értékesítés", "Csapatvezetés", "PR", "Facilitáció"], might: ["Projektvezetés", "Oktatás"], prep: ["Egyéni mélyülés"] },
    X_low: { strong: ["Kutatás", "Elemzés", "Tervezés", "Írás"], might: ["Tanácsadás", "Szakértő"], prep: ["Networking", "Prezentáció"] },
    A_high: { strong: ["Csapatépítés", "Facilitáció", "Coaching"], might: ["Értékesítés", "Partnerség"], prep: ["Konfliktusos közeg"] },
    A_low: { strong: ["Tárgyalás", "Stratégia", "Döntéshozatal"], might: ["Kutatás", "Elemzés"], prep: ["Harmonikus csapat"] },
    C_high: { strong: ["Projektvezetés", "Minőségbiztosítás", "Műveletek"], might: ["Compliance", "Szakértő"], prep: ["Improvizáció"] },
    C_low: { strong: ["Innováció", "Startup", "Design"], might: ["Tanácsadás", "Stratégia"], prep: ["Strukturált végrehajtás"] },
    O_high: { strong: ["Kutatás", "Innováció", "Stratégia", "Design"], might: ["Tanácsadás", "Oktatás"], prep: ["Rutin feladatok"] },
    O_low: { strong: ["Végrehajtás", "Adminisztráció", "Műveletek"], might: ["Vezetés", "Projektmenedzsment"], prep: ["Kísérletezés"] },
  },
  en: {
    H_high: { strong: ["Compliance", "Ethics", "Nonprofit", "Public Service"], might: ["Leadership", "Expert"], prep: ["Competitive business"] },
    H_low: { strong: ["Business Development", "Sales", "Growth", "Entrepreneurship"], might: ["Leadership", "Strategy"], prep: ["Team building"] },
    E_high: { strong: ["HR", "Coaching", "Healthcare", "CX"], might: ["Education", "Negotiation"], prep: ["High pressure", "Crisis"] },
    E_low: { strong: ["Crisis Management", "Decision-making", "Leadership"], might: ["Change Leadership", "Startup"], prep: ["Empathetic context"] },
    X_high: { strong: ["Sales", "Team Leadership", "PR", "Facilitation"], might: ["Project Management", "Education"], prep: ["Deep solo work"] },
    X_low: { strong: ["Research", "Analysis", "Design", "Writing"], might: ["Consulting", "Expert"], prep: ["Networking", "Presentations"] },
    A_high: { strong: ["Team Building", "Facilitation", "Coaching"], might: ["Sales", "Partnership"], prep: ["Conflict-heavy"] },
    A_low: { strong: ["Negotiation", "Strategy", "Decision-making"], might: ["Research", "Analysis"], prep: ["Harmonious team"] },
    C_high: { strong: ["Project Management", "QA", "Operations"], might: ["Compliance", "Expert"], prep: ["Improvisation"] },
    C_low: { strong: ["Innovation", "Startup", "Design"], might: ["Consulting", "Strategy"], prep: ["Structured execution"] },
    O_high: { strong: ["Research", "Innovation", "Strategy", "Design"], might: ["Consulting", "Education"], prep: ["Routine tasks"] },
    O_low: { strong: ["Execution", "Administration", "Operations"], might: ["Leadership", "PM"], prep: ["Experimentation"] },
  },
};

export function buildWorkstyleContent(
  dimScores: Record<string, number>,
  testType: TestType,
  lang: Locale,
): WorkstyleContent {
  const engine = runProfileEngine(dimScores, testType);

  // "Ahogy működsz" narratives
  const howYouWork: string[] = [];
  // Add tension pair narratives (block 6)
  for (const pair of engine.block6Pairs) {
    const narrative = RESOLUTION_NARRATIVES[pair.contentKey]?.[lang];
    if (narrative) howYouWork.push(narrative);
  }
  // Add solo dim narratives if no tension pairs
  if (howYouWork.length === 0) {
    for (const sd of engine.topSoloDims) {
      const key = `${sd.dim}_${sd.level}`;
      const text = SOLO_DIM_NARRATIVES[key]?.[lang];
      if (text) howYouWork.push(text);
    }
  }
  // Add risk texts (block 7)
  for (const pair of engine.block7Pairs) {
    const summary = BLOCK3_SUMMARIES[pair.contentKey]?.[lang];
    if (summary) howYouWork.push(summary);
  }

  // Role fit texts
  const roleFitSource = engine.block6Pairs[0]?.contentKey
    ?? (engine.topSoloDims[0] ? `${engine.topSoloDims[0].dim}_${engine.topSoloDims[0].level}` : null);
  const roleTexts = roleFitSource
    ? (ROLE_TEXTS[roleFitSource]?.[lang] ?? SOLO_DIM_ROLE_TEXTS[roleFitSource]?.[lang])
    : null;
  const roleTags = roleFitSource
    ? (ROLE_TAGS[lang]?.[roleFitSource] ?? SOLO_ROLE_TAGS[lang]?.[roleFitSource])
    : null;

  // Environment rows
  const envItems = getEnvRows(engine.categories).map((r) => ({
    label: r.label[lang],
    value: r.value[lang],
  }));

  // Takeaways (block 6 summaries)
  const takeaways: string[] = [];
  for (const pair of engine.block6Pairs) {
    const text = BLOCK3_SUMMARIES[pair.contentKey]?.[lang];
    if (text) takeaways.push(text);
  }
  if (takeaways.length === 0) {
    for (const sd of engine.topSoloDims) {
      const key = `${sd.dim}_${sd.level}`;
      const text = SOLO_DIM_NARRATIVES[key]?.[lang];
      if (text) takeaways.push(text);
    }
  }

  return {
    howYouWork,
    envItems,
    roleFit: {
      strong: roleTexts?.strong ?? "",
      might: roleTexts?.medium ?? "",
      prep: roleTexts?.watchOut ?? "",
      strongRoles: roleTags?.strong,
      mightRoles: roleTags?.might,
      prepRoles: roleTags?.prep,
    },
    takeaways,
  };
}
