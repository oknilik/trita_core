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
    insight: "Fontos neked, hogy egyenesen beszélj és tisztességesen járj el.",
    description: "A saját érdekeidet is képviseled, miközben mérlegeled, mi méltányos a másikkal szemben.",
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
    insight: "Nyomás alatt is könnyebben megőrizheted a nyugalmadat.",
    description: "Érdemes jelezned, ha mégis támogatásra van szükséged; a nyugodt viselkedésedből ez nem feltétlenül látszik.",
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
    insight: "Szívesen beszélgetsz, és könnyen kezdeményezhetsz közös feladatokat.",
    description: "Közel állhat hozzád, ha a munkádban másokkal is rendszeresen egyeztetsz.",
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
    insight: "Vitában jellemzően kitartasz az álláspontod mellett, és hamar jelzed, ha valamit kifogásolsz.",
    description: "Segíthet, ha a saját érveid előtt meghallgatod, mi fontos a másiknak.",
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
    insight: "Általában megtervezed a fontos feladataidat, és igyekszel végigvinni, amit vállaltál.",
    description: "Ha sok mindennel foglalkozol egyszerre, jelöld ki, melyik feladatot mikorra fejezed be.",
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
    insight: "Szívesen keresel új összefüggéseket és próbálsz ki ismeretlen megoldásokat.",
    description: "Közel állhat hozzád az olyan munka, amelyben van idő ötletelni és kísérletezni.",
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
          heroInsight="Szívesen keresel új megoldásokat és vonsz be másokat a gondolkodásba. Segíthet, ha előre eldöntöd, melyik ötletedet viszed végig."
          shareToken={null}
          plusContent={{
            introText: "",
            howYouWorkParts: {
              main: "Szívesen keresel kapcsolatot az ötletek között, és kérdezed meg mások véleményét.",
              watch: "Könnyen előfordulhat, hogy új feladatba kezdesz, mielőtt befejeznéd a korábbit.",
              notes: [],
              context: [],
            },
            growthTip: "Válassz kevesebb párhuzamos feladatot, és írd le, mikor tekinted őket késznek.",
            growthPlan: {
              behavior: "Hetente jelölj ki egy feladatot, amelyet befejezel.",
              reflection: "Figyeld meg, miért kezdesz új feladatba, amikor egy korábbi még nincs kész.",
              challenge: "Kérj egy kollégától visszajelzést: egyértelmű-e számára, min dolgozol először.",
            },
            envItems: [
              { label: "Önálló megoldások", value: "Szabadon kereshetsz megoldást egy világos célhoz." },
              { label: "Közös gondolkodás", value: "Van lehetőség közösen gondolkodni és gyorsan visszajelzést kapni." },
            ],
            roleFit: {
              strong: "Innovációs, termék- és stratégiai szerepek, ahol új irányokat kell felismerni.",
              might: "Stabil keretek között is jól működhetsz, ha marad mozgástér a megoldásban.",
              prep: "A tartósan ismétlődő, szigorúan szabályozott feladatok könnyebben fáraszthatnak.",
            },
            takeaways: [
              "Az új ötletek és a közös gondolkodás is érdekelhet.",
              "Ha sok ötleted van, válassz egyet, és tervezd meg a megvalósítását.",
            ],
          }}
        />
      </div>
    </main>
  );
}
