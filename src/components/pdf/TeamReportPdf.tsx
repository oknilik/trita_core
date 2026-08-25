import { Document, Page, View, Text, pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { s, colors, type } from "./styles";
import { PdfCard, PdfMiniHeader } from "./components/PdfCard";
import { PdfFooter } from "./components/PdfFooter";
import { PdfChapterHeader } from "./components/PdfChapterHeader";
import { TeamReportCoverPage } from "./pages/TeamReportCoverPage";
import { HEXACO_ORDER, HEXACO_DIMENSIONS, isHexacoCode } from "@/lib/hexaco";
import { DIMENSION_BASE } from "@/lib/color-system";
import { teamActionTargetLabel } from "@/lib/team-action-target";
import type {
  SerializedTeamReport,
  TeamReportActionItem,
} from "@/lib/team-report";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Csapatriport-PDF (P1.1) — a PUBLIKÁLT TeamReportView nyomtatható párja.
//
// Elvek:
//  - KIZÁRÓLAG a befagyasztott `aggregates` snapshotból és a tanácsadói
//    narratívából dolgozik — élő számítás nincs, a PDF ugyanazt mondja, amit
//    a publikált nézet.
//  - Az anonimitási és evidencia-szabályok a nézettel azonosak: egyéni adat
//    soha; forrás-jelölés (mért vs. becsült) kötelező; a psych-safety
//    szóródás SZÁMKÉNT nem jelenik meg (2026-08-11 termékdöntés).
//  - A trust hub/beágyazatlan NEVEK szándékosan NEM kerülnek a PDF-be, csak
//    a darabszámok: a nyomtatott artefakt tovább terjed, mint a képernyő.
//  - Szövegek: a TeamReportView helyi konvencióját követő inline isHu
//    ternary-k (a narratíva maga tanácsadói szabad szöveg, nem szótári).
//  - A modult KIZÁRÓLAG dinamikus importtal töltsd (bundle-védelem) — minta:
//    TeamReportPdfButton.
// ─────────────────────────────────────────────────────────────────────────────

export interface TeamReportPdfData {
  report: SerializedTeamReport;
  isHu: boolean;
}

const QUALITY_LABELS: Record<string, { hu: string; en: string }> = {
  none: { hu: "Nincs elegendő adat", en: "Insufficient data" },
  partial: { hu: "Részleges adatalap", en: "Partial data basis" },
  sufficient: { hu: "Megbízható adatalap", en: "Reliable data basis" },
};

const ACTION_STATUS_LABELS: Record<string, { hu: string; en: string }> = {
  not_started: { hu: "nem kezdődött el", en: "not started" },
  in_progress: { hu: "folyamatban", en: "in progress" },
  blocked: { hu: "elakadt", en: "blocked" },
  done: { hu: "kész", en: "done" },
};

/** Tanácsadói narratíva („• " bullet-konvenció) → sorok. */
function splitNarrative(text: string | null): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.replace(/^[•\-–]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

function formatDate(iso: string | null | undefined, isHu: boolean): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(isHu ? "hu-HU" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function KpiCell({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", padding: "10 6" }}>
      <Text style={{ fontFamily: "Fraunces", fontSize: type.section, color: colors.ink, marginBottom: 3 }}>
        {value}
      </Text>
      <Text style={{ fontSize: type.caption, color: colors.ink300, textAlign: "center" }}>{label}</Text>
      {sub ? (
        <Text style={{ fontSize: type.caption, color: colors.ink300, marginTop: 2, textAlign: "center" }}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

// Dimenzió-sor: címke + sáv (átlag-jelölő + heterogenitás-sáv) + átlagérték.
// A szórás SZÁMKÉNT nem jelenik meg — sávként igen (a nézet mintája).
function DimRow({
  code,
  avg,
  spread,
  isHu,
}: {
  code: string;
  avg: number;
  spread: number | null;
  isHu: boolean;
}) {
  const label = isHexacoCode(code)
    ? isHu
      ? HEXACO_DIMENSIONS[code].hu
      : HEXACO_DIMENSIONS[code].en
    : code;
  const color = isHexacoCode(code) ? DIMENSION_BASE[code] : colors.sage;
  const lo = spread !== null ? Math.max(0, avg - spread) : avg;
  const hi = spread !== null ? Math.min(100, avg + spread) : avg;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color, marginRight: 7 }} />
      <Text style={{ fontSize: type.caption, color: colors.ink, width: 120 }}>{label}</Text>
      <View
        style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.cream500,
          position: "relative",
          marginRight: 7,
        }}
      >
        {/* Heterogenitás-sáv */}
        <View
          style={{
            position: "absolute",
            left: `${lo}%`,
            width: `${Math.max(1, hi - lo)}%`,
            top: 0,
            bottom: 0,
            borderRadius: 4,
            backgroundColor: color,
            opacity: 0.28,
          }}
        />
        {/* Átlag-jelölő */}
        <View
          style={{
            position: "absolute",
            left: `${Math.max(0, Math.min(99, avg - 0.5))}%`,
            width: 3,
            top: -1,
            bottom: -1,
            borderRadius: 1.5,
            backgroundColor: color,
          }}
        />
      </View>
      <Text style={{ fontFamily: "Fraunces", fontSize: type.subhead, color: colors.ink, width: 24, textAlign: "right" }}>
        {Math.round(avg)}
      </Text>
    </View>
  );
}

function NarrativeCard({ eyebrow, text }: { eyebrow: string; text: string | null }) {
  const lines = splitNarrative(text);
  if (lines.length === 0) return null;
  return (
    <PdfCard eyebrow={eyebrow}>
      {lines.map((line, i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: 5 }} wrap={false}>
          <Text style={{ fontSize: type.body, color: colors.bronze, marginRight: 6 }}>•</Text>
          <Text style={{ fontSize: type.body, color: colors.ink500, flex: 1, lineHeight: type.lineHeight.body }}>{line}</Text>
        </View>
      ))}
    </PdfCard>
  );
}

function ActionRow({ item, isHu }: { item: TeamReportActionItem; isHu: boolean }) {
  const statusLabel = item.status ? ACTION_STATUS_LABELS[item.status] : null;
  const metaParts = [
    `${item.timeframe} ${isHu ? "nap" : "days"}`,
    item.owner ? `${isHu ? "felelős" : "owner"}: ${item.owner}` : null,
    statusLabel ? (isHu ? statusLabel.hu : statusLabel.en) : null,
    item.targetMetric
      ? `${isHu ? "célmutató" : "target"}: ${teamActionTargetLabel(item.targetMetric, isHu ? "hu" : "en")}`
      : null,
  ].filter(Boolean);
  return (
    <View style={{ marginBottom: 8, paddingBottom: 8, borderBottom: `0.5 solid ${colors.cream500}` }} wrap={false}>
      <Text style={{ fontSize: type.cardTitle, fontWeight: 600, color: colors.ink, marginBottom: 3 }}>
        {item.title}
      </Text>
      {item.description ? (
        <Text style={{ fontSize: type.body, color: colors.ink500, lineHeight: type.lineHeight.body, marginBottom: 3 }}>
          {item.description}
        </Text>
      ) : null}
      <Text style={{ fontSize: type.caption, color: colors.ink300 }}>{metaParts.join(" · ")}</Text>
    </View>
  );
}

function TeamPageHeader({
  title,
  publishedDate,
  isHu,
}: {
  title: string;
  publishedDate: string | null;
  isHu: boolean;
}) {
  return (
    <PdfMiniHeader
      userName={title}
      reportLabel={isHu ? "Szervezeti riport" : "Organization report"}
      planLabel=""
      date={publishedDate ?? ""}
      locale={isHu ? "hu" : "en"}
    />
  );
}

function TeamChapterPage({
  title,
  publishedDate,
  isHu,
  bookmark,
  children,
}: {
  title: string;
  publishedDate: string | null;
  isHu: boolean;
  bookmark: string;
  children: ReactNode;
}) {
  return (
    <Page size="A4" style={s.page} bookmark={bookmark}>
      <TeamPageHeader title={title} publishedDate={publishedDate} isHu={isHu} />
      <View style={s.body}>{children}</View>
      <PdfFooter locale={isHu ? "hu" : "en"} />
    </Page>
  );
}

function MethodologyCard({
  agg,
  generatedDate,
  isHu,
}: {
  agg: NonNullable<SerializedTeamReport["aggregates"]>;
  generatedDate: string | null;
  isHu: boolean;
}) {
  const evidence = agg.evidence;
  if (!evidence) return null;
  return (
    <PdfCard eyebrow={isHu ? "Adatalap és módszertan" : "Data basis & methodology"} tone="muted">
      <Text style={{ fontSize: type.body, color: colors.ink, lineHeight: type.lineHeight.body, marginBottom: 4 }}>
        {(QUALITY_LABELS[evidence.quality]
          ? isHu
            ? QUALITY_LABELS[evidence.quality].hu
            : QUALITY_LABELS[evidence.quality].en
          : evidence.quality) +
          " · " +
          (isHu
            ? `${agg.completedCount}/${agg.memberCount} kitöltött felmérés · ${evidence.measuredEdgeCount ?? 0} mért és ${evidence.estimatedEdgeCount} becsült kapcsolati adat`
            : `${agg.completedCount}/${agg.memberCount} completed assessments · ${evidence.measuredEdgeCount ?? 0} measured and ${evidence.estimatedEdgeCount} estimated relationship data points`)}
      </Text>
      <Text style={s.caption}>
        {isHu
          ? "A riport a publikáláskor rögzített aggregált adatokon alapul; egyéni eredmények nem jelennek meg. A becsült elemek profil-alapú modellből származnak."
          : "This report is based on aggregate data frozen at publication; individual results are not shown. Estimated elements come from a profile-based model."}
        {generatedDate
          ? isHu
            ? ` Aggregátum rögzítve: ${generatedDate}`
            : ` Aggregates frozen: ${generatedDate}.`
          : ""}
      </Text>
    </PdfCard>
  );
}

export function TeamReportDocument({ report, isHu }: TeamReportPdfData) {
  const agg = report.aggregates;
  const title = report.title ?? (isHu ? "Csapatkép" : "Team picture");
  const publishedDate = formatDate(report.publishedAt, isHu);
  const generatedDate = formatDate(agg?.generatedAt, isHu);

  // EN lekérés jóváhagyott fordítás nélkül: a hívó (gomb) már a
  // localizeTeamReport-on átfuttatott riportot adja; ha nincs jóváhagyott EN,
  // a narratíva HU marad — ezt jelezni kell (a nézet mintája).
  const showUnapprovedNote =
    !isHu && report.translationsEn?.en?.status !== "approved";

  const dims = agg?.dimensionAverages
    ? HEXACO_ORDER.filter((d) => typeof agg.dimensionAverages?.[d] === "number")
    : [];

  const psych = agg?.psychSafety ?? null;
  const trust = agg?.trustHighlights ?? null;
  const dynamics = agg?.dynamics ?? null;
  const dynamicsTotal = dynamics
    ? dynamics.alignedCount + dynamics.complementaryCount + dynamics.frictionCount
    : 0;

  const bandLabel = psych
    ? psych.band === "high"
      ? isHu ? "Erős biztonság-élmény" : "Strong sense of safety"
      : psych.band === "mid"
        ? isHu ? "Közepes biztonság-élmény" : "Moderate sense of safety"
        : isHu ? "Törékeny biztonság-élmény" : "Fragile sense of safety"
    : null;

  const sourceLabel = (source: string) =>
    source === "trust_round"
      ? isHu ? "mért bizalmi kör" : "measured trust round"
      : source === "mixed"
        ? isHu ? "vegyes (mért + becsült)" : "mixed (measured + estimated)"
        : isHu ? "profil-alapú becslés" : "profile-based estimate";

  const hasRelationalChapter = Boolean(
    (dynamics && dynamicsTotal > 0) || trust || psych,
  );
  const hasNarrative = [
    report.summary,
    report.strengths,
    report.risks,
    report.recommendations,
    report.leadershipGuide,
  ].some((value) => splitNarrative(value).length > 0);
  const hasActions = Boolean(report.actionItems?.length);
  const hasConsultantChapter = hasNarrative || hasActions;
  const consultantChapterNumber = hasRelationalChapter ? "03" : "02";
  const actionChunks: TeamReportActionItem[][] = [];
  for (let i = 0; i < (report.actionItems?.length ?? 0); i += 4) {
    actionChunks.push(report.actionItems!.slice(i, i + 4));
  }

  return (
    <Document
      title={`${title} - ${isHu ? "Csapatriport" : "Team report"}`}
      author="trita"
      language={isHu ? "hu" : "en"}
    >
      <TeamReportCoverPage title={title} publishedDate={publishedDate} isHu={isHu} />

      {/* ── 01: gyors összkép ─────────────────────────────────────────────── */}
      <Page size="A4" style={s.page} bookmark={isHu ? "Áttekintés" : "Overview"}>
        <TeamPageHeader title={title} publishedDate={publishedDate} isHu={isHu} />
        <View style={s.body}>
          <PdfChapterHeader
            number="01"
            question={isHu ? "Mi rajzolódik ki elsőre?" : "What stands out first?"}
            title={isHu ? "Gyors összkép" : "Quick overview"}
            description={
              isHu
                ? "A csapat közös profilja, lefedettsége és működési mintázata egy oldalon."
                : "The team's shared profile, coverage, and operating pattern on one page."
            }
          />

          {showUnapprovedNote ? (
            <PdfCard tone="bronze">
              <Text style={{ ...s.caption, color: colors.bronzeDark }}>
                {"The narrative sections are shown in their original Hungarian because an approved English translation is not available yet."}
              </Text>
            </PdfCard>
          ) : null}

          {agg ? (
            <>
              {/* KPI-sor */}
              <PdfCard>
                <View style={{ flexDirection: "row" }}>
                  <KpiCell
                    value={`${agg.completedCount}/${agg.memberCount}`}
                    label={isHu ? "kitöltött felmérés" : "completed assessments"}
                    sub={`${agg.completionPct}%`}
                  />
                  {agg.pattern ? (
                    <KpiCell
                      value={agg.pattern.label}
                      label={isHu ? "működési mintázat" : "operating pattern"}
                      sub={
                        agg.pattern.stability
                          ? isHu
                            ? `stabilitás: ${agg.pattern.stability}`
                            : `stability: ${agg.pattern.stability}`
                          : undefined
                      }
                    />
                  ) : null}
                  {psych ? (
                    <KpiCell
                      value={`${psych.index}`}
                      label={isHu ? "pszichológiai biztonság (0-100)" : "psychological safety (0-100)"}
                      sub={bandLabel ?? undefined}
                    />
                  ) : null}
                </View>
              </PdfCard>

              {/* Dimenzió-átlagok */}
              {dims.length > 0 ? (
                <PdfCard eyebrow={isHu ? "A csapat személyiség-profilja" : "Team personality profile"}>
                  {dims.map((code) => (
                    <DimRow
                      key={code}
                      code={code}
                      avg={agg.dimensionAverages![code]}
                      spread={agg.dimensionSpread?.[code] ?? null}
                      isHu={isHu}
                    />
                  ))}
                  <Text style={{ ...s.caption, marginTop: 5 }}>
                    {isHu
                      ? "0-100 skála · a halvány sáv a csapaton belüli szóródást (heterogenitást) jelzi, nem hibahatárt. Egyéni eredmény nem jelenik meg."
                      : "0-100 scale · the light band shows within-team spread (heterogeneity), not an error margin. Individual results are not shown."}
                  </Text>
                </PdfCard>
              ) : null}

              {/* Mintázat-jegyzet */}
              {agg.pattern?.stabilityNote ? (
                <PdfCard eyebrow={isHu ? "Mintázat-stabilitás" : "Pattern stability"}>
                  <Text style={s.bodyText}>
                    {agg.pattern.stabilityNote}
                  </Text>
                </PdfCard>
              ) : null}
            </>
          ) : (
            <PdfCard>
              <Text style={s.bodyText}>
                {isHu
                  ? "Ehhez a riporthoz nincs rögzített aggregátum."
                  : "No frozen aggregates are attached to this report."}
              </Text>
            </PdfCard>
          )}

          {agg?.evidence ? (
            <MethodologyCard agg={agg} generatedDate={generatedDate} isHu={isHu} />
          ) : null}
        </View>
        <PdfFooter locale={isHu ? "hu" : "en"} />
      </Page>

      {hasRelationalChapter ? (
        <TeamChapterPage
          title={title}
          publishedDate={publishedDate}
          isHu={isHu}
          bookmark={isHu ? "Kapcsolati kép" : "Relational picture"}
        >
          <PdfChapterHeader
              number="02"
              question={isHu ? "Hogyan kapcsolódik a csapat?" : "How does the team connect?"}
              title={isHu ? "Kapcsolati kép" : "Relational picture"}
              description={
                isHu
                  ? "Aggregált dinamika, bizalmi lefedettség és pszichológiai biztonság - egyéni válaszok nélkül."
                  : "Aggregate dynamics, trust coverage, and psychological safety - without individual responses."
              }
          />

          {dynamics && dynamicsTotal > 0 ? (
              <PdfCard eyebrow={isHu ? "Kapcsolati dinamika" : "Team dynamics"}>
                <View style={{ flexDirection: "row", marginBottom: 8 }}>
                  <KpiCell value={`${dynamics.alignedCount}`} label={isHu ? "hasonló pár" : "aligned pairs"} />
                  <KpiCell value={`${dynamics.complementaryCount}`} label={isHu ? "kiegészítő pár" : "complementary pairs"} />
                  <KpiCell value={`${dynamics.frictionCount}`} label={isHu ? "súrlódás-kockázat" : "friction risk"} />
                </View>
                <Text style={s.caption}>
                  {isHu ? "Adatforrás: " : "Data source: "}
                  {sourceLabel(dynamics.source)}
                  {" · "}
                  {isHu
                    ? "kizárólag aggregált kép - egyéni párok nem jelennek meg."
                    : "aggregate view only - individual pairs are not shown."}
                </Text>
              </PdfCard>
          ) : null}

          {trust ? (
              <PdfCard eyebrow={isHu ? "Bizalmi háló lefedettség" : "Trust network coverage"}>
                <Text style={{ ...s.bodyText, marginBottom: 5 }}>
                  {trust.coveragePct !== null
                    ? isHu
                      ? `A lehetséges kapcsolati párok ${trust.coveragePct}%-a mért (${trust.measuredPairCount}${trust.possiblePairCount ? `/${trust.possiblePairCount}` : ""} pár).`
                      : `${trust.coveragePct}% of possible pairs measured (${trust.measuredPairCount}${trust.possiblePairCount ? `/${trust.possiblePairCount}` : ""} pairs).`
                    : isHu
                      ? "A kiemelések profil-alapú becslésből származnak - mért bizalmi kör még nincs."
                      : "Highlights come from a profile-based estimate - no measured trust round yet."}
                </Text>
                <Text style={s.caption}>
                  {isHu
                    ? `Összekötő (hub): ${trust.hubs.length} fő · beágyazatlan tag: ${trust.isolated.length} fő. A nyomtatott riport szándékosan nem tartalmaz neveket.`
                    : `Hubs: ${trust.hubs.length} · not yet embedded: ${trust.isolated.length}. The printed report deliberately omits names.`}
                </Text>
              </PdfCard>
          ) : null}

          {psych ? (
              <PdfCard eyebrow={isHu ? "Pszichológiai biztonság (pulse)" : "Psychological safety (pulse)"} tone="sage">
                <Text style={{ fontFamily: "Fraunces", fontSize: type.section, color: colors.sageDark, marginBottom: 5 }}>
                  {psych.index}
                  <Text style={{ fontFamily: "DM Sans", fontSize: type.caption, color: colors.ink300 }}>
                    {` / 100 · ${bandLabel}`}
                  </Text>
                </Text>
                <Text style={{ ...s.bodyText, marginBottom: 4 }}>
                  {psych.count} {isHu ? "névtelen válasz" : "anonymous responses"}
                  {psych.weakItemIds.length > 0
                    ? isHu
                      ? ` · ${psych.weakItemIds.length} küszöb alatti terület`
                      : ` · ${psych.weakItemIds.length} below-threshold area(s)`
                    : ""}
                </Text>
                <Text style={s.caption}>
                  {isHu
                    ? "Névtelen mérés: csak csapatszintű összesítés, egyéni válasz nem visszakereshető (min. 3 kitöltés)."
                    : "Anonymous measurement: team-level aggregate only; individual answers cannot be traced back (min. 3 responses)."}
                </Text>
              </PdfCard>
          ) : null}
        </TeamChapterPage>
      ) : null}

      {hasConsultantChapter ? (
        <TeamChapterPage
          title={title}
          publishedDate={publishedDate}
          isHu={isHu}
          bookmark={isHu ? "Tanácsadói értékelés" : "Consultant assessment"}
        >
          <PdfChapterHeader
              number={consultantChapterNumber}
              question={isHu ? "Mi következik ebből?" : "What follows from this?"}
              title={isHu ? "Tanácsadói értékelés" : "Consultant assessment"}
              description={
                isHu
                  ? "A közös kép értelmezése és a következő 30/60/90 nap fókuszai."
                  : "Interpretation of the shared picture and priorities for the next 30/60/90 days."
              }
          />
          <NarrativeCard eyebrow={isHu ? "Összegzés" : "Summary"} text={report.summary} />
          <NarrativeCard eyebrow={isHu ? "Erősségek" : "Strengths"} text={report.strengths} />
          <NarrativeCard eyebrow={isHu ? "Kockázatok" : "Risks"} text={report.risks} />
          <NarrativeCard eyebrow={isHu ? "Javaslatok" : "Recommendations"} text={report.recommendations} />
          <NarrativeCard eyebrow={isHu ? "Vezetői iránytű" : "Leadership guide"} text={report.leadershipGuide} />

          {actionChunks.map((items, chunkIndex) => (
              <PdfCard
                key={chunkIndex}
                eyebrow={
                  chunkIndex === 0
                    ? isHu ? "Akcióterv (30/60/90 nap)" : "Action plan (30/60/90 days)"
                    : isHu ? "Akcióterv - folytatás" : "Action plan - continued"
                }
              >
                {items.map((item, i) => (
                  <ActionRow key={i} item={item} isHu={isHu} />
                ))}
                {chunkIndex === actionChunks.length - 1 ? (
                  <Text style={s.caption}>
                    {isHu
                      ? "Az akciók élő státusza a platformon követhető - ez a riport a publikáláskori állapotot rögzíti."
                      : "Live action status is tracked on the platform - this report captures the state at publication."}
                  </Text>
                ) : null}
              </PdfCard>
          ))}
        </TeamChapterPage>
      ) : null}
    </Document>
  );
}

/** Fájlnév-barát szelet a riport-címből (ékezet- és szóköz-mentes). */
function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "csapatkep"
  );
}

export async function downloadTeamReportPdf(data: TeamReportPdfData): Promise<void> {
  const blob = await pdf(<TeamReportDocument {...data} />).toBlob();
  const date = new Date().toISOString().slice(0, 10);
  saveAs(blob, `trita-csapatriport-${slugify(data.report.title ?? "")}-${date}.pdf`);
}
