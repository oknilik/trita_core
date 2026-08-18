import { Document, pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { t } from "@/lib/i18n";
import {
  buildProfileReportViewModel,
  type ProfileReportInput,
  type ProfileReportViewModel,
  type ReportChapterId,
} from "@/lib/profile-report-view-model";
import { CoverPage } from "./pages/CoverPage";
import { QuickOverviewPage } from "./pages/QuickOverviewPage";
import { ChapterOverviewPage } from "./pages/ChapterOverviewPage";
import { ChapterDimensionsPage, chunkDimensions } from "./pages/ChapterDimensionsPage";
import { ChapterWorkStylePage } from "./pages/ChapterWorkStylePage";
import { AppendixRelationalPage } from "./pages/AppendixRelationalPage";
import { AppendixObserverPage } from "./pages/AppendixObserverPage";
import { AppendixCareerPage } from "./pages/AppendixCareerPage";

// ─────────────────────────────────────────────────────────────────────────────
// A riport dokumentum-szerkezete. A TARTALMI source of truth a webes
// eredményoldal (ProfileTabs / LinearReport), ezért a sorrend:
//
//   Borító → Gyors összkép → 01 Áttekintés → 02 Dimenziók →
//   03 Munkastílus és fejlődés → opcionális mellékletek
//   (külső nézőpont · karrier · kapcsolati dinamika)
//
// A `PdfData` bemenet-alak megmaradt (a hívók kompatibilisek), de a tartalmi
// összeállítás a közös view-modelbe költözött (profile-report-view-model.ts) —
// a PDF innentől csak MEGJELENÍT.
// ─────────────────────────────────────────────────────────────────────────────

/** A letöltés bemenete — a közös view-model inputja. */
export type PdfData = ProfileReportInput;

export { type ProfileReportInput };

/**
 * A tartalomjegyzék oldalszámai. A szerkezet determinisztikus: a Gyors összkép
 * és a 01 fejezet egy-egy lap, a 02 fejezet lapjainak száma a dimenziók
 * számából adódik (3 / lap), így a 03 fejezet kezdő oldala előre ismert.
 * A borító számozáson kívül van, ezért az első tartalmi oldal az 1.
 */
export function chapterStartPages(
  model: ProfileReportViewModel,
): Record<ReportChapterId, number> {
  const dimensionPages = chunkDimensions(model.dimensionsChapter.dimensions).length;
  return {
    overview: 2,
    dimensions: 3,
    workstyle: 3 + dimensionPages,
  };
}

export function TritaReportDocument({ data }: { data: PdfData }) {
  const model = buildProfileReportViewModel(data);
  const dimensionChunks = chunkDimensions(model.dimensionsChapter.dimensions);
  const hasAppendix = (id: "observer" | "career" | "relational") =>
    model.appendices.some((a) => a.id === id);

  return (
    <Document
      title={`${model.identity.userName} — ${t("pdf.personalityProfile", model.locale)}`}
      author="Trita"
      subject={t("pdf.footerTagline", model.locale)}
      creator="Trita"
      producer="Trita"
      language={model.locale}
    >
      {/* Borító — számozáson kívül, a riport „arca" */}
      <CoverPage
        model={model}
        bookmark={{ title: model.identity.personalityType || model.identity.userName, expanded: true }}
      />

      <QuickOverviewPage model={model} chapterStartPages={chapterStartPages(model)} />

      <ChapterOverviewPage model={model} />

      {dimensionChunks.map((dims, i) => (
        <ChapterDimensionsPage
          key={`dims-${i}`}
          model={model}
          dims={dims}
          isFirst={i === 0}
          isLast={i === dimensionChunks.length - 1}
        />
      ))}

      <ChapterWorkStylePage model={model} />

      {/* Opcionális mellékletek — a riport VÉGÉN, világosan megnevezve */}
      {hasAppendix("observer") ? <AppendixObserverPage model={model} /> : null}
      {hasAppendix("career") ? <AppendixCareerPage model={model} /> : null}
      {hasAppendix("relational") ? <AppendixRelationalPage model={model} /> : null}
    </Document>
  );
}

// ─── Download trigger ────────────────────────────────────────────────────────

export async function downloadPdf(data: PdfData) {
  const blob = await pdf(<TritaReportDocument data={data} />).toBlob();
  const firstName = data.userName.toLowerCase().replace(/\s+/g, "-");
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `trita-profil-${firstName}-${dateStr}.pdf`;
  saveAs(blob, fileName);
}
