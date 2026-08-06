import test from "node:test";
import assert from "node:assert/strict";
import {
  BCP47_LOCALES,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildDefinedTermSetJsonLd,
  buildFaqJsonLd,
  buildItemListJsonLd,
  buildOrganizationJsonLd,
  buildServiceJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
  organizationId,
  webSiteId,
} from "@/lib/structured-data";
import { getSiteUrl } from "@/lib/seo";

// A strukturált adat két dolgot garantál, és mindkettő könnyen elromlik
// észrevétlenül: (1) EGY márka-entitás létezik a gráfban, amire minden lap
// hivatkozik, (2) nincs benne kitalált állítás. Ez a teszt mindkettőt őrzi.

test("a kanonikus fallback a valódi éles domain", () => {
  // Env nélkül ez a host képzi az összes canonicalt, hreflanget, OG-URL-t,
  // sitemap-bejegyzést és JSON-LD @id horgonyt — rossz domain esetén a saját
  // tartalmunkat egy idegen hostra attribuálná a kereső.
  const previousApp = process.env.NEXT_PUBLIC_APP_URL;
  const previousVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  try {
    assert.equal(getSiteUrl(), "https://trita.io");
  } finally {
    if (previousApp !== undefined) process.env.NEXT_PUBLIC_APP_URL = previousApp;
    if (previousVercel !== undefined) process.env.VERCEL_PROJECT_PRODUCTION_URL = previousVercel;
  }
});

test("az Organization és a WebSite stabil @id horgonyt kap", () => {
  const org = buildOrganizationJsonLd("hu");
  const site = buildWebSiteJsonLd("hu");

  assert.equal(org["@id"], `${getSiteUrl()}/#organization`);
  assert.equal(site["@id"], `${getSiteUrl()}/#website`);
  // A site a márkára hivatkozik, nem újra kihirdeti
  assert.deepEqual(site.publisher, { "@id": organizationId() });
});

test("az Organization a magyar piacot és a két nyelvet explicit jelöli", () => {
  const org = buildOrganizationJsonLd("hu");
  const areaServed = org.areaServed as { name: string }[];
  const knowsAbout = org.knowsAbout as string[];

  assert.ok(areaServed.some((a) => a.name === "Hungary"));
  // Magyar nyelvű témacímkék nélkül a magyar lekérdezésekre nincs fogódzó
  assert.ok(knowsAbout.includes("csapatdiagnosztika"));
  assert.ok(knowsAbout.includes("személyiségteszt"));
});

test("egyetlen entitás sem hirdet kitalált értékelést vagy díjat", () => {
  const graph = [
    buildOrganizationJsonLd("hu"),
    buildWebSiteJsonLd("hu"),
    buildServiceJsonLd({
      name: "Program",
      description: "Leírás",
      serviceType: "Szervezetfejlesztés",
      catalogName: "Katalógus",
      offerings: [{ name: "Elem", description: "Leírás" }],
    }),
  ];

  const serialized = JSON.stringify(graph);
  for (const forbidden of ["aggregateRating", "reviewCount", "ratingValue", "award"]) {
    assert.ok(
      !serialized.includes(forbidden),
      `tiltott, nem ellenőrizhető mező a strukturált adatban: ${forbidden}`,
    );
  }
});

test("a breadcrumb abszolút URL-eket és 1-től induló pozíciókat ad", () => {
  const crumbs = buildBreadcrumbJsonLd([
    { name: "Főoldal", path: "/" },
    { name: "Blog", path: "/blog" },
  ]);
  const items = crumbs.itemListElement as { position: number; item: string }[];

  assert.deepEqual(
    items.map((i) => i.position),
    [1, 2],
  );
  assert.ok(items.every((i) => i.item.startsWith("http")));
  assert.equal(items[1].item, `${getSiteUrl()}/blog`);
});

test("a WebPage a site-entitáshoz kötődik, és nyelvet jelöl", () => {
  const page = buildWebPageJsonLd({
    path: "/pricing",
    title: "Cím",
    description: "Leírás",
    about: "Csapatdiagnosztika",
  });

  assert.deepEqual(page.isPartOf, { "@id": webSiteId() });
  assert.equal(page.inLanguage, BCP47_LOCALES.hu);
  assert.deepEqual(page.about, [{ "@type": "Thing", name: "Csapatdiagnosztika" }]);
});

test("a FAQ minden tételből Question + acceptedAnswer párt képez", () => {
  const faq = buildFaqJsonLd([{ question: "Mennyibe kerül?", answer: "Az egyéni rész ingyenes." }]);
  const entities = faq.mainEntity as { "@type": string; acceptedAnswer: { text: string } }[];

  assert.equal(faq["@type"], "FAQPage");
  assert.equal(entities[0]["@type"], "Question");
  assert.equal(entities[0].acceptedAnswer.text, "Az egyéni rész ingyenes.");
});

test("az Article a márka-entitásra hivatkozik, nem másolatot hirdet", () => {
  const article = buildArticleJsonLd({
    path: "/blog/teszt-cikk",
    headline: "Teszt cikk",
    description: "Leírás",
    datePublished: "2026-03-15",
    locale: "hu",
    keywords: ["önismeret", "pszichometria"],
    readingMinutes: 7,
    wordCount: 1200,
    section: "önismeret",
  });

  assert.deepEqual(article.author, { "@id": organizationId() });
  assert.deepEqual(article.publisher, { "@id": organizationId() });
  assert.equal(article.inLanguage, "hu-HU");
  assert.equal(article.timeRequired, "PT7M");
  assert.equal(article.keywords, "önismeret, pszichometria");
  assert.equal(article.isAccessibleForFree, true);
  assert.equal(article.url, `${getSiteUrl()}/blog/teszt-cikk`);
});

test("a DefinedTermSet minden fogalmat a saját készletéhez köt", () => {
  const set = buildDefinedTermSetJsonLd({
    name: "RIASEC",
    description: "Leírás",
    path: "/holland-kod",
    terms: [{ name: "Megvalósító", description: "Leírás", termCode: "R" }],
  });
  const terms = set.hasDefinedTerm as { inDefinedTermSet: { "@id": string } }[];

  assert.equal(terms[0].inDefinedTermSet["@id"], set["@id"]);
});

test("az ItemList a tételszámot is közli", () => {
  const list = buildItemListJsonLd({
    name: "Lista",
    description: "Leírás",
    items: [
      { name: "A", description: "a" },
      { name: "B", description: "b" },
    ],
  });

  assert.equal(list.numberOfItems, 2);
  assert.equal((list.itemListElement as unknown[]).length, 2);
});
