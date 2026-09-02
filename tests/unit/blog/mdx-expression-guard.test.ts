import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/**
 * A next-mdx-remote v6 alapból KISZŰR minden JS-kifejezést az MDX-ből
 * (`blockJS`, dist/plugins/remove-javascript-expressions.js): a
 * `prop={...}` attribútumok és a `{kifejezés}` blokkok némán eltűnnek, a
 * komponens pedig hibátlanul renderel hiányos adattal. Ez a teszt teszi
 * zajossá a csendes hibát — a CompareTable már ezért kapott szöveges
 * `rows` propot.
 *
 * Ha valóban kifejezésre van szükség, az a `blockJS: false` bekapcsolását
 * jelentené a blogoldalon: szerveroldali JS-végrehajtás blogtartalomból.
 * Ez biztonsági döntés, nem szerkesztési — ne ezt a tesztet lazítsd fel.
 */
test("a blogcikkek nem használnak JS-kifejezést MDX-attribútumban", () => {
  const offenders: string[] = [];

  for (const file of fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"))) {
    const source = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const body = source.replace(/^---\n[\s\S]*?\n---\n/, "");

    for (const [i, line] of body.split("\n").entries()) {
      // Kódblokk-jelölés és inline kód nem érdekes, azt az MDX nem értékeli ki.
      if (line.trimStart().startsWith("```") || line.trimStart().startsWith("|")) continue;
      const withoutInlineCode = line.replace(/`[^`]*`/g, "");
      if (/\w+=\{/.test(withoutInlineCode)) {
        offenders.push(`${file}:${i + 1} — kifejezés-attribútum: ${line.trim().slice(0, 70)}`);
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `A next-mdx-remote kiszűri ezeket, tehát némán elvesznének:\n${offenders.join("\n")}`,
  );
});

test("a CompareTable-t használó cikkek szöveges rows-t adnak, sor-elválasztóval", () => {
  for (const file of fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"))) {
    const source = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    if (!source.includes("<CompareTable")) continue;

    const rows = source.match(/rows="([\s\S]*?)"\s*\/>/);
    assert.ok(rows, `${file}: a CompareTable-nek szöveges rows attribútum kell`);

    const lines = rows[1].split("\n").map((l) => l.trim()).filter(Boolean);
    assert.ok(lines.length > 0, `${file}: a rows üres`);
    for (const line of lines) {
      assert.equal(
        line.split("|").length,
        2,
        `${file}: minden sor pontosan két cellát adjon „|" elválasztóval — „${line}"`,
      );
    }
  }
});
