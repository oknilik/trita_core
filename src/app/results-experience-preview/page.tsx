import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileTabs, type SerializedDimension } from "@/components/profile/ProfileTabs";

export const metadata: Metadata = {
  title: "Eredményélmény UX-előnézet | trita",
  robots: { index: false, follow: false },
};

const dimensions: SerializedDimension[] = [
  {
    code: "H",
    label: "Becsületesség-Alázat",
    color: "var(--color-dim-h-base)",
    score: 58,
    insight: "Fontos neked a tiszta működés, miközben a helyzethez is tudsz alkalmazkodni.",
    description: "Következetes döntések és reális önérvényesítés jellemezhet.",
    insights: { low: "", mid: "", high: "" },
    facets: [
      { code: "sincerity", label: "Őszinteség", score: 61 },
      { code: "fairness", label: "Méltányosság", score: 57 },
    ],
  },
  {
    code: "E",
    label: "Emocionalitás",
    color: "var(--color-dim-e-base)",
    score: 46,
    insight: "Nyomás alatt is képes vagy megőrizni a nyugodt, tárgyilagos jelenlétet.",
    description: "A stabilitás mellett fontos lehet tudatosan jelezni, amikor támogatásra van szükséged.",
    insights: { low: "", mid: "", high: "" },
    facets: [
      { code: "anxiety", label: "Aggodalmaskodás", score: 42 },
      { code: "dependence", label: "Támaszigény", score: 45 },
    ],
  },
  {
    code: "X",
    label: "Extraverzió",
    color: "var(--color-dim-x-base)",
    score: 72,
    insight: "Könnyen teremtesz kapcsolatot, és energiát adhatsz a közös gondolkodásnak.",
    description: "Aktív csapatmunka és látható kezdeményezés állhat közel hozzád.",
    insights: { low: "", mid: "", high: "" },
    facets: [
      { code: "social-boldness", label: "Társas magabiztosság", score: 75 },
      { code: "sociability", label: "Társaságkedvelés", score: 68 },
    ],
  },
  {
    code: "A",
    label: "Barátságosság",
    color: "var(--color-dim-a-base)",
    score: 34,
    insight: "Konfliktusban egyenes és határozott vagy; gyorsan kimondod, mi nem működik.",
    description: "A fejlődési lehetőség a határozottság megtartása mellett több tér adása más nézőpontoknak.",
    insights: { low: "", mid: "", high: "" },
    facets: [
      { code: "flexibility", label: "Rugalmasság", score: 31 },
      { code: "patience", label: "Türelem", score: 38 },
    ],
  },
  {
    code: "C",
    label: "Lelkiismeretesség",
    color: "var(--color-dim-c-base)",
    score: 61,
    insight: "Megbízhatóan viszed végig, amit valóban fontosnak ítélsz.",
    description: "A sok párhuzamos lehetőség mellett a látható befejezési pontok segíthetnek.",
    insights: { low: "", mid: "", high: "" },
    facets: [
      { code: "organization", label: "Szervezettség", score: 57 },
      { code: "diligence", label: "Szorgalom", score: 65 },
    ],
  },
  {
    code: "O",
    label: "Nyitottság",
    color: "var(--color-dim-o-base)",
    score: 79,
    insight: "Gyorsan észreveszed az új összefüggéseket, és szeretsz még ki nem próbált irányokat felfedezni.",
    description: "Ötletgazdag, kísérletező környezetben tudsz könnyen lendületbe kerülni.",
    insights: { low: "", mid: "", high: "" },
    facets: [
      { code: "inquisitiveness", label: "Kíváncsiság", score: 82 },
      { code: "creativity", label: "Kreativitás", score: 80 },
    ],
  },
];

export default async function ResultsExperiencePreviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  const resolvedParams = await searchParams;
  const tabParam = resolvedParams?.tab;
  const chapterParam = resolvedParams?.chapter;
  const initialTab = tabParam === "details" || tabParam === "comparison"
    ? tabParam
    : "summary";
  const initialDetailChapter = chapterParam === "dimensions" || chapterParam === "workstyle"
    ? chapterParam
    : "overview";

  return (
    <main className="min-h-dvh bg-[var(--color-surface-canvas)] px-4 py-8 md:py-12">
      <div className="mx-auto mb-6 max-w-4xl rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-3 text-xs leading-relaxed text-muted">
        Fejlesztői UX-előnézet · reprezentatív profiladatokkal
      </div>
      <div className="mx-auto max-w-4xl">
        <ProfileTabs
          name="Péter"
          assessmentDate="2026-08-12T08:00:00.000Z"
          accessLevel="plus"
          initialTab={initialTab}
          initialDetailChapter={initialDetailChapter}
          dimensions={dimensions}
          growthFocusItems={[
            { code: "flexibility", label: "Rugalmasság", score: 31, dimCode: "A", dimLabel: "Barátságosság", dimColor: "var(--color-dim-a-base)" },
            { code: "patience", label: "Türelem", score: 38, dimCode: "A", dimLabel: "Barátságosság", dimColor: "var(--color-dim-a-base)" },
          ]}
          hasObserverData={false}
          observerCount={1}
          observerFlow={{ state: "self_serve", receivedCount: 1, minForReveal: 3, activeCampaignName: null }}
          sentInvitations={[]}
          receivedInvitations={[]}
          feedbackSubmitted
          clarityFeedbackSubmitted
          personalityType="Újító"
          interactionEntry={{ state: "new" }}
          heroInsight="Új összefüggéseket találsz és könnyen bevonsz másokat — a lehetőségek tudatos lezárása adhat még több fókuszt."
          shareToken={null}
          plusContent={{
            introText: "",
            howYouWorkParts: {
              main: "Új ötletek összekapcsolása és mások bevonása a gondolkodásba természetesen mehet neked.",
              watch: "A lehetőségek gyorsabban szaporodhatnak, mint amilyen gyorsan lezárod őket.",
              notes: [],
              context: [],
            },
            growthTip: "Válassz kevesebb párhuzamos irányt, és adj mindegyiknek előre látható befejezési pontot.",
            growthPlan: {
              behavior: "Hetente jelölj ki egyetlen olyan eredményt, amelyet valóban lezársz.",
              reflection: "Figyeld meg, mikor nyitsz új irányt azért, hogy elkerüld a lezárást.",
              challenge: "Kérj egy kollégától rövid visszajelzést a prioritásaid egyértelműségéről.",
            },
            envItems: [
              { label: "Tér az alakításra", value: "Szabadon kereshetsz megoldást egy világos célhoz." },
              { label: "Élő kapcsolódás", value: "Van lehetőség közösen gondolkodni és gyorsan visszajelzést kapni." },
            ],
            roleFit: {
              strong: "Innovációs, termék- és stratégiai szerepek, ahol új irányokat kell felismerni.",
              might: "Stabil keretek között is jól működhetsz, ha marad mozgástér a megoldásban.",
              prep: "A tartósan ismétlődő, szűken szabályozott feladatok több tudatos energiamenedzsmentet kérhetnek.",
            },
            takeaways: [
              "Az újdonságok felismerése és a kapcsolódás egyszerre adhat lendületet.",
              "A fókusz nem az ötletek csökkentését, hanem a lezárási pontok kijelölését jelenti.",
            ],
          }}
        />
      </div>
    </main>
  );
}
