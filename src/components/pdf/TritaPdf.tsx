import { Document, pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { CoverPage } from "./pages/CoverPage";
import { SummaryPage } from "./pages/SummaryPage";
import { StartPage } from "./pages/StartPage";
import { PlusFacetsPage } from "./pages/PlusFacetsPage";
import { PlusWorkStylePage } from "./pages/PlusWorkStylePage";
import { ReflectPage } from "./pages/ReflectPage";

// ─── Data interface ──────────────────────────────────────────────────────────

export interface PdfData {
  userName: string;
  completedAt: string;
  personalityType: string;
  percentile: string;
  heroInsight: string;
  plan: "start" | "plus";
  locale?: "hu" | "en";
  // Bullet-based insights
  strengthBullets: string[];
  watchBullets: string[];
  // Legacy string versions
  strengths: string;
  watchAreas: string;
  // Profile character callout
  profileCharacter?: string;
  // Hero dimension chips
  topDimensions?: string[];
  watchDimensions?: string[];
  // Dimensions
  dimensions: { name: string; shortName: string; value: number; description: string }[];
  teamRoleRoles: { name: string; subtitle: string; score: number; rank: number }[];
  /** true = profil-alapú becslés (pontszám rejtve, csak sáv-címke); false = mért kérdőíves eredmény. */
  teamRoleEstimated?: boolean;
  // Altruism
  altruism?: { value: number; description: string };
  // Plus content
  plusContent?: {
    howYouWork: string[];
    /** Vakfolt + nyomás alatti működés hipotézisek (P2.1). */
    pressure?: string[];
    /** Strukturált stress/vakfolt párok az executive summary oldalhoz (P3.1). */
    pressureParts?: { stress: string; blindspot: string }[];
    /** Konkrét viselkedéses fejlődési javaslat a legalacsonyabb dimenzióhoz (P2.4). */
    growthTip?: string;
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
    closingText: string;
  };
  facetDimensions?: { name: string; value: number; insight?: string; description?: string; facets: { label: string; score: number }[] }[];
  // Callout insights (kept for data but no longer rendered as separate callouts)
  workplaceInsight?: string;
  riskInsight?: string;
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

  // Start: 1; Plus: 4 (summary + start + facets + workstyle); observerekkel: 5.
  // A summary-oldal (P3.1) csak plus riportban él — a tartalma a plus
  // content-pipeline-ból (pressure, growthTip) áll össze.
  const totalPages = hasObservers ? 5 : hasPlus ? 4 : 1;
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
