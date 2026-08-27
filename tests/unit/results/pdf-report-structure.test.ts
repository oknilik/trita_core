import test from "node:test";
import assert from "node:assert/strict";
import type { ReactElement } from "react";

import { buildPdfScenarios } from "../../../scripts/pdf-report-scenarios";
import {
  buildProfileReportViewModel,
  buildProfileSummaryInsights,
  careerAppendixEnabled,
} from "@/lib/profile-report-view-model";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";
import { TritaReportDocument, chapterStartPages } from "@/components/pdf/TritaPdf";
import { chunkDimensions, DIMENSIONS_PER_PAGE } from "@/components/pdf/pages/ChapterDimensionsPage";

// ─────────────────────────────────────────────────────────────────────────────
// A riport-PDF szerkezeti szerződése (PDF-audit 2026-08-18, P2/16–17).
//
// A tartalmi source of truth a webes eredményoldal fejezetszerkezete, ezért
// EZEK az invariánsok nem sérülhetnek:
//
//   · a fejezetek sorrendje: Borító → Gyors összkép → 01 → 02 → 03 → mellékletek
//   · a Gyors összkép HÁROM insightja szó szerint a webes builder kimenete
//   · hiányzó adatból nem készül 0%-os eredmény (kiegészítő skála)
//   · a mellékletek a riport VÉGÉN futnak, nem főfejezetként
//   · a tartalomjegyzék oldalszámai a tényleges oldalszerkezetből jönnek
//
// A render-szintű (tördelés, tipográfia) ellenőrzést a snapshot-készlet adja:
// `pnpm report:pdf-snapshots`.
// ─────────────────────────────────────────────────────────────────────────────

/** A Document gyerekeinek komponensnevei — a lapok sorrendje. */
function pageComponentNames(element: ReactElement): string[] {
  const children = (element.props as { children?: unknown }).children;
  const flat = (Array.isArray(children) ? children : [children]).flat(Infinity);
  return flat
    .filter((child): child is ReactElement => Boolean(child) && typeof child === "object")
    .map((child) => {
      const type = child.type as { name?: string } | string;
      return typeof type === "string" ? type : (type.name ?? "unknown");
    });
}

const scenarios = buildPdfScenarios();

test("minden forgatókönyv a kanonikus fejezetsorrendben épül", () => {
  for (const scenario of scenarios) {
    const model = buildProfileReportViewModel(scenario.input);
    const names = pageComponentNames(TritaReportDocument({ data: scenario.input }));

    assert.equal(names[0], "CoverPage", `${scenario.id}: nem a borító az első lap`);
    assert.equal(names[1], "QuickOverviewPage", `${scenario.id}: a Gyors összkép nem a 2. lap`);
    assert.equal(names[2], "ChapterOverviewPage", `${scenario.id}: a 01 fejezet nincs a helyén`);

    const dimensionPages = chunkDimensions(model.dimensionsChapter.dimensions).length;
    for (let i = 0; i < dimensionPages; i++) {
      assert.equal(
        names[3 + i],
        "ChapterDimensionsPage",
        `${scenario.id}: a 02 fejezet ${i + 1}. lapja hiányzik`,
      );
    }
    assert.equal(
      names[3 + dimensionPages],
      "ChapterWorkStylePage",
      `${scenario.id}: a 03 fejezet nincs a 02 után`,
    );

    // A mellékletek KIZÁRÓLAG a 03 fejezet UTÁN futhatnak – a „Csapatban
    // működve" / „Vakfoltok" blokk nem ékelődhet vissza főfejezetként.
    const appendixNames = names.slice(4 + dimensionPages);
    const allowed = ["AppendixObserverPage", "AppendixCareerPage", "AppendixRelationalPage"];
    for (const name of appendixNames) {
      assert.ok(allowed.includes(name), `${scenario.id}: ismeretlen melléklet-lap (${name})`);
    }
    assert.equal(
      appendixNames.length,
      model.appendices.length,
      `${scenario.id}: a melléklet-lapok száma nem egyezik a view-modellel`,
    );
  }
});

test("a fejezetcímek a webes kulcsokból jönnek, 01–03 sorszámmal", () => {
  for (const scenario of scenarios) {
    const model = buildProfileReportViewModel(scenario.input);
    assert.deepEqual(
      model.chapters.map((c) => `${c.number}:${c.id}`),
      ["01:overview", "02:dimensions", "03:workstyle"],
      `${scenario.id}: eltérő fejezetszerkezet`,
    );
    for (const chapter of model.chapters) {
      assert.ok(chapter.title.length > 0, `${scenario.id}: üres fejezetcím (${chapter.id})`);
      assert.ok(chapter.question.length > 0, `${scenario.id}: üres fejezet-kérdés (${chapter.id})`);
      assert.ok(
        chapter.description.length > 0,
        `${scenario.id}: üres fejezet-leírás (${chapter.id})`,
      );
    }
  }
});

test("a Gyors összkép három insightja szövegszinten a webes builder kimenete", () => {
  for (const scenario of scenarios) {
    const model = buildProfileReportViewModel(scenario.input);
    const webInsights = buildProfileSummaryInsights(
      scenario.input.dimensions,
      scenario.input.plan === "plus" ? scenario.input.plusContent : undefined,
      scenario.input.locale,
    );

    assert.equal(model.quickOverview.insights.length, 3, `${scenario.id}: nem három insight`);
    assert.deepEqual(
      model.quickOverview.insights,
      webInsights,
      `${scenario.id}: a PDF összkép eltér a webes összképtől`,
    );
    assert.deepEqual(
      model.quickOverview.insights.map((i) => i.tone),
      ["strength", "attention", "work"],
      `${scenario.id}: felborult az insight-sorrend`,
    );
    for (const insight of model.quickOverview.insights) {
      assert.ok(insight.label.length > 0, `${scenario.id}: üres insight-címke`);
      assert.ok(insight.text.length > 0, `${scenario.id}: üres insight-szöveg`);
    }
  }
});

test("a kiegészítő skála csak valódi, mért értékkel jelenik meg", () => {
  const without = scenarios.find((s) => s.id === "plus-hu-no-supplementary-scale");
  const with_ = scenarios.find((s) => s.id === "plus-hu-with-supplementary-scale");
  assert.ok(without && with_, "hiányzik a kiegészítő skála két forgatókönyve");

  assert.equal(
    buildProfileReportViewModel(without.input).dimensionsChapter.altruism,
    null,
    "hiányzó „I” értékből kiegészítő skála készült – ez lenne a 0%-os sor",
  );
  assert.deepEqual(
    buildProfileReportViewModel(with_.input).dimensionsChapter.altruism?.value,
    73,
    "a mért kiegészítő skála értéke nem jut át a modellbe",
  );

  // Egyik forgatókönyv sem gyárthat 0-t hiányzó adatból: minden modellbe
  // került dimenzió-érték a bemenetből származik.
  for (const scenario of scenarios) {
    const model = buildProfileReportViewModel(scenario.input);
    const inputScores = new Map(scenario.input.dimensions.map((d) => [d.code, d.score]));
    for (const dim of model.overview.dimensions) {
      assert.equal(
        dim.value,
        inputScores.get(dim.code),
        `${scenario.id}: ${dim.code} értéke nem a bemenetből jön`,
      );
    }
    if (model.dimensionsChapter.altruism) {
      assert.equal(
        model.dimensionsChapter.altruism.value,
        inputScores.get("I"),
        `${scenario.id}: a kiegészítő skála értéke nem a bemenetből jön`,
      );
    }
  }
});

test("a 02 fejezet oldalanként legfeljebb három részletes dimenziót hoz", () => {
  for (const scenario of scenarios) {
    const model = buildProfileReportViewModel(scenario.input);
    const chunks = chunkDimensions(model.dimensionsChapter.dimensions);
    for (const chunk of chunks) {
      assert.ok(
        chunk.length <= DIMENSIONS_PER_PAGE,
        `${scenario.id}: ${chunk.length} dimenzió került egy lapra`,
      );
    }
    assert.equal(
      chunks.flat().length,
      model.dimensionsChapter.dimensions.length,
      `${scenario.id}: a lapokra bontás dimenziót veszített`,
    );
  }
});

test("a tartalomjegyzék oldalszámai a tényleges lapszerkezetet követik", () => {
  for (const scenario of scenarios) {
    const model = buildProfileReportViewModel(scenario.input);
    const names = pageComponentNames(TritaReportDocument({ data: scenario.input }));
    const starts = chapterStartPages(model);

    // A borító számozáson kívül van: a tartalmi oldalszám = a lap 0-alapú
    // dokumentum-indexe (a borító az index 0).
    assert.equal(names[starts.overview], "ChapterOverviewPage", `${scenario.id}: 01 rossz oldalon`);
    assert.equal(
      names[starts.dimensions],
      "ChapterDimensionsPage",
      `${scenario.id}: 02 rossz oldalon`,
    );
    assert.equal(
      names[starts.workstyle],
      "ChapterWorkStylePage",
      `${scenario.id}: 03 rossz oldalon`,
    );
  }
});

test("a Start riport nem szivárogtat Plus-tartalmat", () => {
  for (const scenario of scenarios.filter((s) => s.input.plan === "start")) {
    const model = buildProfileReportViewModel(scenario.input);
    assert.equal(model.workstyle.howYouWorkParts, undefined, `${scenario.id}: Ahogy működsz`);
    assert.equal(model.workstyle.envItems.length, 0, `${scenario.id}: ideális környezet`);
    assert.equal(model.workstyle.roleFit, undefined, `${scenario.id}: szerepkör-illeszkedés`);
    assert.equal(model.dimensionsChapter.takeaways.length, 0, `${scenario.id}: kulcstanulságok`);
    assert.equal(model.appendices.length, 0, `${scenario.id}: melléklet Start-riportban`);
  }
});

test("az „Ideális környezet” Plus-riportban ténylegesen átjut a modellbe", () => {
  const scenario = scenarios.find((s) => s.id === "plus-hu-mixed-full");
  assert.ok(scenario);
  const model = buildProfileReportViewModel(scenario.input);
  assert.ok(
    model.workstyle.envItems.length > 0,
    "a webes IdealEnvironmentSection adata megint elveszett a riport-modellben",
  );
});

test("a Karrier-iránytű melléklet a felület parkolását követi", () => {
  // A karrier-felület jelenleg parkolva van (portfolio-parking), ezért a riport
  // akkor sem generálja le a mellékletet, ha a hívó átad karrier-adatot. Ez a
  // teszt ÖNMAGÁT állítja át: ha a felület `active`-ra vált, a melléklet
  // visszatérését várja el – nem kell hozzá a tesztet átírni.
  const expected = isPortfolioSurfaceActive("career");
  assert.equal(careerAppendixEnabled(), expected, "a riport-kapu eltér a parkolási állapottól");

  const withCareerData = scenarios.filter((s) => Boolean(s.input.career?.roles.length));
  assert.ok(withCareerData.length > 0, "nincs karrier-adatot vivő forgatókönyv a készletben");

  for (const scenario of withCareerData) {
    const model = buildProfileReportViewModel(scenario.input);
    assert.equal(
      model.appendices.some((a) => a.id === "career"),
      expected,
      `${scenario.id}: a karrier-melléklet nem követi a parkolási állapotot`,
    );
    assert.equal(
      Boolean(model.career),
      expected,
      `${scenario.id}: a karrier-adat nem követi a parkolási állapotot`,
    );

    const names = pageComponentNames(TritaReportDocument({ data: scenario.input }));
    assert.equal(
      names.includes("AppendixCareerPage"),
      expected,
      `${scenario.id}: a karrier-lap jelenléte nem követi a parkolási állapotot`,
    );
  }
});
