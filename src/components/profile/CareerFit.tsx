import type { Locale } from "@/lib/i18n";

interface CareerFitProps {
  dimensions: Record<string, number>; // dimCode → 0-100 score
  locale: Locale;
}

interface CareerRole {
  id: string;
  hu: string;
  en: string;
  descHu: string;
  descEn: string;
  /** positive weight per dim: higher score boosts this role */
  boosts: Partial<Record<string, number>>;
  /** negative weight per dim: higher score reduces this role */
  reduces?: Partial<Record<string, number>>;
}

const ROLES: CareerRole[] = [
  {
    id: "project_management",
    hu: "Projektmenedzsment",
    en: "Project Management",
    descHu: "Strukturált tervezés, határidők kezelése, csapatok koordinálása.",
    descEn: "Structured planning, deadline management, coordinating teams.",
    boosts: { C: 1.5, X: 0.5, A: 0.5 },
  },
  {
    id: "hr_people",
    hu: "HR / Emberierőforrás",
    en: "HR / People Operations",
    descHu: "Emberek fejlesztése, szervezeti kultúra, tehetséggondozás.",
    descEn: "People development, organizational culture, talent management.",
    boosts: { A: 1.5, X: 0.8, H: 0.7 },
  },
  {
    id: "research_analysis",
    hu: "Kutatás és elemzés",
    en: "Research & Analysis",
    descHu: "Mélyreható vizsgálatok, adatelemzés, komplex összefüggések feltárása.",
    descEn: "In-depth investigation, data analysis, uncovering complex patterns.",
    boosts: { O: 1.5, C: 0.8 },
    reduces: { X: 0.5 },
  },
  {
    id: "compliance_audit",
    hu: "Compliance / Audit",
    en: "Compliance / Audit",
    descHu: "Szabályok betartása, etikai felügyelet, szervezeti megfelelőség.",
    descEn: "Rule adherence, ethical oversight, organizational compliance.",
    boosts: { H: 1.5, C: 1.2 },
    reduces: { O: 0.4 },
  },
  {
    id: "sales_bd",
    hu: "Értékesítés / Üzletfejlesztés",
    en: "Sales / Business Development",
    descHu: "Kapcsolatépítés, tárgyalás, üzleti lehetőségek azonosítása.",
    descEn: "Relationship building, negotiation, identifying business opportunities.",
    boosts: { X: 1.5, A: 0.5 },
    reduces: { E: 0.4 },
  },
  {
    id: "innovation_design",
    hu: "Innováció / Design",
    en: "Innovation / Design",
    descHu: "Új megközelítések, kreatív problémamegoldás, kísérletezés.",
    descEn: "New approaches, creative problem-solving, experimentation.",
    boosts: { O: 1.5, X: 0.5 },
    reduces: { C: 0.3 },
  },
  {
    id: "counseling_coaching",
    hu: "Tanácsadás / Coaching",
    en: "Counseling / Coaching",
    descHu: "Mások fejlődésének támogatása, empátia, aktív meghallgatás.",
    descEn: "Supporting others' growth, empathy, active listening.",
    boosts: { E: 1.0, A: 1.2, H: 0.5 },
  },
  {
    id: "operations",
    hu: "Operations / Folyamatfejlesztés",
    en: "Operations / Process Improvement",
    descHu: "Hatékonyság növelése, standardizáció, rendszerek karbantartása.",
    descEn: "Efficiency gains, standardization, system maintenance.",
    boosts: { C: 1.5, H: 0.5 },
    reduces: { O: 0.5 },
  },
  {
    id: "technical_engineering",
    hu: "Mérnöki / Technikai",
    en: "Engineering / Technical",
    descHu: "Precíz megvalósítás, technikai problémamegoldás, rendszerépítés.",
    descEn: "Precise implementation, technical problem-solving, system building.",
    boosts: { C: 1.2, O: 0.8 },
    reduces: { E: 0.4, X: 0.3 },
  },
  {
    id: "leadership",
    hu: "Vezetés / Menedzsment",
    en: "Leadership / Management",
    descHu: "Irány kijelölése, emberek motiválása, szervezeti döntéshozatal.",
    descEn: "Setting direction, motivating people, organizational decision-making.",
    boosts: { X: 1.2, C: 0.8, H: 0.5 },
    reduces: { E: 0.5 },
  },
];

function computeRoles(
  dims: Record<string, number>,
): CareerRole[] {
  const scored = ROLES.map((role) => {
    let score = 0;
    for (const [dim, weight] of Object.entries(role.boosts)) {
      const d = dims[dim] ?? 50;
      score += ((d - 50) / 50) * (weight ?? 0);
    }
    for (const [dim, weight] of Object.entries(role.reduces ?? {})) {
      const d = dims[dim] ?? 50;
      score -= ((d - 50) / 50) * (weight ?? 0);
    }
    return { role, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => s.role);
}

// Fit strength: normalized relative to other roles
function fitStrength(role: CareerRole, dims: Record<string, number>): number {
  let score = 0;
  for (const [dim, weight] of Object.entries(role.boosts)) {
    score += ((dims[dim] ?? 50) / 100) * (weight ?? 0);
  }
  return Math.min(100, Math.round((score / 2) * 100));
}

export function CareerFit({ dimensions, locale }: CareerFitProps) {
  const isHu = locale === "hu";
  const topRoles = computeRoles(dimensions);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {topRoles.map((role, idx) => {
        const strength = fitStrength(role, dimensions);
        return (
          <div
            key={role.id}
            className="rounded-2xl border border-sand bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-ink">
                {isHu ? role.hu : role.en}
              </h3>
              <span className="shrink-0 rounded-full bg-sage-ghost px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-bronze">
                #{idx + 1}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-ink-body mb-3">
              {isHu ? role.descHu : role.descEn}
            </p>
            {/* Fit bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-sage"
                  style={{ width: `${Math.max(20, strength)}%` }}
                />
              </div>
              <span className="shrink-0 font-mono text-[10px] text-muted">
                {isHu ? "Illeszkedés" : "Fit"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
