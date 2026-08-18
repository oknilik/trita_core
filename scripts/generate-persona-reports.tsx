/**
 * generate-persona-reports.tsx — az összes persona eredmény-riportja EGY PDF-be,
 * típusonként csoportosítva, tartalomjegyzékkel és PDF-könyvjelzőkkel (outline)
 * a lapozgatáshoz.
 *
 * A riportok a VALÓDI react-pdf komponensekből (CoverPage / QuickOverviewPage /
 * Chapter*Page) épülnek, ugyanabból a KÖZÖS riport-view-modelből, amit az
 * eredmény-oldal PDF-exportja is használ (profile-report-view-model.ts) — a
 * content-pipeline (dimenzió-insightok, feszültség-pár narratívák, munkastílus,
 * csapatszerep-becslés) a valós lib-függvényekből fordul, így a dosszié azt
 * mutatja, amit a felhasználók is látnának a saját riportjukban.
 *
 * Futtatás:
 *   pnpm report:personas                 # mind a 48, HU, plus (teljes) riport
 *   pnpm report:personas --locale en
 *   pnpm report:personas --plan start    # csak az alap (Start) riport
 *   pnpm report:personas --only inte-open,pair-supported-visibility
 *   pnpm report:personas --out /abs/path.pdf
 *
 * Kimenet alapból: docs/testing/persona-riportok.pdf
 */

import { resolve, join } from "path";
import { Font, Document, renderToFile } from "@react-pdf/renderer";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import React from "react";

import { buildAllPersonas, buildFacets, type Persona } from "./personas.shared";
import { getTestConfig } from "../src/lib/questions";
import { buildWorkstyleContent } from "../src/lib/workstyle-content";
import { resolvePersonalityTypeFromScores } from "../src/lib/personality-type";
import {
  DIMENSION_STRENGTH_VERBS,
  DIMENSION_WEAK_VERBS,
} from "../src/lib/dimension-insights";
import { t, type Locale } from "../src/lib/i18n";
import {
  buildProfileReportViewModel,
  type ProfileReportInput,
} from "../src/lib/profile-report-view-model";
import { CoverPage } from "../src/components/pdf/pages/CoverPage";
import { QuickOverviewPage } from "../src/components/pdf/pages/QuickOverviewPage";
import { ChapterOverviewPage } from "../src/components/pdf/pages/ChapterOverviewPage";
import { ChapterDimensionsPage, chunkDimensions } from "../src/components/pdf/pages/ChapterDimensionsPage";
import { ChapterWorkStylePage } from "../src/components/pdf/pages/ChapterWorkStylePage";
import { AppendixRelationalPage } from "../src/components/pdf/pages/AppendixRelationalPage";
import { chapterStartPages } from "../src/components/pdf/TritaPdf";
import { colors } from "../src/components/pdf/styles";

// ─── Fontok: a styles.ts /fonts/-ra regisztrál (böngésző-origin) — node-ban
//     abszolút fájlútra kell átregisztrálni, hogy a render ne bukjon el.
//     Font.clear() törli az import-kori relatív regisztrációkat, hogy ne
//     maradjon bent a /fonts/ forrás a család mellett. ─────────────────────
const FONT_DIR = join(process.cwd(), "public", "fonts");
Font.clear();
Font.register({
  family: "Fraunces",
  fonts: [
    { src: join(FONT_DIR, "Fraunces-Regular.ttf"), fontWeight: 400 },
    { src: join(FONT_DIR, "Fraunces-Regular.ttf"), fontWeight: 600 },
    { src: join(FONT_DIR, "Fraunces-Italic.ttf"), fontStyle: "italic" },
  ],
});
Font.register({
  family: "DM Sans",
  fonts: [
    { src: join(FONT_DIR, "DMSans-Regular.ttf"), fontWeight: 400 },
    { src: join(FONT_DIR, "DMSans-Regular.ttf"), fontWeight: 500 },
    { src: join(FONT_DIR, "DMSans-Regular.ttf"), fontWeight: 600 },
  ],
});
// Font.clear() a beépített Helvetica-fallbacket is törli; a react-pdf néhány
// alapértelmezett szövegnél ezt kéri — DM Sans / Fraunces-Italic TTF-re
// pótoljuk (magyar glyphek, normal + italic, hogy egy variáns se hiányozzon).
Font.register({
  family: "Helvetica",
  fonts: [
    { src: join(FONT_DIR, "DMSans-Regular.ttf"), fontWeight: 400 },
    { src: join(FONT_DIR, "DMSans-Regular.ttf"), fontWeight: 700 },
    { src: join(FONT_DIR, "Fraunces-Italic.ttf"), fontWeight: 400, fontStyle: "italic" },
    { src: join(FONT_DIR, "Fraunces-Italic.ttf"), fontWeight: 700, fontStyle: "italic" },
  ],
});

// ─── Riport-bemenet (ProfileReportInput) összeállítása. A tartalmi szabályok
//     a közös view-modelben élnek; itt csak a persona-specifikus NYERS adatot
//     állítjuk elő (pontszámok, facetek, típusnév, hero-tagline). ────────────

const isHuLoc = (l: Locale) => l === "hu";

function getInsight(score: number, insights: { low: string; mid: string; high: string }): string {
  const range = score < 40 ? "low" : score < 70 ? "mid" : "high";
  return insights[range];
}

// Hero-tagline térképek — közös forrásból (dimension-insights.ts). A többi
// tartalmi szabály (bulletek, profil-karakter, archetípus-sztori, csapatszerep-
// precedencia, összkép-insightok) a KÖZÖS view-modelben él, nem itt.
const strengthVerbs = DIMENSION_STRENGTH_VERBS;
const weakVerbs = DIMENSION_WEAK_VERBS;

function buildReportInput(
  persona: Persona,
  locale: Locale,
  plan: "start" | "plus",
): ProfileReportInput {
  const config = getTestConfig("TRITAN", locale);
  const facetScores = buildFacets(persona.dimensions);

  // „Nincs mérve" ≠ 0 pont: a persona csak a hat fő dimenziót definiálja, ezért
  // a kiegészítő „I" skála KIMARAD — a korábbi `?? 0` fallback egy 0%-os
  // „Segítőkészség" sort renderelt a mintariportokba (PDF-audit P0/7).
  const dimensions = config.dimensions.flatMap((dim) => {
    const score = persona.dimensions[dim.code];
    if (typeof score !== "number") return [];
    const insights = (dim.insightsByLocale?.[locale] ?? dim.insights) as {
      low: string; mid: string; high: string;
    };
    return [{
      code: dim.code,
      label: (dim.labelByLocale?.[locale] ?? dim.label) as string,
      score,
      insight: getInsight(score, insights),
      description: (dim.descriptionByLocale?.[locale] ?? dim.description) as string,
      facets: (dim.facets ?? []).flatMap((f) => {
        const facetScore = facetScores[dim.code]?.[f.code];
        if (typeof facetScore !== "number") return [];
        return [{
          code: f.code,
          label: (f.labelByLocale?.[locale] ?? f.label) as string,
          score: facetScore,
        }];
      }),
    }];
  });

  const mainDims = dimensions.filter((d) => d.code !== "I");
  const sortedDims = [...mainDims].sort((a, b) => b.score - a.score);

  const personalityType =
    resolvePersonalityTypeFromScores(mainDims.map((d) => ({ code: d.code, score: d.score })), locale) ??
    t("results.uniqueProfile", locale);

  const heroInsight = (() => {
    const strongest = sortedDims[0];
    const weakest = sortedDims[sortedDims.length - 1];
    if (!strongest || !weakest) return "";
    const sv = strengthVerbs[strongest.code]?.[locale] ?? strongest.label;
    const wv = weakVerbs[weakest.code]?.[locale] ?? weakest.label.toLowerCase();
    return `${sv} — ${wv}.`;
  })();

  const dimScores = Object.fromEntries(mainDims.map((d) => [d.code, d.score]));
  const workstyle = buildWorkstyleContent(dimScores, "TRITAN", locale);

  return {
    locale,
    plan,
    userName: persona.label,
    completedAt: new Date().toLocaleDateString(isHuLoc(locale) ? "hu-HU" : "en-GB", {
      year: "numeric", month: "long", day: "numeric",
    }),
    personalityType,
    heroInsight,
    dimensions: plan === "plus"
      ? dimensions
      : dimensions.map((d) => ({ ...d, facets: [] })),
    // Persona-riport: nincs kitöltött csapatszerep-kérdőív → profil-alapú
    // becslés, sáv-címkével és pontszám nélkül (a view-model dönti el).
    teamRoleMeasuredScores: null,
    plusContent: plan === "plus" ? {
      howYouWorkParts: workstyle.howYouWorkParts,
      pressure: workstyle.pressure,
      pressureParts: workstyle.pressureParts,
      growthTip: workstyle.growthTip,
      growthPlan: workstyle.growthPlan,
      collaboration: workstyle.collaboration,
      envItems: workstyle.envItems,
      roleFit: workstyle.roleFit,
      takeaways: workstyle.takeaways,
    } : undefined,
  };
}

// ─── Tartalomjegyzék-oldal ────────────────────────────────────────────────────

const toc = StyleSheet.create({
  page: { fontFamily: "DM Sans", backgroundColor: "#ffffff", padding: "48 54" },
  title: { fontFamily: "Fraunces", fontSize: 26, fontWeight: 700, color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 11, color: colors.ink300, marginBottom: 20 },
  sectionTitle: { fontFamily: "Fraunces", fontSize: 15, fontWeight: 700, color: colors.sage, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5 solid #eee" },
  name: { fontSize: 10.5, color: colors.ink },
  slug: { fontSize: 9, color: "#9a9aa6", fontFamily: "DM Sans" },
  note: { fontSize: 9, color: "#9a9aa6", marginTop: 24, lineHeight: 1.5 },
});

function tocSection(heading: string, list: Persona[]) {
  return (
    <View key={heading}>
      <Text style={toc.sectionTitle}>{heading}</Text>
      {list.map((p) => (
        <View style={toc.row} key={p.slug} wrap={false}>
          <Text style={toc.name}>{p.label}</Text>
          <Text style={toc.slug}>{p.tensionKey ? `${p.slug} · ${p.tensionKey}` : p.slug}</Text>
        </View>
      ))}
    </View>
  );
}

function TocPage({ archetypes, tensions, locale }: { archetypes: Persona[]; tensions: Persona[]; locale: Locale }) {
  const hu = isHuLoc(locale);
  return (
    <Page size="A4" style={toc.page} bookmark={{ title: hu ? "Tartalomjegyzék" : "Contents" }}>
      <Text style={toc.title}>{hu ? "Persona-riportok" : "Persona reports"}</Text>
      <Text style={toc.subtitle}>
        {hu
          ? `${archetypes.length + tensions.length} riport · a bal oldali könyvjelző-sávban (outline) lapozhatsz közöttük`
          : `${archetypes.length + tensions.length} reports · use the bookmarks/outline sidebar to jump between them`}
      </Text>
      {tocSection(hu ? `Archetípusok (${archetypes.length})` : `Archetypes (${archetypes.length})`, archetypes)}
      {tocSection(hu ? `Feszültség-párok (${tensions.length})` : `Tension pairs (${tensions.length})`, tensions)}
      <Text style={toc.note}>
        {hu
          ? "A riportok determinisztikus persona-pontszámokból épülnek (scripts/personas.shared.ts), a valós eredmény-oldal PDF-komponenseivel. A tartalom értékeléshez készült."
          : "Reports are built from deterministic persona scores (scripts/personas.shared.ts) using the real result-page PDF components, for content evaluation."}
      </Text>
    </Page>
  );
}

function DividerPage({ title }: { title: string }) {
  return (
    <Page size="A4" style={{ fontFamily: "Fraunces", backgroundColor: colors.sage, justifyContent: "center", alignItems: "center" }}
      bookmark={{ title }}>
      <Text style={{ fontSize: 30, fontWeight: 700, color: "#ffffff", letterSpacing: 1 }}>{title}</Text>
    </Page>
  );
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) { out[key] = next; i++; } else { out[key] = "true"; }
    }
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const locale: Locale = args.locale === "en" ? "en" : "hu";
  const plan: "start" | "plus" = args.plan === "start" ? "start" : "plus";

  let personas = buildAllPersonas();
  if (args.only) {
    const wanted = new Set(args.only.split(",").map((s) => s.trim().toLowerCase()));
    personas = personas.filter((p) => wanted.has(p.slug));
    if (personas.length === 0) { console.error("❌  --only nem talált personát"); process.exit(1); }
  }

  const archetypes = personas.filter((p) => p.kind === "archetype");
  const tensions = personas.filter((p) => p.kind === "tension");
  const hu = isHuLoc(locale);

  const renderReport = (p: Persona) => {
    const model = buildProfileReportViewModel(buildReportInput(p, locale, plan));
    const bookmark = { title: `${p.label} · ${p.slug}`, expanded: false } as const;
    const dimensionChunks = chunkDimensions(model.dimensionsChapter.dimensions);
    // A dosszié minden persona-riportot EGY dokumentumba fűz, ezért a
    // riporton belüli oldalszámozás itt nem értelmezhető — a lábléc a
    // dokumentum-szintű számot mutatja, a lapozás a könyvjelzőkkel megy.
    const pages: React.ReactElement[] = [
      <CoverPage key={`${p.slug}-cover`} model={model} bookmark={bookmark} />,
    ];
    if (plan === "plus") {
      pages.push(
        <QuickOverviewPage
          key={`${p.slug}-quick`}
          model={model}
          chapterStartPages={chapterStartPages(model)}
        />,
      );
    }
    pages.push(<ChapterOverviewPage key={`${p.slug}-ch1`} model={model} />);
    dimensionChunks.forEach((dims, i) => {
      pages.push(
        <ChapterDimensionsPage
          key={`${p.slug}-ch2-${i}`}
          model={model}
          dims={dims}
          isFirst={i === 0}
          isLast={i === dimensionChunks.length - 1}
        />,
      );
    });
    pages.push(<ChapterWorkStylePage key={`${p.slug}-ch3`} model={model} />);
    if (model.appendices.some((a) => a.id === "relational")) {
      pages.push(<AppendixRelationalPage key={`${p.slug}-appx`} model={model} />);
    }
    return pages;
  };

  const doc = (
    <Document title={hu ? "Trita persona-riportok" : "Trita persona reports"}>
      <TocPage archetypes={archetypes} tensions={tensions} locale={locale} />
      {archetypes.length > 0 && <DividerPage title={hu ? `Archetípusok (${archetypes.length})` : `Archetypes (${archetypes.length})`} />}
      {archetypes.flatMap(renderReport)}
      {tensions.length > 0 && <DividerPage title={hu ? `Feszültség-párok (${tensions.length})` : `Tension pairs (${tensions.length})`} />}
      {tensions.flatMap(renderReport)}
    </Document>
  );

  const outPath = args.out
    ? resolve(args.out)
    : join(process.cwd(), "docs", "testing", `persona-riportok${locale === "en" ? "-en" : ""}${plan === "start" ? "-start" : ""}.pdf`);

  console.log(`⏳  Renderelés: ${personas.length} persona (${plan}, ${locale})…`);
  await renderToFile(doc, outPath);
  console.log(`🎉  Kész: ${outPath}`);
}

main().catch((e) => { console.error("❌  Hiba:", (e as Error).message, e); process.exit(1); });
