/**
 * diagnose-facet-comparison.ts
 *
 * CSAK-OLVASÓ diagnosztika: megmondja, MIÉRT nem látszik egy adott
 * felhasználónál az „Alskálák összehasonlítása” szekció a
 * /profile/results?tab=comparison felületen.
 *
 * A szekciót (ComparisonTab → FacetComparisonSection) négy kapu zárja.
 * Ez a script UGYANAZOKAT a kanonikus függvényeket futtatja, mint a
 * szerver-oldali page.tsx, tehát a kimenete a valódi viselkedést tükrözi —
 * nem újraimplementált közelítés.
 *
 * Futtatás:
 *   npx tsx scripts/diagnose-facet-comparison.ts --email valaki@pelda.hu
 *
 * Nem ír semmit az adatbázisba, és nem ír ki személyes választ — csak
 * darabszámokat, pontszámokat és kapu-állapotokat.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient, InvitationStatus } from "@prisma/client";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, raw] = match;
        if (!process.env[key]) {
          process.env[key] = raw.replace(/^['"]|['"]$/g, "").trim();
        }
      }
      console.log(`📄 Env betöltve: ${file}`);
      return;
    } catch {
      // nincs ilyen fájl — a következőt próbáljuk
    }
  }
}

function getArg(name: string): string | null {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

const ok = (s: string) => `\x1b[32m✓\x1b[0m ${s}`;
const bad = (s: string) => `\x1b[31m✗\x1b[0m ${s}`;
const warn = (s: string) => `\x1b[33m!\x1b[0m ${s}`;

async function main() {
  loadEnv();

  // A lib-importok CSAK az env betöltése UTÁN futhatnak: a prisma-kliens
  // modul-szinten olvassa a DATABASE_URL-t.
  const { extractFacetScores, extractDimensionScores } = await import("@/lib/scoring");
  const {
    computeObserverFacetAverages,
    computeObserverAverage,
    DOSSIER_OBSERVER_MIN,
  } = await import("@/lib/member-dossier");
  const { facetStandardError } = await import("@/lib/psychometrics");
  const { OBSERVER_MIN_FOR_REVEAL } = await import("@/lib/observer-flow");
  const { SELF_PAYWALL_ENABLED } = await import("@/lib/operating-mode");
  const { HEXACO_ORDER, HEXACO_DIMENSION_FACETS } = await import("@/lib/hexaco");
  const { getTestConfig } = await import("@/lib/questions");
  type TestType = Parameters<typeof getTestConfig>[0];

  const email = getArg("email");
  if (!email) {
    console.error("❌ Adj meg egy emailt: --email valaki@pelda.hu");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  const profile = await prisma.userProfile.findFirst({
    where: { email },
    select: { id: true, email: true },
  });
  if (!profile) {
    console.error(`❌ Nincs ilyen felhasználó: ${email}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`\n🔍 Facet-összevetés diagnosztika — ${profile.email}\n`);

  // ── 0. kapu: Plus hozzáférés ───────────────────────────────────────────
  console.log("── 0. kapu — Plus hozzáférés (ComparisonTab egyáltalán renderel?)");
  if (!SELF_PAYWALL_ENABLED) {
    console.log(ok("SELF_PAYWALL_ENABLED = false → mindenki „full” szintet kap, a kapu nyitva."));
  } else {
    const [orgM, teamM] = await Promise.all([
      prisma.organizationMember.findFirst({ where: { userId: profile.id, leftAt: null }, select: { id: true } }),
      prisma.teamMember.findFirst({ where: { userId: profile.id }, select: { id: true } }),
    ]);
    console.log(orgM || teamM ? ok("van org/team tagság → „full”") : bad("nincs org/team tagság → „basic”: a ComparisonTab NEM renderel."));
  }

  // ── Önértékelés ────────────────────────────────────────────────────────
  const latest = await prisma.assessmentResult.findFirst({
    where: { userProfileId: profile.id, isSelfAssessment: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, scores: true, testType: true, createdAt: true },
  });

  console.log("\n── 1. kapu — Önértékelés facet-bontása");
  if (!latest) {
    console.log(bad("nincs befejezett önértékelés → a teljes eredményoldal zárva."));
    await prisma.$disconnect();
    return;
  }
  const selfFacets = extractFacetScores(latest.scores);
  const selfDims = extractDimensionScores(latest.scores) ?? {};
  const scores = latest.scores as { form?: "short" | "full" };
  const form = scores.form ?? "short";
  console.log(`   kitöltés: ${latest.createdAt.toISOString().slice(0, 10)} · testType: ${latest.testType} · forma: ${form}${scores.form ? "" : " (pecsét nélküli örökség-sor → rövidnek vesszük)"}`);
  if (!selfFacets) {
    console.log(bad("a tárolt score-JSON-ban NINCS facet-bontás (örökség-sor) → a facet-szekció sosem jelenhet meg."));
  } else {
    const n = Object.values(selfFacets).reduce((s, d) => s + Object.keys(d).length, 0);
    console.log(ok(`facet-bontás megvan: ${Object.keys(selfFacets).length} dimenzió, ${n} alskála.`));
  }

  // ── 2. kapu: értékelők száma ───────────────────────────────────────────
  const observers = await prisma.observerAssessment.findMany({
    where: { invitation: { inviterId: profile.id, status: InvitationStatus.COMPLETED } },
    select: { scores: true },
  });
  const allInvites = await prisma.observerInvitation.groupBy({
    by: ["status"],
    where: { inviterId: profile.id },
    _count: { _all: true },
  });

  console.log("\n── 2. kapu — Értékelők száma (anonimitás-padló)");
  console.log(`   meghívók státusz szerint: ${allInvites.map((g) => `${g.status}=${g._count._all}`).join(" · ") || "nincs meghívó"}`);
  const hasObserverData = observers.length >= OBSERVER_MIN_FOR_REVEAL;
  console.log(
    hasObserverData
      ? ok(`${observers.length} befejezett értékelés ≥ ${OBSERVER_MIN_FOR_REVEAL} → a külső kép feloldva.`)
      : bad(`${observers.length} befejezett értékelés < ${OBSERVER_MIN_FOR_REVEAL} → az EGÉSZ összehasonlító tab a „nincs adat” üres állapotot mutatja. Ez a blokkoló.`),
  );

  const likert = observers
    .map((o) => o.scores as { type?: string })
    .filter((o) => o.type === "likert");
  if (likert.length !== observers.length) {
    console.log(warn(`${observers.length - likert.length} értékelés nem „likert” típusú → kimarad az átlagolásból.`));
  }

  // ── 3. kapu: facetenkénti lefedettség ──────────────────────────────────
  console.log("\n── 3. kapu — Facetenkénti lefedettség (listwise ≥ " + DOSSIER_OBSERVER_MIN + " értékelő)");
  // A HEXACO_ORDER eleve csak a hat fő dimenziót tartalmazza (a kiegészítő
  // „I” skála nincs benne) — külön szűrés nem kell.
  const mainCodes = HEXACO_ORDER;
  const observerFacetSets = likert.map((o) => extractFacetScores(o) ?? undefined);
  const withFacets = observerFacetSets.filter(Boolean).length;
  console.log(`   ${withFacets}/${likert.length} értékelés hordoz facet-bontást.`);

  const obsFacetAvg = computeObserverFacetAverages(mainCodes, observerFacetSets);
  const obsDimAvg = computeObserverAverage(mainCodes, likert.map((o) => extractDimensionScores(o) ?? {}));
  console.log(`   dimenzió-átlag: ${obsDimAvg ? `${Object.keys(obsDimAvg).length}/6 dimenzió lefedve` : "null (küszöb alatt)"}`);

  if (!obsFacetAvg) {
    console.log(bad("a facet-átlag null → a szekció nem renderel."));
  } else {
    const covered = Object.values(obsFacetAvg).reduce((s, d) => s + Object.keys(d).length, 0);
    const total = mainCodes.reduce((s, c) => s + (HEXACO_DIMENSION_FACETS[c] ?? []).length, 0);
    console.log(ok(`${covered}/${total} alskála van meg mindkét oldalról.`));
  }

  // ── 4. kapu: eltérés-küszöb ────────────────────────────────────────────
  const facetSem = Math.round(Math.SQRT2 * facetStandardError(form));
  console.log(`\n── 4. kapu — Eltérés-küszöb (√2 × facet-SEM = ${facetSem} pont a(z) „${form}” formán)`);

  if (selfFacets && obsFacetAvg) {
    const config = getTestConfig(latest.testType as TestType, "hu");
    let totalRows = 0;
    let gapCount = 0;
    const lines: string[] = [];
    for (const dim of config.dimensions) {
      const s = selfFacets[dim.code];
      const o = obsFacetAvg[dim.code];
      if (!s || !o) continue;
      for (const f of dim.facets ?? []) {
        const sv = s[f.code];
        const ov = o[f.code];
        if (typeof sv !== "number" || typeof ov !== "number") continue;
        const delta = Math.round(ov) - Math.round(sv);
        totalRows += 1;
        const isGap = Math.abs(delta) >= facetSem;
        if (isGap) gapCount += 1;
        lines.push(
          `     ${isGap ? "▲" : "≈"} ${dim.label} / ${f.label}: te ${Math.round(sv)} · mások ${Math.round(ov)} · Δ ${delta > 0 ? "+" : ""}${delta}`,
        );
      }
    }
    console.log(`   ${gapCount}/${totalRows} alskála lépi túl a küszöböt.`);
    if (totalRows === 0) {
      console.log(bad("nincs mindkét oldalról lefedett alskála → a szekció nem renderel."));
    } else if (gapCount === 0) {
      console.log(
        warn(
          "MINDEN eltérés a mérési hibán belül van → a szekció megjelenik, de csak a\n" +
            "     „minden egyezik” kártyát mutatja, SZÁMOK NÉLKÜL. A teljes lista az\n" +
            "     „Összes megjelenítése” gomb mögött van. Nagy eséllyel EZ, amit tapasztalsz.",
        ),
      );
    } else {
      console.log(ok(`${gapCount} alskála-eltérés jelenik meg alapból.`));
    }
    console.log("\n   Teljes lista (▲ = küszöb felett, ≈ = mérési hibán belül):");
    for (const l of lines) console.log(l);
  } else {
    console.log("   — kihagyva (a 1./3. kapu már blokkol).");
  }

  // ── Dimenzió-szintű kontroll ───────────────────────────────────────────
  if (obsDimAvg && Object.keys(selfDims).length > 0) {
    console.log("\n── Kontroll: dimenzió-szintű összevetés (ami MA látszik a tabon)");
    for (const c of mainCodes) {
      const sv = selfDims[c];
      const ov = obsDimAvg[c];
      if (typeof sv !== "number" || typeof ov !== "number") continue;
      console.log(`     ${c}: te ${Math.round(sv)} · mások ${ov} · Δ ${ov - Math.round(sv) > 0 ? "+" : ""}${ov - Math.round(sv)}`);
    }
  }

  console.log("");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
