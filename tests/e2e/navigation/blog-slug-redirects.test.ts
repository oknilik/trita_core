import { expect, test } from "@playwright/test";

// A 2026-08-26-os blog-slug visszanevezés szerződése (next.config.ts):
// a régi URL-ek permanens (308) redirecttel az új slugra futnak. Ez kritikus
// útvonal: a régi linkek kiküldött hírlevelekben és külső hivatkozásokban
// élnek, a levélbe ágyazott borító-<img> pedig a régi slugos
// /api/newsletter/cover útvonalat hordozza örökre.
const RENAMED_SLUGS: ReadonlyArray<[from: string, to: string]> = [
  ["tritan-vs-mbti", "hexaco-vs-mbti"],
  ["tritan-vs-mbti-why-it-matters", "hexaco-vs-mbti-why-it-matters"],
  ["miert-hazudik-az-onertekeles", "miert-nem-eleg-az-onertekeles"],
  ["why-self-assessment-lies", "why-self-assessment-is-not-enough"],
  ["mi-az-a-hexaco", "hatfaktoros-szemelyisegmodell"],
];

test("a régi blog-slugok az új cikkoldalon kötnek ki", async ({ page }) => {
  for (const [from, to] of RENAMED_SLUGS) {
    const response = await page.goto(`/blog/${from}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `/blog/${from} végső válasza`).toBe(200);
    expect(new URL(page.url()).pathname, `/blog/${from} célútvonala`).toBe(`/blog/${to}`);
  }
});

test("a hírlevél-borító régi slugja is permanens redirectet ad", async ({ request }) => {
  for (const [from, to] of RENAMED_SLUGS) {
    // maxRedirects: 0 – csak a redirect-válasz a szerződés, a cél-route
    // borítórenderelését nem ez a teszt fedi.
    const response = await request.get(`/api/newsletter/cover/${from}`, { maxRedirects: 0 });
    expect(response.status(), `/api/newsletter/cover/${from}`).toBe(308);
    expect(
      response.headers()["location"],
      `/api/newsletter/cover/${from} Location fejléce`,
    ).toContain(`/api/newsletter/cover/${to}`);
  }
});
