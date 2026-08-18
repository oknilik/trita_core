import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors, type, cardShape } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfMiniHeader } from "../components/PdfCard";
import { PdfChapterHeader } from "../components/PdfChapterHeader";
import { PdfDimensionDetail } from "../components/PdfDimensionDetail";
import { PdfAltruism } from "../components/PdfAltruism";
import { PdfTakeaways } from "../components/PdfTakeaways";
import type { ProfileReportViewModel, ReportDimensionView } from "@/lib/profile-report-view-model";

// ─────────────────────────────────────────────────────────────────────────────
// 02 · Dimenziók — dimenziónként érték, értelmezés, alskálák; a fejezet végén
// a kiegészítő skála (ha VALÓBAN mérve lett) és a kulcstanulságok.
//
// Oldalanként legfeljebb HÁROM részletes dimenzió (P1/12): a korábbi egyetlen,
// mindent egy lapra préselő alskála-oldal zsúfolt volt, miközben az áttekintő
// oldal alsó fele üresen maradt. A bontás determinisztikus, ezért a
// tartalomjegyzék oldalszámai is stabilak maradnak.
// ─────────────────────────────────────────────────────────────────────────────

export const DIMENSIONS_PER_PAGE = 3;

export function chunkDimensions(dims: ReportDimensionView[]): ReportDimensionView[][] {
  const chunks: ReportDimensionView[][] = [];
  for (let i = 0; i < dims.length; i += DIMENSIONS_PER_PAGE) {
    chunks.push(dims.slice(i, i + DIMENSIONS_PER_PAGE));
  }
  return chunks.length > 0 ? chunks : [[]];
}

interface Props {
  model: ProfileReportViewModel;
  dims: ReportDimensionView[];
  /** Az első lapon fut a fejezetfejléc és a PDF-könyvjelző. */
  isFirst: boolean;
  /** Az utolsó lap zárja a fejezetet: kiegészítő skála + kulcstanulságok. */
  isLast: boolean;
}

export function ChapterDimensionsPage({ model, dims, isFirst, isLast }: Props) {
  const { locale, identity, dimensionsChapter } = model;
  const chapter = model.chapters[1];
  const planLabel = model.plan === "plus" ? "Plus" : "Start";

  return (
    <Page
      size="A4"
      style={s.page}
      bookmark={isFirst ? { title: `${chapter.number} · ${chapter.title}` } : undefined}
    >
      <PdfMiniHeader
        userName={identity.userName}
        planLabel={planLabel}
        date={identity.completedAt}
        locale={locale}
      />

      <View style={s.body}>
        {isFirst ? (
          <PdfChapterHeader
            number={chapter.number}
            question={chapter.question}
            title={chapter.title}
            description={chapter.description}
          />
        ) : (
          <Text
            style={{
              fontSize: type.eyebrow,
              letterSpacing: type.eyebrowTracking,
              textTransform: "uppercase",
              fontWeight: 600,
              color: colors.bronze,
              marginBottom: 12,
            }}
          >
            {chapter.number} · {chapter.title}
          </Text>
        )}

        {dims.map((dim) => (
          <PdfDimensionDetail key={dim.code} dim={dim} locale={locale} />
        ))}

        {/* Fejezetzárás: a kiegészítő skála és a kulcstanulságok EGY blokként
            mozognak. Külön-külön az egyik még kifért a lap aljára, a másik
            pedig egy jóformán üres lapra csúszott át. */}
        {isLast && (dimensionsChapter.altruism || dimensionsChapter.takeaways.length > 0) ? (
          <View wrap={false} style={{ display: "flex", flexDirection: "column", gap: cardShape.gap }}>
            {dimensionsChapter.altruism ? (
              <PdfAltruism
                value={dimensionsChapter.altruism.value}
                description={dimensionsChapter.altruism.description}
                locale={locale}
              />
            ) : null}
            {dimensionsChapter.takeaways.length > 0 ? (
              <PdfTakeaways takeaways={dimensionsChapter.takeaways} locale={locale} />
            ) : null}
          </View>
        ) : null}
      </View>

      <PdfFooter locale={locale} />
    </Page>
  );
}
