import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function readBlog(file: string): string {
  return fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
}

test("a blogok nem mutatják közös nézetként az egyéni csapatpontszámokat", () => {
  const files = fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith(".mdx"));
  const forbidden = [
    /<TeamHeatmapFigure\b/,
    /a sorok a csapattagok/i,
    /rows are team members/i,
    /névvel megjelenített eredmények/i,
    /showing their results by name/i,
  ];

  for (const file of files) {
    const source = readBlog(file);
    for (const pattern of forbidden) {
      assert.equal(pattern.test(source), false, `${file}: tiltott egyéni csapatnézet maradt (${pattern})`);
    }
  }
});

test("a csapatriport alapcikkek rögzítik a saját és aggregált nézet határát", () => {
  const contracts = [
    {
      file: "csapatdinamika-olvasasa.mdx",
      required: ["csak a saját személyiségprofilját látja", "más csapattag egyéni pontszáma nem látható"],
    },
    {
      file: "reading-your-teams-personality-profile.mdx",
      required: ["sees only their own personality profile", "does not show any other team member's individual score"],
    },
    {
      file: "egy-csapat-egy-hoterkep.mdx",
      required: ["mindenki csak a saját profilját látta", "aggregált csapatképet"],
    },
    {
      file: "one-team-one-heatmap.mdx",
      required: ["each person saw only their own profile", "aggregate team picture"],
    },
  ];

  for (const contract of contracts) {
    const source = readBlog(contract.file).toLowerCase();
    for (const phrase of contract.required) {
      assert.ok(source.includes(phrase.toLowerCase()), `${contract.file}: hiányzó adatvédelmi állítás: ${phrase}`);
    }
  }
});
