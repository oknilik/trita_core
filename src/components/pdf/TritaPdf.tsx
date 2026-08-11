import { Document, pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import type { HowYouWorkParts } from "@/lib/workstyle-content";
import { CoverPage } from "./pages/CoverPage";
import { SummaryPage } from "./pages/SummaryPage";
import { StartPage } from "./pages/StartPage";
import { PlusFacetsPage } from "./pages/PlusFacetsPage";
import { PlusWorkStylePage } from "./pages/PlusWorkStylePage";
import { CollabPage } from "./pages/CollabPage";
import { ReflectPage } from "./pages/ReflectPage";
import { CareerPage } from "./pages/CareerPage";

// ─── Data interface ──────────────────────────────────────────────────────────

export interface PdfData {
  userName: string;
  completedAt: string;
  personalityType: string;
  heroInsight: string;
  /** Archetípus-történet felütés a summary-oldalra (P5.6). */
  archetypeStory?: string;
  plan: "start" | "plus";
  locale?: "hu" | "en";
  // Bullet-based insights
  strengthBullets: string[];
  watchBullets: string[];
  // Profile character callout
  profileCharacter?: string;
  // Hero dimension chips
  topDimensions?: string[];
  watchDimensions?: string[];
  // Dimensions
  dimensions: { name: string; shortName: string; value: number; description: string; code?: string }[];
  teamRoleRoles: { name: string; subtitle: string; score: number; rank: number; why?: string }[];
  /** true = profil-alapú becslés (pontszám rejtve, csak sáv-címke); false = mért kérdőíves eredmény. */
  teamRoleEstimated?: boolean;
  // Altruism
  altruism?: { value: number; description: string };
  /** Karrier-iránytű export — csak kitöltött wizard után kerül a riportba. */
  career?: {
    roles: { name: string; industry: string; score: number; bandLow: number; bandHigh: number; why?: string }[];
    developNote?: string;
  };
  // Plus content
  plusContent?: {
    /** „Ahogy működsz" nevesített slotokkal (FIX 3) — a watch csak valódi
     *  risk-párnál létezik, a pozicionális [0]/[1] találgatás kivezetve. */
    howYouWorkParts: HowYouWorkParts;
    /** Vakfolt + nyomás alatti működés hipotézisek (P2.1). */
    pressure?: string[];
    /** Strukturált stress/vakfolt párok + forrás-dimenzió (P3.1, P5.2). */
    pressureParts?: { stress: string; blindspot: string; source?: string }[];
    /** Konkrét viselkedéses fejlődési javaslat a legalacsonyabb dimenzióhoz (P2.4). */
    growthTip?: string;
    /** Háromlépcsős fejlődési ív (P5.5). */
    growthPlan?: { behavior: string; reflection: string; challenge: string; source?: string };
    /** „Csapatban működve" fejezet (P4.2); source = forrás-dimenzió chip (P5.2). */
    collaboration?: {
      click: { text: string; source?: string }[];
      friction: { text: string; source?: string }[];
      needs: { text: string; source?: string }[];
    };
    roleFit: {
      strong: string;
      might: string;
      prep: string;
      /** A második legerősebb dimenzió árnyaló mondata (P2.2). */
      secondary?: string;
      strongRoles?: string[];
      mightRoles?: string[];
      prepRoles?: string[];
    };
    takeaways: string[];
  };
  facetDimensions?: { name: string; value: number; insight?: string; description?: string; code?: string; facets: { label: string; score: number }[] }[];
  // Reflect observer data
  observerData?: {
    count: number;
    dimensions: { name: string; self: number; observer: number }[];
    summaryPoints: string[];
  };
}

// ─── Document ────────────────────────────────────────────────────────────────

function TritaDocument({ data }: { data: PdfData }) {
  const hasPlus = data.plan === "plus";
  const hasObservers = hasPlus && data.observerData && data.observerData.count > 0;
  const locale = data.locale ?? "hu";

  // Start: 1; Plus: 5 (summary + start + facets + workstyle + collab);
  // observerekkel: 6. A summary- és collab-oldal csak plus riportban él.
  const hasCareer = hasPlus && Boolean(data.career?.roles.length);
  const totalPages = (hasObservers ? 6 : hasPlus ? 5 : 1) + (hasCareer ? 1 : 0);
  let pageNum = 0;
  const nextPage = () => ++pageNum;

  return (
    <Document>
      {/* Archetípus-borító — számozáson kívül, a riport „arca" */}
      <CoverPage data={data} />
      {hasPlus && <SummaryPage data={data} pageNum={nextPage()} totalPages={totalPages} locale={locale} />}
      <StartPage data={data} pageNum={nextPage()} totalPages={totalPages} locale={locale} />
      {hasPlus && <PlusFacetsPage data={data} pageNum={nextPage()} totalPages={totalPages} locale={locale} />}
      {hasPlus && <PlusWorkStylePage data={data} pageNum={nextPage()} totalPages={totalPages} locale={locale} />}
      {hasPlus && <CollabPage data={data} pageNum={nextPage()} totalPages={totalPages} locale={locale} />}
      {hasCareer && <CareerPage data={data} pageNum={nextPage()} totalPages={totalPages} locale={locale} />}
      {hasObservers && <ReflectPage data={data} pageNum={nextPage()} totalPages={totalPages} locale={locale} />}
    </Document>
  );
}

// ─── Download trigger ────────────────────────────────────────────────────────

export async function downloadPdf(data: PdfData) {
  const blob = await pdf(<TritaDocument data={data} />).toBlob();
  const firstName = data.userName.toLowerCase().replace(/\s+/g, "-");
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `trita-profil-${firstName}-${dateStr}.pdf`;
  saveAs(blob, fileName);
}
