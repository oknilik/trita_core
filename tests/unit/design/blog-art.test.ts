import test from "node:test";
import assert from "node:assert/strict";
import {
  BLOG_ART_FAMILIES,
  blogArtCandidates,
  inferBlogArtConcept,
  resolveBlogArt,
} from "@/lib/blog-art";

test("a cikk témája szerkesztői fogalommá fordul", () => {
  assert.equal(
    inferBlogArtConcept({
      slug: "csapatdinamika-olvasasa",
      tags: ["csapatdinamika", "bizalom"],
    }),
    "connection",
  );
  assert.equal(
    inferBlogArtConcept({
      slug: "tritan-vs-mbti",
      tags: ["pszichometria", "mérés"],
    }),
    "signal",
  );
  assert.equal(
    inferBlogArtConcept({
      slug: "fluktuacio-megelozese",
      tags: ["fluktuáció", "HR"],
    }),
    "tension",
  );
  assert.equal(
    inferBlogArtConcept({
      slug: "belso-mobilitas-a-megtartas-csendes-fegyvere",
      tags: ["belső mobilitás", "megtartás"],
    }),
    "growth",
  );
});

test("azonos forrás azonos családot, fogalmat és seedet ad", () => {
  const source = {
    slug: "egy-cikk",
    title: "A csapat kapcsolatai",
    tags: ["csapatdinamika"],
  };
  const resolved = resolveBlogArt(source);
  assert.deepEqual(resolved, resolveBlogArt(source));
  assert.equal(resolved.lineMode, "minimal");
});

test("az explicit új mezők felülírják az automatikát", () => {
  const selected = resolveBlogArt({
    slug: "egy-cikk",
    family: "flow",
    concept: "threshold",
    seed: 420,
    lineMode: "none",
  });
  assert.equal(selected.family, "flow");
  assert.equal(selected.concept, "threshold");
  assert.equal(selected.seed, 420);
  assert.equal(selected.lineMode, "none");
  assert.equal(selected.legacyMotif, undefined);
});

test("a régi artMotif explicit választása legacy rajzolón marad", () => {
  const selected = resolveBlogArt({ slug: "regi-cikk", motif: "network", seed: 73 });
  assert.equal(selected.legacyMotif, "network");
  assert.equal(selected.family, "constellation");
  assert.equal(selected.concept, "connection");
  assert.equal(selected.seed, 73);
  assert.equal(selected.lineMode, "expressive");
});

test("az admin nyolc egyedi előnézetet kap, családonként kettőt", () => {
  const candidates = blogArtCandidates("egy-cikk", 0);
  assert.equal(candidates.length, 8);
  assert.equal(new Set(candidates.map((candidate) => candidate.seed)).size, 8);
  for (const family of BLOG_ART_FAMILIES) {
    assert.equal(candidates.filter((candidate) => candidate.family === family).length, 2);
  }
  assert.deepEqual(candidates, blogArtCandidates("egy-cikk", 0));
  assert.notDeepEqual(candidates, blogArtCandidates("egy-cikk", 1));
});
