import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import { getSelfAccessLevel } from "@/lib/access";
import type { ScoreResult } from "@/lib/scoring";
import { InvitationStatus, type TestType } from "@prisma/client";
import type { AccessLevel } from "@/lib/access";
import { runProfileEngine } from "@/lib/profile-engine";
import {
  BLOCK1, BLOCK8,
  RESOLUTION_NARRATIVES, BLOCK3_SUMMARIES,
  SOLO_DIM_NARRATIVES,
  ROLE_TEXTS, SOLO_DIM_ROLE_TEXTS,
  getEnvRows,
} from "@/lib/profile-content";
import type { Locale } from "@/lib/i18n";

import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { DashboardAutoRefresh } from "@/components/dashboard/DashboardAutoRefresh";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profilod | trita",
  robots: { index: false },
};

type ProfileLevel = "start" | "plus" | "reflect";

function toProfileLevel(level: AccessLevel): ProfileLevel {
  if (level === "self_reflect") return "reflect";
  if (level === "self_plus") return "plus";
  return "start";
}

function getInsight(
  score: number,
  insights: { low: string; mid: string; high: string },
): string {
  const range = score < 40 ? "low" : score < 70 ? "mid" : "high";
  return insights[range];
}

type TabId = "results" | "comparison" | "invites";

export default async function ProfileResultsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true, email: true },
  });
  if (!profile) redirect("/sign-in");

  const [
    latestResult,
    accessLevelRaw,
    completedObserverAssessments,
    sentInvitationsRaw,
    receivedInvitationsRaw,
    draft,
    researchSurveyRecord,
  ] = await Promise.all([
    prisma.assessmentResult.findFirst({
      where: { userProfileId: profile.id, isSelfAssessment: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, scores: true, testType: true, createdAt: true },
    }),
    getSelfAccessLevel(profile.id),
    prisma.observerAssessment.findMany({
      where: {
        invitation: {
          inviterId: profile.id,
          status: InvitationStatus.COMPLETED,
        },
      },
      select: { scores: true },
    }),
    prisma.observerInvitation.findMany({
      where: { inviterId: profile.id },
      select: {
        id: true,
        token: true,
        status: true,
        createdAt: true,
        completedAt: true,
        observerEmail: true,
        assessment: { select: { relationshipType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.observerInvitation.findMany({
      where: { observerProfileId: profile.id },
      select: {
        id: true,
        token: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        completedAt: true,
        inviter: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assessmentDraft.findUnique({
      where: { userProfileId: profile.id },
      select: { answers: true, testType: true },
    }),
    prisma.researchSurvey.findFirst({
      where: { userProfileId: profile.id },
      select: { id: true },
    }),
  ]);

  if (!latestResult) {
    // If there's a draft in progress, show a "continue" page instead of redirecting
    // This prevents a redirect loop when user clicks "Continue later"
    const hasDraft = Boolean(draft);
    if (hasDraft) {
      const isHu = locale === "hu";
      return (
        <main className="-mx-4 -my-8 flex min-h-[80dvh] flex-col items-center justify-center bg-[#f7f4ef] px-6 py-16 text-center">
          <div className="w-full max-w-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f2f0]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3d6b5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <h1 className="font-fraunces text-2xl tracking-tight text-[#1a1a2e] md:text-3xl">
              {isHu ? "A teszted folyamatban van" : "Your assessment is in progress"}
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-[#8a8a9a]">
              {isHu
                ? "Mentettük a haladásodat — ott folytathatod, ahol abbahagytad."
                : "We saved your progress — you can continue where you left off."}
            </p>
            <a
              href="/assessment"
              className="mt-8 inline-flex min-h-[52px] items-center rounded-xl bg-[#3d6b5e] px-8 text-[15px] font-semibold text-white shadow-md shadow-[#3d6b5e]/20 transition-all hover:-translate-y-px hover:brightness-[1.06]"
            >
              {isHu ? "Folytatom a tesztet →" : "Continue assessment →"}
            </a>
          </div>
        </main>
      );
    }
    redirect("/assessment");
  }

  const scores = latestResult.scores as ScoreResult;
  if (scores.type !== "likert") redirect("/assessment");

  const testType = latestResult.testType as TestType;
  const config = getTestConfig(testType, locale);
  const accessLevel = toProfileLevel(accessLevelRaw);

  // ── Draft info ─────────────────────────────────────────────────────────────
  const draftAnsweredCount = draft
    ? Object.keys(draft.answers as Record<string, number>).length
    : 0;
  const draftTotalQuestions = config.questions.length;
  const hasResearchSurvey = Boolean(researchSurveyRecord);
  const pendingInvitesCount = sentInvitationsRaw.filter(
    (inv) => inv.status === "PENDING",
  ).length;

  // ── Build serialized dimensions ────────────────────────────────────────────
  const completedObservers = completedObserverAssessments.map(
    (e) => e.scores as ScoreResult,
  );
  const hasObserverData = completedObservers.length >= 2;

  const mainDimCodes = config.dimensions
    .filter((d) => d.code !== "I")
    .map((d) => d.code);

  const observerAvg: Record<string, number> = {};
  if (hasObserverData) {
    for (const code of mainDimCodes) {
      let sum = 0;
      let count = 0;
      for (const obs of completedObservers) {
        if (obs.type === "likert" && obs.dimensions[code] != null) {
          sum += obs.dimensions[code];
          count++;
        }
      }
      observerAvg[code] = count > 0 ? Math.round(sum / count) : 0;
    }
  }

  const dimensions = config.dimensions.map((dim) => {
    const score = scores.dimensions[dim.code] ?? 0;
    const insights = (dim.insightsByLocale?.[locale] ?? dim.insights) as {
      low: string;
      mid: string;
      high: string;
    };
    return {
      code: dim.code,
      label: (dim.labelByLocale?.[locale] ?? dim.label) as string,
      labelByLocale: dim.labelByLocale,
      color: dim.color,
      score,
      insight: getInsight(score, insights),
      description: (dim.descriptionByLocale?.[locale] ?? dim.description) as string,
      descriptionByLocale: dim.descriptionByLocale,
      insights: dim.insights,
      insightsByLocale: dim.insightsByLocale,
      observerScore: hasObserverData ? (observerAvg[dim.code] ?? undefined) : undefined,
      facets: (dim.facets ?? []).map((f) => ({
        code: f.code,
        label: (f.labelByLocale?.[locale] ?? f.label) as string,
        score: scores.facets?.[dim.code]?.[f.code] ?? 0,
      })),
      aspects: (dim.aspects ?? []).map((a) => ({
        code: a.code,
        label: (a.labelByLocale?.[locale] ?? a.label) as string,
        score: scores.aspects?.[dim.code]?.[a.code] ?? 0,
      })),
    };
  });

  // ── Growth focus ───────────────────────────────────────────────────────────
  const mainDimensions = dimensions.filter((d) => d.code !== "I");

  interface GrowthItem {
    code: string;
    label: string;
    score: number;
    dimCode: string;
    dimLabel: string;
    dimColor: string;
  }

  const allFacets: GrowthItem[] = [];
  for (const dim of mainDimensions) {
    for (const f of dim.facets) {
      allFacets.push({
        code: f.code,
        label: f.label,
        score: f.score,
        dimCode: dim.code,
        dimLabel: dim.label,
        dimColor: dim.color,
      });
    }
  }
  const growthItems = allFacets
    .filter((f) => f.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const growthFallback: GrowthItem[] = mainDimensions
    .filter((d) => d.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((d) => ({
      code: d.code,
      label: d.label,
      score: d.score,
      dimCode: d.code,
      dimLabel: d.label,
      dimColor: d.color,
    }));

  const growthFocusItems = growthItems.length >= 1 ? growthItems : growthFallback;

  // ── Serialize invitations ──────────────────────────────────────────────────
  const sentInvitations = sentInvitationsRaw.map((inv) => ({
    id: inv.id,
    token: inv.token,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    completedAt: inv.completedAt?.toISOString() ?? null,
    observerEmail: inv.observerEmail ?? null,
    relationship: inv.assessment?.relationshipType ?? null,
  }));

  const receivedInvitations = receivedInvitationsRaw.map((inv) => ({
    id: inv.id,
    token: inv.token,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
    completedAt: inv.completedAt?.toISOString() ?? null,
    inviterUsername: inv.inviter?.username ?? null,
  }));

  // ── Active tab from searchParams ───────────────────────────────────────────
  const resolvedParams = await searchParams;
  const tabParam = resolvedParams?.tab;
  const initialTab: TabId =
    tabParam === "comparison" ? "comparison" :
    tabParam === "invites" ? "invites" :
    "results";

  const displayName =
    profile.username ?? profile.email ?? (locale === "hu" ? "Felhasználó" : "User");

  // ── Hero data ──────────────────────────────────────────────────────────────
  const isHu = locale === "hu";
  const highDims = mainDimensions.filter((d) => d.score >= 70);
  const lowDims = mainDimensions.filter((d) => d.score < 40);

  // Personality type label from top dimensions
  const personalityType = (() => {
    const topTwo = [...mainDimensions].sort((a, b) => b.score - a.score).slice(0, 2);
    if (topTwo.length < 2) return isHu ? "Egyedi profil" : "Unique profile";
    const labels: Record<string, { hu: string; en: string }> = {
      H: { hu: "Elvi", en: "Principled" },
      E: { hu: "Érzékeny", en: "Sensitive" },
      X: { hu: "Energikus", en: "Energetic" },
      A: { hu: "Együttműködő", en: "Cooperative" },
      C: { hu: "Rendszerező", en: "Systematic" },
      O: { hu: "Innovátor", en: "Innovator" },
    };
    const a = labels[topTwo[0].code]?.[isHu ? "hu" : "en"] ?? topTwo[0].label;
    const b = labels[topTwo[1].code]?.[isHu ? "hu" : "en"] ?? topTwo[1].label;
    return `${a} ${b}`;
  })();

  // Percentile (approximate from average score)
  const avgScore = Math.round(
    mainDimensions.reduce((s, d) => s + d.score, 0) / (mainDimensions.length || 1),
  );
  const percentile = avgScore >= 70 ? "Top 10%" : avgScore >= 60 ? "Top 25%" : "";

  // Hero insight — behavior-based sentence (not dimension names)
  const heroInsight = (() => {
    const sorted = [...mainDimensions].sort((a, b) => b.score - a.score);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];
    if (!strongest || !weakest) return "";

    const strengthVerbs: Record<string, { hu: string; en: string }> = {
      H: { hu: "Hitelesen és manipulációmentesen működsz", en: "You operate with authenticity and integrity" },
      E: { hu: "Mélyen és empatikusan kapcsolódsz másokhoz", en: "You connect deeply and empathetically with others" },
      X: { hu: "Energikusan és inspirálóan vagy jelen", en: "You bring energy and inspiration to your interactions" },
      A: { hu: "Rugalmasan és türelmesen kezeled a helyzeteket", en: "You handle situations with flexibility and patience" },
      C: { hu: "Rendszerben és felelősen működsz", en: "You work systematically and responsibly" },
      O: { hu: "Kísérletezően és stratégiailag gondolkodsz", en: "You think experimentally and strategically" },
    };
    const weakVerbs: Record<string, { hu: string; en: string }> = {
      H: { hu: "a státusz és pozíció természetesebb tereped", en: "status and positioning come more naturally to you" },
      E: { hu: "az érzelmi bevonódás kevésbé természetes tereped", en: "emotional involvement is less natural for you" },
      X: { hu: "a társas láthatóság kevésbé természetes tereped", en: "social visibility is less natural for you" },
      A: { hu: "a konfliktusos helyzetekben élesebb reakciók jellemzőek", en: "you tend to react more sharply in conflict" },
      C: { hu: "a strukturált végrehajtás kevésbé természetes tereped", en: "structured execution is less natural for you" },
      O: { hu: "a bevált módszereket részesíted előnyben", en: "you prefer established methods" },
    };

    const s = strengthVerbs[strongest.code]?.[isHu ? "hu" : "en"] ?? strongest.label;
    const w = weakVerbs[weakest.code]?.[isHu ? "hu" : "en"] ?? weakest.label.toLowerCase();
    return isHu
      ? `${s} — ${w}.`
      : `${s} — ${w}.`;
  })();

  // InsightPair
  const strengths = highDims.length > 0
    ? highDims.map((d) => d.label.toLowerCase()).join(", ") + (isHu ? " — ezek az erősségeid." : " — these are your strengths.")
    : isHu ? "Kiegyensúlyozott profil, nincs kiugró erősség." : "Balanced profile, no standout strength.";

  const watchAreas = lowDims.length > 0
    ? (isHu ? "Alacsony " : "Low ") + lowDims.map((d) => d.label.toLowerCase()).join(", ") + (isHu ? " — ezekre érdemes figyelni." : " — worth paying attention to.")
    : isHu ? "Nincs kritikusan alacsony dimenzió." : "No critically low dimension.";

  // ── Plus content (profile engine narratives) ──────────────────────────────
  const lang = (locale === "en" ? "en" : "hu") as Locale;
  const dimScores = Object.fromEntries(mainDimensions.map((d) => [d.code, d.score]));
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

  // Environment rows
  const envRows = getEnvRows(engine.categories).map((r) => ({
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

  // Role tags — concrete position names per content key
  const ROLE_TAGS: Record<string, Record<string, { strong: string[]; might: string[]; prep: string[] }>> = {
    hu: {
      resilientLeader: { strong: ["Vezető", "Értékesítési vezető", "Kríziskoordinátor", "Változásmenedzsment"], might: ["Projektvezetés", "Ügyfélkapcsolat"], prep: ["Hosszú egyéni fókusz", "Izolált munkakörök"] },
      calmExecution: { strong: ["Programvezetés", "Minőségbiztosítás", "Műveletek"], might: ["Compliance", "Szabályozás", "Szakértői szerep"], prep: ["Kreatív brainstorm", "Gyors pivot"] },
      exploratoryAnalyst: { strong: ["Kutató", "Stratégiai elemző", "Innovátor"], might: ["Tanácsadás", "Termékstratégia"], prep: ["Értékesítés", "Nagyforgalmú ügyfélmunka"] },
      organizedLeader: { strong: ["Projektvezetés", "Csapatvezetés", "Operatív irányítás"], might: ["Értékesítés", "Ügyfélmunka"], prep: ["Kreatív felfedező", "Kutatás"] },
      harmoniousConnector: { strong: ["Csapatépítés", "Facilitáció", "Coaching"], might: ["Értékesítés", "Partnerség", "Tárgyalás"], prep: ["Egyéni döntéshozatal", "Konfliktusos közeg"] },
      ethicalLeader: { strong: ["Compliance", "Etikai tanácsadás", "Nonprofit"], might: ["Vezetés", "Szakértő"], prep: ["Versengő üzleti közeg"] },
      principledConfronter: { strong: ["Szabályozás", "Auditálás", "Mediáció"], might: ["Partnerség", "Tárgyalás"], prep: ["Diplomatikus közeg"] },
      structuredInnovator: { strong: ["R&D", "Terméktervezés", "Rendszertervezés"], might: ["Tanácsadás", "Stratégia"], prep: ["Ad hoc projektek", "Improvizáció"] },
      performanceDriver: { strong: ["Értékesítés", "Üzletfejlesztés", "Growth"], might: ["Stratégia", "Vállalkozás"], prep: ["Csapatépítés", "Coaching"] },
      disruptiveInnovator: { strong: ["Innovációs vezető", "Vállalkozó", "Stratégiai tanácsadó"], might: ["Kutatás", "Szakértő"], prep: ["Harmonikus csapat", "Bürokrácia"] },
      structuredCompetitor: { strong: ["Értékesítés", "Üzletfejlesztés", "Növekedés"], might: ["Projektvezetés", "Tanácsadás"], prep: ["Konszenzusos kultúra"] },
      supportedVisibility: { strong: ["Ügyfélkapcsolat", "Training", "HR"], might: ["Prezentáció", "Facilitáció"], prep: ["Izolált munka", "Magas nyomás"] },
      structuredStability: { strong: ["Minőségbiztosítás", "Adminisztráció", "Compliance"], might: ["Projektvezetés", "Tanácsadás"], prep: ["Startup", "Változékony közeg"] },
      safeExperimentation: { strong: ["Design thinking", "Prototípus-fejlesztés", "Innováció"], might: ["Tanácsadás", "Stratégia"], prep: ["Határidő-kritikus végrehajtás"] },
      deepCollaboration: { strong: ["Kiscsapat kutatás", "Mentoring", "Páros munka"], might: ["Tanácsadás", "Szakértő"], prep: ["Nagyvállalati hálózat", "Networking"] },
      solitaryInnovator: { strong: ["Kutató", "Elemző", "Architekt"], might: ["Tanácsadás", "Tervezés"], prep: ["Csapatmunka", "Gyakori meeting"] },
      facilitatedInnovation: { strong: ["Workshopvezetés", "Design thinking", "Változásmenedzsment"], might: ["Projektvezetés", "Oktatás"], prep: ["Top-down döntéshozatal"] },
      responsibleInnovator: { strong: ["Fenntarthatóság", "R&D", "Társadalmi innováció"], might: ["Stratégia", "Termékfejlesztés"], prep: ["Gyors kompromisszum"] },
    },
    en: {
      resilientLeader: { strong: ["Leader", "Sales Director", "Crisis Coordinator", "Change Management"], might: ["Project Management", "Client Relations"], prep: ["Isolated long-focus roles"] },
      calmExecution: { strong: ["Program Management", "Quality Assurance", "Operations"], might: ["Compliance", "Regulatory", "Expert roles"], prep: ["Creative brainstorm", "Rapid pivot"] },
      exploratoryAnalyst: { strong: ["Researcher", "Strategic Analyst", "Innovator"], might: ["Consulting", "Product Strategy"], prep: ["Sales", "High-volume client work"] },
      organizedLeader: { strong: ["Project Management", "Team Leadership", "Operations"], might: ["Sales", "Client work"], prep: ["Exploration", "Research"] },
      harmoniousConnector: { strong: ["Team Building", "Facilitation", "Coaching"], might: ["Sales", "Partnership", "Negotiation"], prep: ["Solo decision-making", "Conflict-heavy"] },
      ethicalLeader: { strong: ["Compliance", "Ethics Advisory", "Nonprofit"], might: ["Leadership", "Expert"], prep: ["Competitive business"] },
      principledConfronter: { strong: ["Regulatory", "Audit", "Mediation"], might: ["Partnership", "Negotiation"], prep: ["Diplomatic contexts"] },
      structuredInnovator: { strong: ["R&D", "Product Design", "Systems Architecture"], might: ["Consulting", "Strategy"], prep: ["Ad hoc projects"] },
      performanceDriver: { strong: ["Sales", "Business Development", "Growth"], might: ["Strategy", "Entrepreneurship"], prep: ["Team building", "Coaching"] },
      disruptiveInnovator: { strong: ["Innovation Lead", "Entrepreneur", "Strategic Advisor"], might: ["Research", "Expert"], prep: ["Harmonious team", "Bureaucracy"] },
      structuredCompetitor: { strong: ["Sales", "Business Development", "Growth"], might: ["Project Management", "Consulting"], prep: ["Consensus culture"] },
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

  const roleTags = roleFitSource
    ? (ROLE_TAGS[lang]?.[roleFitSource] ?? SOLO_ROLE_TAGS[lang]?.[roleFitSource])
    : null;

  const plusContent = accessLevel !== "start" ? {
    introText: BLOCK1[lang],
    howYouWork,
    envItems: envRows,
    roleFit: {
      strong: roleTexts?.strong ?? "",
      might: roleTexts?.medium ?? "",
      prep: roleTexts?.watchOut ?? "",
      strongRoles: roleTags?.strong,
      mightRoles: roleTags?.might,
      prepRoles: roleTags?.prep,
    },
    takeaways,
    closingText: BLOCK8[lang],
  } : undefined;

  return (
    <main className="min-h-dvh bg-cream">
      <DashboardAutoRefresh
        pendingInvites={pendingInvitesCount}
        completedObserver={completedObservers.length}
      />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-10 md:gap-14">

        <ProfileTabs
          name={displayName}
          assessmentDate={latestResult.createdAt.toISOString()}
          accessLevel={accessLevel}
          initialTab={initialTab}
          assessmentResultId={latestResult.id}
          dimensions={dimensions}
          growthFocusItems={growthFocusItems}
          hasObserverData={hasObserverData}
          observerCount={completedObservers.length}
          sentInvitations={sentInvitations}
          receivedInvitations={receivedInvitations}
          hasResearchSurvey={hasResearchSurvey}
          occupationStatus={null}
          hasDraft={Boolean(draft)}
          draftAnsweredCount={draftAnsweredCount}
          draftTotalQuestions={draftTotalQuestions}
          pendingInvitesCount={pendingInvitesCount}
          personalityType={personalityType}
          percentile={percentile}
          heroInsight={heroInsight}
          strengths={strengths}
          watchAreas={watchAreas}
          plusContent={plusContent}
        />

      </div>
    </main>
  );
}
