/**
 * generate-persona-reports.tsx — az összes persona eredmény-riportja EGY PDF-be,
 * típusonként csoportosítva, tartalomjegyzékkel és PDF-könyvjelzőkkel (outline)
 * a lapozgatáshoz.
 *
 * A riportok a VALÓDI react-pdf komponensekből (CoverPage/StartPage/…) épülnek,
 * ugyanabból a PdfData-ból, amit az eredmény-oldal PDF-exportja használ — a
 * content-pipeline (dimenzió-insightok, feszültség-pár narratívák, munkastílus,
 * csapatszerep-becslés) a valós lib-függvényekből fordul, így a dosszié azt
 * mutatja, amit a felhasználók is látnának a saját riportjukban.
 *
 * Futtatás:
 *   pnpm report:personas                 # mind a 48, HU, plus (teljes) riport
 *   pnpm report:personas --locale en
 *   pnpm report:personas --plan start    # csak az alap (1 oldal / persona)
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
import { BLOCK8, buildArchetypeStory } from "../src/lib/profile-content";
import {
  isTopPairUncertain,
  resolvePersonalityTypeFromScores,
} from "../src/lib/personality-type";
import {
  DIMENSION_STRENGTH_VERBS,
  DIMENSION_WEAK_VERBS,
  DIMENSION_STRENGTH_DESCS,
  DIMENSION_WATCH_DESCS,
} from "../src/lib/dimension-insights";
import { estimateTeamRolesFromTritan } from "../src/lib/team-role-estimate";
import { TEAM_ROLES, TEAM_ROLE_WHY, getTopRoles } from "../src/lib/team-role-scoring";
import { TRITAN_ORDER, TRITAN_DIM_ABBR, type TritanDimCode } from "../src/lib/tritan";
import { t, tf, type Locale } from "../src/lib/i18n";
import type { PdfData } from "../src/components/pdf/TritaPdf";
import { CoverPage } from "../src/components/pdf/pages/CoverPage";
import { SummaryPage } from "../src/components/pdf/pages/SummaryPage";
import { StartPage } from "../src/components/pdf/pages/StartPage";
import { PlusFacetsPage } from "../src/components/pdf/pages/PlusFacetsPage";
import { PlusWorkStylePage } from "../src/components/pdf/pages/PlusWorkStylePage";
import { CollabPage } from "../src/components/pdf/pages/CollabPage";
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

// ─── PdfData összeállítás — az eredmény-oldal (results/page.tsx) és a
//     ProfileTabs export-glue tükre. A tartalom a valós lib-függvényekből
//     jön; itt csak a nem-exportált inline logikát reprodukáljuk. ────────────

const isHuLoc = (l: Locale) => l === "hu";

function getInsight(score: number, insights: { low: string; mid: string; high: string }): string {
  const range = score < 40 ? "low" : score < 70 ? "mid" : "high";
  return insights[range];
}

// Hero-tagline és bullet-térképek — közös forrásból (dimension-insights.ts),
// a results-oldallal és a ProfileTabs-szal szinkronban (javítási terv P1.5).
const strengthVerbs = DIMENSION_STRENGTH_VERBS;
const weakVerbs = DIMENSION_WEAK_VERBS;
const strengthDescs = DIMENSION_STRENGTH_DESCS;
const watchDescs = DIMENSION_WATCH_DESCS;

function tritanIndex(code: string): number {
  const i = (TRITAN_ORDER as readonly string[]).indexOf(code);
  return i === -1 ? TRITAN_ORDER.length : i;
}

function buildPdfData(persona: Persona, locale: Locale, plan: "start" | "plus"): PdfData {
  const config = getTestConfig("TRITAN", locale);
  const facetScores = buildFacets(persona.dimensions);

  const dimensions = config.dimensions.map((dim) => {
    const score = persona.dimensions[dim.code] ?? 0;
    const insights = (dim.insightsByLocale?.[locale] ?? dim.insights) as {
      low: string; mid: string; high: string;
    };
    return {
      code: dim.code,
      label: (dim.labelByLocale?.[locale] ?? dim.label) as string,
      score,
      insight: getInsight(score, insights),
      description: (dim.descriptionByLocale?.[locale] ?? dim.description) as string,
      facets: (dim.facets ?? []).map((f) => ({
        code: f.code,
        label: (f.labelByLocale?.[locale] ?? f.label) as string,
        score: facetScores[dim.code]?.[f.code] ?? 0,
      })),
    };
  });

  const mainDims = dimensions.filter((d) => d.code !== "I").sort((a, b) => tritanIndex(a.code) - tritanIndex(b.code));
  const sortedDims = [...mainDims].sort((a, b) => b.score - a.score);
  const highDims = mainDims.filter((d) => d.score >= 70);
  const lowDims = mainDims.filter((d) => d.score < 40);

  const personalityType =
    resolvePersonalityTypeFromScores(mainDims.map((d) => ({ code: d.code, score: d.score })), locale) ??
    t("results.uniqueProfile", locale);

  const heroInsight = (() => {
    const strongest = sortedDims[0];
    const weakest = sortedDims[sortedDims.length - 1];
    if (!strongest || !weakest) return "";
    const s = strengthVerbs[strongest.code]?.[locale] ?? strongest.label;
    const w = weakVerbs[weakest.code]?.[locale] ?? weakest.label.toLowerCase();
    return `${s} — ${w}.`;
  })();

  // Pólus-tudatos watch-lista (motor-audit v4, FIX 2, a ProfileTabs tükre):
  // a fordított Emocionalitás alacsony sávja stabilitás, nem figyelendő.
  const watchDims = lowDims.filter((d) => d.code !== "RESO");

  const strengthBullets = (highDims.length > 0 ? highDims : sortedDims.slice(0, 2)).map((d) => {
    const desc = strengthDescs[d.code]?.[locale];
    return desc ? `${d.label} — ${desc}` : d.label;
  });
  const watchBullets = watchDims.length > 0
    ? watchDims.map((d) => {
        const desc = watchDescs[d.code]?.[locale];
        return desc ? `${d.label} — ${desc}` : d.label;
      })
    : [t("content.noLowDimension", locale)];

  // Kapuzott profil-karakter (FIX 2): „magas X" csak ≥70-re, alatta a
  // balanced-fallback; fejlődés-mondat csak valóban alacsony, nem-RESO dimre.
  const profileCharacter = (() => {
    const top2High = [...highDims].sort((a, b) => b.score - a.score).slice(0, 2);
    const highPart = top2High[0]
      ? tf("content.profileCharacterHigh", locale, {
          top1: top2High[0].label.toLowerCase(),
          top2Suffix: top2High[1]
            ? tf("content.profileCharacterTop2Suffix", locale, { label: top2High[1].label.toLowerCase() })
            : "",
        })
      : t("results.balancedProfile", locale);
    const growthDim = [...watchDims].sort((a, b) => a.score - b.score)[0];
    const growthPart = growthDim
      ? tf("content.profileCharacterGrowth", locale, { bottom: growthDim.label })
      : "";
    return `${highPart}${growthPart}`;
  })();

  const dimScores = Object.fromEntries(mainDims.map((d) => [d.code, d.score]));
  const workstyle = buildWorkstyleContent(dimScores, "TRITAN", locale);

  const teamRoleRoles = (() => {
    const scores = estimateTeamRolesFromTritan(dimScores as Record<TritanDimCode, number>);
    const top3 = getTopRoles(scores, 3);
    const sourceLabel = locale === "hu" ? "profil-alapú becslés" : "profile-based estimate";
    return top3.map((r, i) => ({
      name: TEAM_ROLES[r.role][locale],
      subtitle: i === 0 ? sourceLabel : "",
      score: r.score,
      rank: i,
      // P5.3: egy mondatos indoklás az elsődleges BECSÜLT szerephez
      why: i === 0 ? TEAM_ROLE_WHY[r.role][locale] : undefined,
    }));
  })();

  const altruism = (() => {
    const alt = dimensions.find((d) => d.code === "I");
    return alt ? { value: alt.score, description: alt.insight } : undefined;
  })();

  return {
    locale,
    userName: persona.label,
    completedAt: new Date().toLocaleDateString(isHuLoc(locale) ? "hu-HU" : "en-GB", {
      year: "numeric", month: "long", day: "numeric",
    }),
    personalityType,
    heroInsight,
    // S3-hedge (FIX 5): mérési hibán belüli top-2 sorrendnél főnév-only
    // történet — a második dimenziót nem állítjuk.
    archetypeStory:
      sortedDims[0] && sortedDims[1]
        ? buildArchetypeStory(
            sortedDims[0].code,
            isTopPairUncertain(mainDims) ? null : sortedDims[1].code,
            locale,
          ) ?? undefined
        : undefined,
    plan,
    strengthBullets,
    watchBullets,
    profileCharacter,
    topDimensions: highDims.map((d) => d.label),
    watchDimensions: watchDims.map((d) => d.label),
    altruism,
    dimensions: mainDims.map((d) => ({
      name: d.label,
      shortName: TRITAN_DIM_ABBR[d.code as TritanDimCode]?.[isHuLoc(locale) ? "hu" : "en"] ??
        (d.label.length > 10 ? d.label.slice(0, 10) + "." : d.label),
      value: d.score,
      description: d.insight,
      code: d.code,
    })),
    teamRoleRoles,
    teamRoleEstimated: true, // persona-riport mindig profil-alapú becslés → sáv-címke, pontszám nélkül
    plusContent: plan === "plus" ? {
      howYouWorkParts: workstyle.howYouWorkParts,
      pressure: workstyle.pressure,
      pressureParts: workstyle.pressureParts,
      growthTip: workstyle.growthTip,
      growthPlan: workstyle.growthPlan,
      collaboration: workstyle.collaboration,
      roleFit: workstyle.roleFit,
      takeaways: workstyle.takeaways,
      closingText: BLOCK8[locale],
    } : undefined,
    facetDimensions: plan === "plus" ? mainDims.map((d) => ({
      name: d.label,
      value: d.score,
      insight: d.insight,
      description: d.description,
      code: d.code,
      facets: d.facets,
    })) : undefined,
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
    const data = buildPdfData(p, locale, plan);
    const bookmark = { title: `${p.label} · ${p.slug}`, expanded: false } as const;
    const totalPages = plan === "plus" ? 5 : 1;
    const pages = [<CoverPage key={`${p.slug}-c`} data={data} bookmark={bookmark} />];
    if (plan === "plus") {
      // Executive summary a riport elejére (P3.1) + Csapatban működve (P4.2)
      // — a TritaPdf dokumentum-sorrendjével szinkronban.
      pages.push(<SummaryPage key={`${p.slug}-x`} data={data} pageNum={1} totalPages={totalPages} locale={locale} />);
      pages.push(<StartPage key={`${p.slug}-s`} data={data} pageNum={2} totalPages={totalPages} locale={locale} />);
      pages.push(<PlusFacetsPage key={`${p.slug}-f`} data={data} pageNum={3} totalPages={totalPages} locale={locale} />);
      pages.push(<PlusWorkStylePage key={`${p.slug}-w`} data={data} pageNum={4} totalPages={totalPages} locale={locale} />);
      pages.push(<CollabPage key={`${p.slug}-t`} data={data} pageNum={5} totalPages={totalPages} locale={locale} />);
    } else {
      pages.push(<StartPage key={`${p.slug}-s`} data={data} pageNum={1} totalPages={totalPages} locale={locale} />);
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
