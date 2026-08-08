import test from "node:test";
import assert from "node:assert/strict";
import { isPresentationOnlyChange, stripClassNames } from "../../../scripts/lib/presentation-diff.mjs";

// A quality gate prezentációs kivétele. A tét: ez a függvény dönti el, hogy
// egy VÉDETT modulban (journey, assessment, join, observer, billing, policy)
// történt módosítás megúszhatja-e az integrációs teszt követelményét.
//
// Ha túl megengedő, viselkedés-változás csúszik át a hálón. Ezért a tesztek
// súlypontja a NEMLEGES eseteken van: mindenre, ami nem tisztán className,
// „nem" a jó válasz — a bizonytalan esetekre is.

const wrap = (body: string) => `export function C() {\n  return (\n${body}\n  );\n}\n`;

test("csak a className értéke változott → prezentációs", () => {
  const before = wrap('    <div className="bg-white text-ink">x</div>');
  const after = wrap('    <div className="bg-surface-card text-ink">x</div>');
  assert.equal(isPresentationOnlyChange("a/b.tsx", before, after), true);
});

test("template-literálos className is kezelve, a benne lévő ${} kifejezéssel", () => {
  const before = wrap("    <div className={`bg-white ${active ? 'a' : 'b'}`}>x</div>");
  const after = wrap("    <div className={`bg-surface-card ${active ? 'a' : 'b'}`}>x</div>");
  assert.equal(isPresentationOnlyChange("a/b.tsx", before, after), true);
});

test("tömbös className (.join) is kezelve, több soron át", () => {
  const before = wrap('    <div\n      className={[\n        "bg-white",\n        cond && "x",\n      ].join(" ")}\n    >x</div>');
  const after = wrap('    <div\n      className={[\n        "bg-surface-card",\n        cond && "x",\n      ].join(" ")}\n    >x</div>');
  assert.equal(isPresentationOnlyChange("a/b.tsx", before, after), true);
});

test("LOGIKA-változás → NEM prezentációs", () => {
  const before = wrap('    <div className="a" onClick={() => save()}>x</div>');
  const after = wrap('    <div className="a" onClick={() => remove()}>x</div>');
  assert.equal(isPresentationOnlyChange("a/b.tsx", before, after), false);
});

test("a className MELLETT logika is változott → NEM prezentációs", () => {
  const before = wrap('    <div className="bg-white" onClick={() => save()}>x</div>');
  const after = wrap('    <div className="bg-surface-card" onClick={() => remove()}>x</div>');
  assert.equal(isPresentationOnlyChange("a/b.tsx", before, after), false);
});

test("inline style változása → NEM prezentációs (a className kivétel szűk)", () => {
  const before = wrap('    <div className="a" style={{ color: "red" }}>x</div>');
  const after = wrap('    <div className="a" style={{ color: "blue" }}>x</div>');
  assert.equal(isPresentationOnlyChange("a/b.tsx", before, after), false);
});

test("látható szöveg változása → NEM prezentációs", () => {
  const before = wrap('    <div className="a">Mentés</div>');
  const after = wrap('    <div className="a">Törlés</div>');
  assert.equal(isPresentationOnlyChange("a/b.tsx", before, after), false);
});

test("hasonló nevű prop (pl. wrapperClassName) nem téveszt meg", () => {
  const before = wrap('    <C wrapperClassName="bg-white" />');
  const after = wrap('    <C wrapperClassName="bg-surface-card" />');
  assert.equal(
    isPresentationOnlyChange("a/b.tsx", before, after),
    false,
    "a wrapperClassName nem a `className` attribútum — nem eshet a kivétel alá",
  );
});

test("nem .tsx/.jsx fájl sosem prezentációs", () => {
  const before = 'const a = { className: "bg-white" };';
  const after = 'const a = { className: "bg-surface-card" };';
  assert.equal(isPresentationOnlyChange("a/b.ts", before, after), false);
});

test("új és törölt fájl sosem prezentációs", () => {
  const src = wrap('    <div className="a">x</div>');
  assert.equal(isPresentationOnlyChange("a/b.tsx", null, src), false);
  assert.equal(isPresentationOnlyChange("a/b.tsx", src, null), false);
});

test("elemezhetetlen forrás → null, és így NEM prezentációs", () => {
  // Párosítatlan kapcsos zárójel a className értékében.
  const broken = '<div className={["a"' + "\n";
  assert.equal(stripClassNames(broken), null);
  assert.equal(isPresentationOnlyChange("a/b.tsx", broken, broken + " "), false);
});

test("a stripClassNames a NEM-className tartalmat érintetlenül hagyja", () => {
  const src = 'const x = "className=nem attribútum";\n<div className="a" id="b" />';
  const stripped = stripClassNames(src) as string;
  assert.ok(stripped.includes('id="b"'), "az egyéb attribútumok megmaradnak");
  assert.ok(stripped.includes("className=@"), "a className értéke helyettesítve");
});
