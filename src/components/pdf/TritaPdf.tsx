import { Document, pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { StartPage } from "./pages/StartPage";
import { PlusPage } from "./pages/PlusPage";
import { ReflectPage } from "./pages/ReflectPage";

// ─── Data interface ──────────────────────────────────────────────────────────

export interface PdfData {
  userName: string;
  completedAt: string;
  personalityType: string;
  percentile: string;
  heroInsight: string;
  plan: "start" | "plus" | "reflect";
  // Bullet-based insights
  strengthBullets: string[];
  watchBullets: string[];
  // Legacy string versions (fallback)
  strengths: string;
  watchAreas: string;
  // Profile character callout
  profileCharacter?: string;
  // Dimensions
  dimensions: { name: string; shortName: string; value: number; description: string }[];
  belbinRoles: { name: string; subtitle: string; score: number; rank: number }[];
  // Plus content
  plusContent?: {
    howYouWork: string[];
    roleFit: {
      strong: string;
      might: string;
      prep: string;
      strongRoles?: string[];
      mightRoles?: string[];
      prepRoles?: string[];
    };
    takeaways: string[];
    closingText: string;
  };
  facetDimensions?: { name: string; value: number; insight?: string; description?: string; facets: { label: string; score: number }[] }[];
  // Callout insights for Plus page
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
  const hasPlus = data.plan === "plus" || data.plan === "reflect";
  const hasObservers = data.plan === "reflect" && data.observerData && data.observerData.count > 0;

  const totalPages = hasObservers ? 3 : hasPlus ? 2 : 1;

  return (
    <Document>
      <StartPage data={data} pageNum={1} totalPages={totalPages} />
      {hasPlus && <PlusPage data={data} pageNum={2} totalPages={totalPages} />}
      {hasObservers && <ReflectPage data={data} pageNum={3} totalPages={totalPages} />}
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
