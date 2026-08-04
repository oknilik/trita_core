// A manuális tesztkatalógus betöltése + validálása — közös logika a
// generátor (scripts/generate-manual-tests.mjs) és az integritás-őrző
// unit teszt (tests/unit/manual/catalog.test.ts) számára.
import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

export const AUTOMATED_VALUES = ["none", "partial", "full"];
export const PRIORITY_VALUES = ["P1", "P2", "P3"];
const REQUIRED_FIELDS = [
  "id",
  "area",
  "name",
  "persona",
  "emails",
  "preconditions",
  "steps",
  "expected",
  "automated",
  "priority",
];
const ID_PATTERN = /^[A-Z]{2,6}-\d{2}$/;

export async function loadCatalog(catalogDir) {
  const files = (await readdir(catalogDir))
    .filter((f) => f.endsWith(".mjs"))
    .sort();
  const cases = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(catalogDir, file)).href);
    if (!Array.isArray(mod.cases)) {
      throw new Error(`${file}: nincs exportált \`cases\` tömb`);
    }
    for (const c of mod.cases) cases.push({ ...c, sourceFile: file });
  }
  return cases;
}

/** @returns {string[]} hibalista — üres, ha a katalógus érvényes */
export function validateCases(cases) {
  const errors = [];
  const seenIds = new Set();
  for (const c of cases) {
    const where = `${c.sourceFile ?? "?"} → ${c.id ?? "(id nélkül)"}`;
    for (const field of REQUIRED_FIELDS) {
      const v = c[field];
      if (v == null || (typeof v === "string" && v.trim() === "")) {
        errors.push(`${where}: hiányzó mező: ${field}`);
      }
    }
    if (typeof c.id === "string") {
      if (!ID_PATTERN.test(c.id)) {
        errors.push(`${where}: az id nem PREFIX-NN alakú (${c.id})`);
      }
      if (seenIds.has(c.id)) errors.push(`${where}: duplikált id`);
      seenIds.add(c.id);
    }
    if (c.automated != null && !AUTOMATED_VALUES.includes(c.automated)) {
      errors.push(`${where}: automated érvénytelen (${c.automated})`);
    }
    if (c.priority != null && !PRIORITY_VALUES.includes(c.priority)) {
      errors.push(`${where}: priority érvénytelen (${c.priority})`);
    }
    if (
      c.automated != null &&
      c.automated !== "none" &&
      (c.coveredBy == null || String(c.coveredBy).trim() === "")
    ) {
      errors.push(`${where}: automated=${c.automated}, de coveredBy üres`);
    }
    if (c.emails != null && typeof c.emails === "object") {
      if (Object.keys(c.emails).length === 0) {
        errors.push(`${where}: az emails map üres`);
      }
    } else if (c.emails != null) {
      errors.push(`${where}: az emails nem objektum (szerep→cím map kell)`);
    }
  }
  return errors;
}

const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Szerep→email feloldás: az "AUTO" értékű bejegyzések a teszt-postafiók
 * +címkés változatát kapják (eset-azonosító + nem-fő szerepeknél a szerep
 * slugja), a konkrét címek változatlanul mennek át.
 */
export function resolveEmails(c, mailbox) {
  const [local, domain] = mailbox.split("@");
  const out = {};
  for (const [role, value] of Object.entries(c.emails)) {
    if (value === "AUTO") {
      const suffix = role === "fő" ? "" : `-${slug(role)}`;
      out[role] = `${local}+${c.id.toLowerCase()}${suffix}@${domain}`;
    } else {
      out[role] = value;
    }
  }
  return out;
}
