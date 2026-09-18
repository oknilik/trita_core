import { programComparisonLines, personalitySourceLabel } from "@/lib/programs/report";
import { Document, Page, View, Text, pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import type { ReactNode } from "react";
import { s, colors, type } from "./styles";
import { PdfMiniHeader } from "./components/PdfCard";
import { PdfOperatingPatternIllustration } from "./components/PdfOperatingPatternIllustration";
import { PdfFooter } from "./components/PdfFooter";
import { presentTeamStyle, type StyleSection } from "@/lib/team-operating-style/presentation";
import { cataloguePattern } from "@/lib/team-operating-style/catalogue";
import { AXES } from "@/lib/team-operating-style/questions";
import { COMPOSITION_AXES } from "@/lib/team-operating-style/comparison";
import { reportAttentionSignals, reportNextStep } from "@/lib/team-report-reader";
import { HEXACO_ORDER, HEXACO_DIMENSIONS, isHexacoCode } from "@/lib/hexaco";
import { DIMENSION_BASE } from "@/lib/color-system";
import { TEAM_ROLES } from "@/lib/team-role-scoring";
import { TEAM_PRESSURE_CONTENT, TEAM_PRESSURE_POLARIZED_TEXT } from "@/lib/team-pressure";
import { getPsychSafetyItem } from "@/lib/psych-safety";
import { teamActionTargetLabel } from "@/lib/team-action-target";
import { t } from "@/lib/i18n";
import type { SerializedTeamReport, TeamReportActionItem } from "@/lib/team-report";

export interface TeamReportPdfData { report: SerializedTeamReport; isHu: boolean }

const body = { fontSize: type.body, color: colors.ink500, lineHeight: type.lineHeight.body };
const caption = { fontSize: type.caption, color: colors.ink300, lineHeight: type.lineHeight.caption };
const heading = { fontFamily: "Fraunces", fontSize: type.section, color: colors.ink };
const num = (value: number | null, isHu: boolean) => value === null ? "-" : value.toLocaleString(isHu ? "hu-HU" : "en-GB", { maximumFractionDigits: 1 });
const date = (value: string | null | undefined, isHu: boolean) => value ? new Date(value).toLocaleDateString(isHu ? "hu-HU" : "en-GB", { timeZone: "UTC" }) : "";

function Chapter({ title, children, keepTogether = false }: { title: string; children: ReactNode; keepTogether?: boolean }) {
  return <View wrap={!keepTogether} style={{ gap: 8 }}>
    <Text minPresenceAhead={50} style={{ ...heading, borderBottom: `0.5 solid ${colors.sand}`, paddingBottom: 9 }}>{title}</Text>
    {children}
  </View>;
}

function Notes({ notes }: { notes: string[] }) {
  return <View style={{ gap: 4 }}>{notes.map((note) => <Text key={note} style={caption}>{note}</Text>)}</View>;
}

function Narrative({ title, text }: { title: string; text: string | null }) {
  if (!text?.trim()) return null;
  // Long consultant text must flow across pages, without truncation or giant unbreakable cards.
  return <View style={{ gap: 6 }}>
    <Text minPresenceAhead={35} style={{ ...heading, fontSize: type.subhead }}>{title}</Text>
    {text.split(/\r?\n/).filter((line) => line.trim()).map((line, index) => <Text key={index} orphans={2} widows={2} style={body}>{line}</Text>)}
  </View>;
}

function ReportPage({ report, isHu, bookmark, children, compact = false }: TeamReportPdfData & { bookmark: string; children: ReactNode; compact?: boolean }) {
  return <Page size="A4" style={s.page} bookmark={bookmark}>
    <PdfMiniHeader userName={report.title || (isHu ? "Csapatkép" : "Team picture")} reportLabel={isHu ? "Csapatriport" : "Team report"} planLabel="" date={date(report.publishedAt, isHu)} locale={isHu ? "hu" : "en"} />
    <View style={{ padding: "14 32 0", gap: compact ? 12 : 20 }}>{children}</View>
    <PdfFooter locale={isHu ? "hu" : "en"} coverPages={0} />
  </Page>;
}

function Action({ item, isHu }: { item: TeamReportActionItem; isHu: boolean }) {
  const statuses = { not_started: isHu ? "Még nem indult" : "Not started", in_progress: isHu ? "Folyamatban" : "In progress", blocked: isHu ? "Elakadt" : "Blocked", done: isHu ? "Kész" : "Done" };
  return <View style={{ gap: 5, paddingTop: 10, borderTop: `0.5 solid ${colors.sand}` }}>
    <Text minPresenceAhead={40} style={{ ...body, fontWeight: 600, color: colors.ink }}>{item.title}</Text>
    {item.description && <Text style={body}>{item.description}</Text>}
    <Text style={caption}>{[
      item.owner ? `${isHu ? "Felelős" : "Owner"}: ${item.owner}` : isHu ? "Felelős: még nincs kijelölve" : "Owner: not assigned",
      item.dueDate ? `${isHu ? "Határidő" : "Due"}: ${item.dueDate}` : `${item.timeframe} ${isHu ? "napos fókusz" : "day focus"}`,
      statuses[item.status ?? "not_started"],
    ].join(" · ")}</Text>
    {item.targetMetric && <Text style={caption}>{isHu ? "Célmutató" : "Target"}: {teamActionTargetLabel(item.targetMetric, isHu ? "hu" : "en")}</Text>}
    {item.note && <Text style={body}>{item.note}</Text>}
  </View>;
}

function Prompt({ prompt, isHu }: { prompt: StyleSection["prompts"][number]; isHu: boolean }) {
  return <View wrap={false} style={{ gap: 7, paddingTop: 10, borderTop: `0.5 solid ${colors.sand}` }}>
    <Text style={{ ...body, fontWeight: 600, color: colors.ink }}>{prompt.title}</Text>
    <View style={{ flexDirection: "row", gap: 18 }}>
      <View style={{ flex: 1, gap: 4, borderLeft: `2 solid ${colors.sage}`, paddingLeft: 10 }}>
        <Text style={{ ...caption, color: colors.sageDark }}>{isHu ? "Lehetséges támasz" : "Possible support"}</Text><Text style={body}>{prompt.support}</Text>
      </View>
      <View style={{ flex: 1, gap: 4, borderLeft: `2 solid ${colors.bronze}`, paddingLeft: 10 }}>
        <Text style={{ ...caption, color: colors.bronzeDark }}>{isHu ? "Tisztázandó kérdés" : "Question to explore"}</Text><Text style={body}>{prompt.tension}</Text>
      </View>
    </View>
    <Text style={caption}>{prompt.context}</Text>
  </View>;
}

function StatsTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <View>
    <View wrap={false} style={{ flexDirection: "row", borderBottom: `1 solid ${colors.sand}`, paddingVertical: 8 }}>
      {headers.map((label, i) => <Text key={i} style={{ ...caption, flex: i === 0 ? 2 : 1, fontWeight: 600 }}>{label}</Text>)}
    </View>
    {rows.map((row, index) => <View key={index} wrap={false} style={{ flexDirection: "row", paddingVertical: 9, borderBottom: `0.5 solid ${colors.sand}` }}>
      {row.map((cell, i) => <Text key={i} style={{ ...body, flex: i === 0 ? 2 : 1, paddingRight: 5 }}>{cell}</Text>)}
    </View>)}
  </View>;
}
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


/** Frozen report only. Operating behavior and personality composition stay separate. */
export function TeamReportDocument({ report, isHu }: TeamReportPdfData) {
  const agg = report.aggregates;
  const locale = isHu ? "hu" : "en";
  const tr = (key: string) => t(`tos.report.${key}`, locale);
  const [operating, composition, comparison] = presentTeamStyle(agg?.teamStyle, locale, agg?.pattern?.label);
  const op = agg?.teamStyle?.operating;
  const comp = agg?.teamStyle?.composition;
  const operatingPattern = !op?.patternUnavailableReason && op?.pattern ? cataloguePattern(op.pattern.code) : null;
  const next = reportNextStep(report, isHu);
  const signals = reportAttentionSignals(agg, isHu);
  const nearMiddle = op && AXES.every((axis) => op.axes[axis].status === "available" && op.axes[axis].flags.includes("near_midpoint"));
  const narratives = [
    [isHu ? "Összegzés" : "Summary", report.summary],
    [isHu ? "Amire építhettek" : "What you can build on", report.strengths],
    [isHu ? "Amit érdemes tisztázni" : "What needs attention", report.risks],
    [isHu ? "Ajánlások" : "Recommendations", report.recommendations],
    [isHu ? "Interjúk tanulságai" : "Interview insights", report.interviewFindings],
    [isHu ? "Vezetői iránytű" : "Leadership guide", report.leadershipGuide],
  ].filter((entry) => entry[1]?.trim());
  const dims = agg?.dimensionAverages ? HEXACO_ORDER.filter((d) => typeof agg.dimensionAverages?.[d] === "number") : [];
  const psych = agg?.psychSafety;
  const trust = agg?.trustHighlights;
  const dynamics = agg?.dynamics;
  const hasDetails = !!(psych || trust || dynamics || agg?.roleDistribution || agg?.peerRoles || agg?.feedbackCulture || agg?.pressure?.concentrations.length || agg?.evidence);
  const hasInterpretation = Boolean(op || comp || comparison.prompts.length || signals.length || narratives.length || report.actionItems?.length);
  const sourceLabel = (source?: string) => source === "trust_round" ? (isHu ? "Mért bizalmi kör" : "Measured trust round") : source === "mixed" ? (isHu ? "Vegyes: mért és becsült" : "Mixed: measured and estimated") : (isHu ? "Személyiségprofilból becsült" : "Personality-based estimate");
  return <Document title={`${report.title || "trita"} - ${isHu ? "Csapatriport" : "Team report"}`} author="trita" language={locale}>
    <ReportPage report={report} isHu={isHu} bookmark={isHu ? "Csapatkép" : "Team picture"}>
      <View wrap={false} style={{ gap: 5 }}>
        <Text style={{ ...caption, color: colors.bronze }}>{isHu ? "CSAPATKÉP" : "TEAM PICTURE"}</Text>
        <Text style={{ ...heading, fontSize: type.chapter }}>{report.title || (isHu ? "Értsétek meg. Alakítsátok együtt." : "Understand it. Shape it together.")}</Text>
        <Text style={caption}>{agg ? (isHu ? `${agg.memberCount} fős csapat` : `${agg.memberCount} team members`) : ""}{report.status === "DRAFT" ? (isHu ? " · Vázlat-előnézet" : " · Draft preview") : ""}</Text>
      </View>
      <Chapter title={operating.title}>
        <View wrap={false} style={{ padding: 18, backgroundColor: colors.sageDark, borderRadius: 12, gap: 9 }}>
          {operatingPattern && !nearMiddle && <Text style={{ ...caption, color: colors.white }}>{operatingPattern.code} · {op?.pattern?.status === "tentative" ? tr("tentative") : (isHu ? "Mért működési minta" : "Measured operating pattern")}</Text>}
          {operating.heading && <Text style={{ ...heading, color: colors.white }}>{nearMiddle ? tr("nearMiddleSummary") : operating.heading}</Text>}
          {operatingPattern && !nearMiddle && op?.pattern?.status === "descriptive" && <Text style={{ ...body, color: colors.white }}>{operatingPattern.description[locale]}</Text>}
          {op && <View style={{ alignSelf: "center", padding: 6, backgroundColor: colors.white, borderRadius: 8 }}><PdfOperatingPatternIllustration code={operatingPattern && !nearMiddle && op.pattern?.status === "descriptive" ? operatingPattern.code : "MIXED"} /></View>}
        </View>
        {nearMiddle && <Text style={body}>{tr("nearMiddleHelp")}</Text>}
        <Notes notes={operating.notes} />
        {op && <View style={{ gap: 14 }}>
          {AXES.map((axis) => {
            const a = op.axes[axis];
            return <View key={axis} wrap={false} style={{ gap: 5 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <Text style={{ ...body, width: 100, fontWeight: 600, color: colors.ink }}>{t(`tos.axes.${axis}.name`, locale)}</Text>
                <View style={{ flex: 1, gap: 7 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={caption}>{t(`tos.axes.${axis}.left`, locale)}</Text><Text style={caption}>{t(`tos.axes.${axis}.right`, locale)}</Text></View>
                  {a.mean !== null ? <View style={{ height: 4, backgroundColor: colors.sand, borderRadius: 2, marginHorizontal: 4 }}>
                    <View style={{ position: "absolute", left: "50%", top: -3, height: 10, width: 1, backgroundColor: colors.ink300 }} />
                    <View style={{ position: "absolute", left: `${a.mean}%`, marginLeft: -4, top: -2, height: 8, width: 8, borderRadius: 4, backgroundColor: colors.sage }} />
                  </View> : <Text style={caption}>{tr("insufficient")}</Text>}
                </View>
                <Text style={{ ...caption, width: 58, textAlign: "right" }}>{num(a.mean, isHu)}/100 · {a.n}/{op.eligibleCount}</Text>
              </View>
              {a.flags.length > 0 && <Text style={{ ...caption, paddingLeft: 114 }}>{a.flags.map((flag) => tr(`flags.${flag}`)).join(" · ")}</Text>}
            </View>;
          })}
          <Text style={caption}>{tr("centerLegend")} {isHu ? "Jobb oldalon: átlag és értékelhető válaszok." : "Right: mean and usable responses."}</Text>
        </View>}
      </Chapter>
      {!hasInterpretation && <Chapter title={isHu ? "4. A két réteg együtt" : "4. The two layers together"}><Notes notes={comparison.notes} /></Chapter>}
    </ReportPage>
    {(dims.length > 0 || comp || composition.heading) && <ReportPage report={report} isHu={isHu} bookmark={isHu ? "Személyiség-összetétel" : "Personality composition"}>
      {agg?.program?.baseline && <Chapter title={isHu ? "Változás a kiinduló méréshez képest" : "Change from baseline"}>
        <Notes notes={programComparisonLines(agg.program, isHu)} />
      </Chapter>}
      {dims.length > 0 && agg && <Chapter title={isHu ? "2. Miből épül fel a csapat?" : "2. What is the team made of?"}>
        <Text style={caption}>{agg.completedCount} {isHu ? "egyéni HEXACO-profil összesítése" : "aggregated individual HEXACO profiles"}</Text>
        <Text style={caption}>{personalitySourceLabel(agg?.program, isHu)}</Text>
        <View>{dims.map((code) => <DimRow key={code} code={code} avg={agg.dimensionAverages![code]} spread={agg.dimensionSpread?.[code] ?? null} isHu={isHu} />)}</View>
        <Text style={caption}>{isHu ? "A halvány sáv az átlag körüli egy mintaszórást jelöli, nem konfidenciaintervallumot. Egyéni eredmény nem jelenik meg." : "The faint band shows one sample SD around the mean, not a confidence interval. No individual results are shown."}</Text>
      </Chapter>}
      <Chapter title={isHu ? "3. A személyiségprofilból képzett négy tengely" : "3. Four axes derived from personality"}>
        {composition.heading && <Text style={heading}>{composition.heading}</Text>}
        <Notes notes={[...(personalitySourceLabel(agg?.program, isHu) ? [personalitySourceLabel(agg?.program, isHu)!] : []), ...composition.notes]} />
        <Text style={caption}>{isHu ? "Hajtóerő: X · Kohéziós proxy: tagonként (H + A) / 2, majd csapatátlag · Fegyelem: C · Nyitottság: O. Az Emocionalitás nem vesz részt a négytengelyes képzésben." : "Drive: X · Cohesion proxy: (H + A) / 2 per member, then team mean · Discipline: C · Openness: O. Emotionality is not part of this four-axis derivation."}</Text>
        {comp && <View style={{ gap: 9 }}>
          {COMPOSITION_AXES.map((axis) => <View key={axis} wrap={false} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Text style={{ ...body, width: 110 }}>{tr(axis)}</Text>
            <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.sand }}><View style={{ width: `${comp.axes[axis].mean}%`, height: 4, borderRadius: 2, backgroundColor: colors.sage }} /></View>
            <Text style={{ ...body, width: 52, textAlign: "right" }}>{num(comp.axes[axis].mean, isHu)} /100</Text>
          </View>)}
        </View>}
      </Chapter>
    </ReportPage>}

    {hasInterpretation && <ReportPage report={report} isHu={isHu} bookmark={isHu ? "Értelmezés" : "Interpretation"}>
      <Chapter title={isHu ? "4. A két réteg együtt" : "4. The two layers together"}>
        {comparison.heading && <Text style={{ ...body, fontWeight: 600, color: colors.ink }}>{comparison.heading}</Text>}
        <Notes notes={comparison.notes} />
        {comparison.prompts.map((prompt) => <Prompt key={prompt.title} prompt={prompt} isHu={isHu} />)}
      </Chapter>
      {signals.length > 0 && <Chapter title={isHu ? "Ami most külön figyelmet kér" : "What needs attention now"}>{signals.map((signal) => <Text key={signal} style={{ ...body, backgroundColor: colors.bronze100, padding: 12 }}>{signal}</Text>)}</Chapter>}
      {next.kind !== "recorded" && <View wrap={false} style={{ padding: 16, backgroundColor: colors.sage100, borderRadius: 12, gap: 7 }}>
        <Text style={{ ...caption, color: colors.sageDark }}>{next.kind === "review" ? (isHu ? "JAVASOLT VISSZATEKINTÉS" : "SUGGESTED REVIEW") : (isHu ? "JAVASOLT MŰHELYLÉPÉS · MÉG NEM KÖZÖS VÁLLALÁS" : "SUGGESTED WORKSHOP STEP · NOT YET A COMMITMENT")}</Text>
        <Text style={heading}>{next.title}</Text>
        <Text style={body}>{next.description}</Text>
        <Text style={caption}>{next.owner} · {next.when}</Text>
      </View>}
      {comparison.prompts.length === 0 && !report.actionItems?.length && <Chapter title={isHu ? "A megbeszélés jegyzetei" : "Debrief notes"}>
        <Text style={caption}>{isHu ? "A beszélgetés után töltsétek ki. A megállapodás a tanácsadóval rögzíthető az akciótervben." : "Complete after your discussion. Record the agreement in the action plan with your consultant."}</Text>
        {[isHu ? "Milyen konkrét helyzetből indultunk ki?" : "Which concrete situation did we discuss?", isHu ? "Milyen közös szabályt próbálunk ki?" : "Which shared rule will we try?", isHu ? "Ki fogja össze, és mikor nézünk rá újra?" : "Who will coordinate it, and when will we review it?", isHu ? "Miből fogjuk látni, hogy segített?" : "How will we know it helped?"].map((label) => <View key={label} wrap={false} style={{ gap: 12, paddingTop: 10 }}>
          <Text style={body}>{label}</Text><View style={{ height: 24, borderBottom: `0.5 solid ${colors.sand}` }} />
        </View>)}
      </Chapter>}
    </ReportPage>}

    {(narratives.length > 0 || !!report.actionItems?.length) && <ReportPage report={report} isHu={isHu} bookmark={isHu ? "Fókuszok és utánkövetés" : "Focus and follow-up"}>
      {narratives.length > 0 && <Chapter title={isHu ? "Mit érdemes ebből továbbvinni?" : "What should you take forward?"}>
        {!isHu && report.translationsEn?.en?.status !== "approved" && <Text style={{ ...caption, color: colors.bronzeDark }}>The consultant&apos;s text is shown in the Hungarian original. English translation is awaiting approval.</Text>}
        {narratives.map(([title, text]) => <Narrative key={title} title={title!} text={text} />)}
      </Chapter>}
      {!!report.actionItems?.length && <Chapter title={isHu ? "Utánkövetés" : "Follow-up"}>
        {report.actionItems.map((item, index) => <Action key={index} item={item} isHu={isHu} />)}
        <Text style={caption}>{isHu ? "Az akciók a letöltött riport állapotát mutatják. A platformon követhetitek a további változásokat." : "Actions reflect the downloaded report's state. Track subsequent changes on the platform."}</Text>
        <Text style={body}>{isHu ? "Visszatekintés: Mi történt a gyakorlatban? Mi segített? Mit tartunk meg, módosítunk vagy engedünk el?" : "Review: What happened in practice? What helped? What will we keep, change or stop?"}</Text>
      </Chapter>}
    </ReportPage>}

    {(op || comp) && <ReportPage report={report} isHu={isHu} bookmark={isHu ? "Mérési háttér" : "Measurement background"}>
      <Text style={{ ...heading, fontSize: type.chapter }}>{isHu ? "A számok és a forrásuk." : "The data and its sources."}</Text>
      {op && <Chapter title={isHu ? "Csapatműködés" : "Operating style"}>
        <Notes notes={operating.notes} />
        <StatsTable headers={[isHu ? "Terület" : "Dimension", `${tr("mean")} /100`, tr("sd"), tr("coverage")]} rows={AXES.map((axis) => { const a = op.axes[axis]; return [t(`tos.axes.${axis}.name`, locale), num(a.mean, isHu), num(a.sd, isHu), `${a.n}/${op.eligibleCount} (${num(a.coverage * 100, isHu)}%)`]; })} />
        <Text style={{ ...body, fontWeight: 600 }}>{tr("frequencies")}</Text>
        {AXES.map((axis) => <Text key={axis} style={caption}>{t(`tos.axes.${axis}.name`, locale)}: {num(op.axes[axis].leftFrequency, isHu)} / {num(op.axes[axis].rightFrequency, isHu)} · {t(`tos.axes.${axis}.left`, locale)} / {t(`tos.axes.${axis}.right`, locale)}{op.axes[axis].flags.length ? ` · ${op.axes[axis].flags.map((flag) => tr(`flags.${flag}`)).join(", ")}` : ""}</Text>)}
      </Chapter>}
      {comp && <Chapter title={isHu ? "Személyiség-összetétel" : "Personality composition"}>
        <Notes notes={[...(personalitySourceLabel(agg?.program, isHu) ? [personalitySourceLabel(agg?.program, isHu)!] : []), ...composition.notes]} />
        <StatsTable headers={[isHu ? "Terület" : "Dimension", `${tr("mean")} /100`, tr("sd"), "n"]} rows={COMPOSITION_AXES.map((axis) => [tr(axis), num(comp.axes[axis].mean, isHu), num(comp.axes[axis].sd, isHu), String(comp.memberCount)])} />
      </Chapter>}
      <Text style={caption}>{isHu ? "Az átlag a közös irányt, a mintaszórás a tagok közötti eltérést jelzi. A működésmérés kísérleti, nem validált tipológia. A két réteg eltérő konstrukciókat mér; nem képezünk közös illeszkedési százalékot." : "The mean shows the shared direction; sample SD describes differences between members. Operating style is experimental, not a validated typology. The layers measure different constructs and do not form a compatibility percentage."}</Text>
    </ReportPage>}

    {hasDetails && agg && <ReportPage compact report={report} isHu={isHu} bookmark={isHu ? "További mérési eredmények" : "Additional measurement results"}>
      <Text style={heading}>{isHu ? "További mérési eredmények" : "Additional measurement results"}</Text>
      {agg.feedbackCulture && <Chapter keepTogether title={isHu ? "Önkép és külső kép" : "Self and observer views"}>
        <Text style={caption}>{isHu ? "Mért csapattársi visszajelzések összesítése" : "Aggregate of measured observer feedback"}</Text>
        <Text style={body}>{isHu ? "Lefedettség" : "Coverage"}: {agg.feedbackCulture.coveredCount}/{agg.feedbackCulture.memberCount} · {isHu ? "Összhang" : "Aligned"}: {agg.feedbackCulture.alignedCount} · {isHu ? "Érdemi eltérés" : "Meaningful difference"}: {agg.feedbackCulture.gapCount}</Text>
      </Chapter>}

      {(psych || trust) && <View wrap={false} style={{ flexDirection: "row", gap: 20 }}>
        {psych && <View style={{ flex: 1 }}><Chapter keepTogether title={isHu ? "Pszichológiai biztonság" : "Psychological safety"}>
        <Text style={body}>{psych.index}/100 · {psych.count} {isHu ? "névtelen válasz" : "anonymous responses"} · {psych.campaignName}</Text>
        <Text style={caption}>{isHu ? "Mért, anonim csapatszintű eredmény; a magasabb érték nagyobb biztonságot jelez" : "Measured, anonymous team-level result; higher values indicate greater safety"} · {date(psych.measuredAt, isHu)}</Text>
        {Object.entries(psych.itemMeans).map(([id, mean]) => <Text key={id} style={body}>{getPsychSafetyItem(id)?.area[locale] || id}: {num(mean, isHu)}/5</Text>)}
      </Chapter></View>}
        {trust && <View style={{ flex: 1 }}><Chapter keepTogether title={isHu ? "Bizalmi háló" : "Trust network"}>
        <Text style={caption}>{sourceLabel(trust.source)}</Text>
        <Text style={body}>{isHu ? `Összekötők: ${trust.hubs.length} fő · Beágyazatlan tagok: ${trust.isolated.length} fő` : `Hubs: ${trust.hubs.length} · Not yet embedded: ${trust.isolated.length}`}</Text>
        {trust.coveragePct !== null && <Text style={caption}>{isHu ? "Mért párok lefedettsége" : "Measured pair coverage"}: {trust.coveragePct}% ({trust.measuredPairCount}/{trust.possiblePairCount ?? "-"})</Text>}
      </Chapter></View>}
      </View>}
      {dynamics && <Chapter keepTogether title={isHu ? "Kapcsolati dinamika" : "Relationship dynamics"}>
        <Text style={caption}>{sourceLabel(dynamics.source)}</Text>
        <Text style={body}>{isHu ? `Összehangolt: ${dynamics.alignedCount} · Kiegészítő: ${dynamics.complementaryCount} · Súrlódási potenciál: ${dynamics.frictionCount}` : `Aligned: ${dynamics.alignedCount} · Complementary: ${dynamics.complementaryCount} · Friction potential: ${dynamics.frictionCount}`}</Text>
        <Text style={caption}>{dynamics.source === "trust_round" ? (isHu ? "A kategóriák a mért bizalom erősségét jelzik; nem személyiség-hasonlóságot vagy tényleges konfliktust." : "Categories reflect measured trust, not personality similarity or established conflict.") : (isHu ? "A becsült kapcsolatok munkastílus-különbségeket jeleznek; a vegyes forrás mért bizalmat is tartalmaz. Nem konfliktusdiagnózis." : "Estimated relationships reflect working-style differences; mixed sources also include measured trust. This is not a conflict diagnosis.")}</Text>
      </Chapter>}
      {agg.roleDistribution && <Chapter keepTogether title={isHu ? "Szerep-lefedettség" : "Role coverage"}>
        <Text style={caption}>{agg.roleDistribution.questionnaireCount} {isHu ? "kérdőívből mért" : "measured by questionnaire"} · {agg.roleDistribution.estimateCount} {isHu ? "személyiségből becsült" : "estimated from personality"}</Text>
        {Object.entries(agg.roleDistribution.counts).map(([code, count]) => <Text key={code} style={body}>{TEAM_ROLES[code as keyof typeof TEAM_ROLES]?.[locale] || code}: {count}</Text>)}
        {!!agg.roleGaps?.length && <Text style={caption}>{isHu ? "Elsődleges szerepként nem lefedett" : "Not covered as a primary role"}: {agg.roleGaps.map((code) => TEAM_ROLES[code as keyof typeof TEAM_ROLES]?.[locale] || code).join(", ")}</Text>}
      </Chapter>}
      {agg.peerRoles && <Chapter keepTogether title={isHu ? "Csapattársi szerep-visszajelzés" : "Peer role feedback"}>
        <Text style={body}>{isHu ? "Értékelhető csapattársi visszajelzés" : "Usable peer feedback"}: {agg.peerRoles.ratedCount}/{agg.peerRoles.memberCount} · {isHu ? "Eltérő önkép és csapatkép" : "Different self and peer views"}: {agg.peerRoles.mismatchCount}/{agg.peerRoles.comparedCount}</Text>
      </Chapter>}
      {!!agg.pressure?.concentrations.length && <Chapter keepTogether title={isHu ? "Csapat nyomás alatt" : "Team under pressure"}>
        <Text style={caption}>{isHu ? "Személyiségből becsült, közös értelmezésre szánt hipotézisek." : "Personality-based hypotheses for discussion."}</Text>
        {agg.pressure.concentrations.map((c) => { const content = c.pole === "polarized" ? TEAM_PRESSURE_POLARIZED_TEXT : isHexacoCode(c.dim) ? TEAM_PRESSURE_CONTENT[c.dim]?.[c.pole] : null; return content ? <Text key={`${c.dim}-${c.pole}`} style={body}>{isHexacoCode(c.dim) ? HEXACO_DIMENSIONS[c.dim][locale] : c.dim}: {content[locale]} ({c.count}/{c.assessedCount})</Text> : null; })}
      </Chapter>}
      <Text style={caption}>{isHu ? `Rögzített aggregátum: ${date(agg.generatedAt, isHu)} · ${agg.completedCount}/${agg.memberCount} személyiségfelmérés. Egyéni válaszokat nem tartalmaz.` : `Frozen aggregates: ${date(agg.generatedAt, isHu)} · ${agg.completedCount}/${agg.memberCount} personality assessments. No individual responses included.`}</Text>
      {agg.evidence && <Text style={caption}>{isHu ? "Kapcsolati adatalap" : "Relationship data basis"}: {agg.evidence.measuredEdgeCount ?? 0} {isHu ? "mért" : "measured"} · {agg.evidence.estimatedEdgeCount} {isHu ? "becsült" : "estimated"}</Text>}
    </ReportPage>}
  </Document>;
}
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
