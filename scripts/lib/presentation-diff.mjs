// Prezentációs (csak-osztály) változás felismerése.
//
// MIÉRT VAN ERRE SZÜKSÉG: a quality gate szabálya — „védett modul módosult →
// bizonyítsd teszttel" — VISELKEDÉS-változásra van szabva, és arra helyes.
// Egy repó-szintű design-token migráció viszont több száz fájlban ír át
// className-eket ANÉLKÜL, hogy bármi viselkedés változna; a kapu ilyenkor
// olyan integrációs tesztet követel, aminek nincs mit lefednie. A kimódolt
// „teszt a kapuért" teszt rosszabb, mint a hiánya: zajt visz a hálóba.
//
// Ez a modul ezért megnézi, hogy KIZÁRÓLAG a className-attribútumok
// ÉRTÉKE változott-e. Ha igen, a fájl prezentációs — a kapu átengedi. Ha
// bármi más (logika, prop, inline style, szöveg), a követelmény marad.
//
// BIZTONSÁGI ALAPÉRTELMEZÉS: ha a beolvasás bármiért bizonytalan (nem
// elemezhető JSX, párosítatlan zárójel, nem .tsx/.jsx fájl), a válasz
// „nem prezentációs". A kapu inkább kérjen feleslegesen tesztet, mint hogy
// egy viselkedés-változás átcsússzon rajta.

const ATTR = "className";

/** Idézőjeles literál átugrása (escape-eket figyelve). -1, ha nincs vége. */
function skipQuoted(src, start) {
  const quote = src[start];
  let i = start + 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === quote) return i;
    i += 1;
  }
  return -1;
}

/**
 * Template-literál átugrása. A `${…}` blokkokban rekurzívan halad, mert azok
 * tetszőleges kifejezést (újabb stringet, template-et, objektumot) tartalmazhatnak.
 */
function skipTemplate(src, start) {
  let i = start + 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === "`") return i;
    if (c === "$" && src[i + 1] === "{") {
      const end = skipBraced(src, i + 1);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    i += 1;
  }
  return -1;
}

/** `{`-tól a párjáig. String/template belsejét nem számolja. -1, ha nincs pár. */
function skipBraced(src, start) {
  let depth = 0;
  let i = start;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      const end = skipQuoted(src, i);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    if (c === "`") {
      const end = skipTemplate(src, i);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return -1;
}

/**
 * Minden `className=…` attribútum ÉRTÉKÉT egyetlen jelre cseréli.
 *
 * @returns a normalizált forrás, vagy `null`, ha az elemzés bizonytalan.
 */
export function stripClassNames(source) {
  let out = "";
  let i = 0;

  while (i < source.length) {
    const c = source[i];

    // Kommentek és literálok EGYBEN maradnak: a bennük lévő „className" szó
    // nem attribútum. A szakaszokat változatlanul másoljuk át, tehát semmi
    // nem vész el — csak nem elemezzük őket.
    if (c === "/" && source[i + 1] === "/") {
      const nl = source.indexOf("\n", i);
      const end = nl === -1 ? source.length : nl;
      out += source.slice(i, end);
      i = end;
      continue;
    }
    if (c === "/" && source[i + 1] === "*") {
      const close = source.indexOf("*/", i + 2);
      const end = close === -1 ? source.length : close + 2;
      out += source.slice(i, end);
      i = end;
      continue;
    }
    if (c === '"' || c === "'") {
      const end = skipQuoted(source, i);
      if (end === -1) {
        // Párosítatlan idézőjel: JSX-szövegben ez természetes (aposztróf),
        // ilyenkor egyszerűen karakterként megyünk tovább.
        out += c;
        i += 1;
        continue;
      }
      out += source.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    if (c === "`") {
      const end = skipTemplate(source, i);
      if (end === -1) return null;
      out += source.slice(i, end + 1);
      i = end + 1;
      continue;
    }

    // Önálló `className` azonosító kód-pozícióban?
    if (
      source.startsWith(ATTR, i) &&
      !/[A-Za-z0-9_$]/.test(i === 0 ? "" : source[i - 1]) &&
      !/[A-Za-z0-9_$]/.test(source[i + ATTR.length] ?? "")
    ) {
      let j = i + ATTR.length;
      while (j < source.length && /\s/.test(source[j])) j += 1;
      if (source[j] === "=") {
        j += 1;
        while (j < source.length && /\s/.test(source[j])) j += 1;
        const opener = source[j];
        let end;
        if (opener === '"' || opener === "'") end = skipQuoted(source, j);
        else if (opener === "{") end = skipBraced(source, j);
        else return null; // ismeretlen alak — inkább ne mondjunk semmit
        if (end === -1) return null;
        out += `${ATTR}=@`;
        i = end + 1;
        continue;
      }
      out += ATTR;
      i += ATTR.length;
      continue;
    }

    out += c;
    i += 1;
  }

  return out;
}

/**
 * Csak a className-értékek változtak a két verzió között?
 *
 * @param {string} filePath  a fájl útvonala (a kiterjesztés is számít)
 * @param {string|null} before  a korábbi tartalom (null = új fájl)
 * @param {string|null} after   az új tartalom (null = törölt fájl)
 */
export function isPresentationOnlyChange(filePath, before, after) {
  if (!/\.(?:tsx|jsx)$/.test(filePath)) return false;
  if (before == null || after == null) return false; // új/törölt fájl sosem az
  if (before === after) return true;

  const strippedBefore = stripClassNames(before);
  const strippedAfter = stripClassNames(after);
  if (strippedBefore == null || strippedAfter == null) return false;

  return strippedBefore === strippedAfter;
}
