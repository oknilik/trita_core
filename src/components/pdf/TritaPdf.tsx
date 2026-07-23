import { Document, pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { CoverPage } from "./pages/CoverPage";
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

  // Start: 1, Plus: 3 (start + facets + workstyle), Plus with observers: 4
  const totalPages = hasObservers ? 4 : hasPlus ? 3 : 1;

  return (
    <Document>
      {/* Archetípus-borító — számozáson kívül, a riport „arca" */}
      <CoverPage data={data} />
      <StartPage data={data} pageNum={1} totalPages={totalPages} locale={locale} />
      {hasPlus && <PlusFacetsPage data={data} pageNum={2} totalPages={totalPages} locale={locale} />}
      {hasPlus && <PlusWorkStylePage data={data} pageNum={3} totalPages={totalPages} locale={locale} />}
      {hasObservers && <ReflectPage data={data} pageNum={4} totalPages={totalPages} locale={locale} />}
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
