#!/usr/bin/env node
// Manuális teszt-Excel generátor — a tests/manual/catalog/ adat-moduljaiból
// tesztelőknek átadható .xlsx-et készít (eset + teszt-email + várt kimenet
// + kitöltendő Eredmény/Jegyzet oszlopok).
//
//   pnpm manual-tests
//   pnpm manual-tests -- --mailbox=qa.trita@gmail.com --out=docs/qa/manual-test-plan.xlsx
//
// A katalógus sémáját a tests/manual/catalog/README.md írja le; az
// integritást a tests/unit/manual/catalog.test.ts őrzi.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import ExcelJS from "exceljs";
import {
  loadCatalog,
  validateCases,
  resolveEmails,
} from "./lib/manual-test-catalog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_DIR = path.join(ROOT, "tests/manual/catalog");

function parseArgs(argv) {
  const args = { mailbox: "trita.qa@gmail.com", out: "docs/qa/manual-test-plan.xlsx" };
  for (const a of argv) {
    const m = a.match(/^--(mailbox|out)=(.+)$/);
    if (m) args[m[1]] = m[2];
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.mailbox)) {
    console.error(`Érvénytelen --mailbox: ${args.mailbox}`);
    process.exit(1);
  }
  return args;
}

// Trita-paletta (design-tokens.ts árnyalatokból) — Excel ARGB formában.
const COLOR = {
  headerBg: "FF8C6A4A", // bronz
  headerFg: "FFFFFDF8", // krém-fehér
  zebraBg: "FFF7F3EC", // homok-halvány
  p1Bg: "FFFBEFE7", // meleg kiemelés a P1-nek
  border: "FFE5DCCB",
};

const COLUMNS = [
  { header: "ID", key: "id", width: 10 },
  { header: "Prio", key: "priority", width: 6 },
  { header: "Terület", key: "area", width: 18 },
  { header: "Eset", key: "name", width: 34 },
  { header: "Persona", key: "persona", width: 16 },
  { header: "Teszt-email(ek)", key: "emails", width: 34 },
  { header: "Előfeltételek", key: "preconditions", width: 34 },
  { header: "Lépések", key: "steps", width: 52 },
  { header: "Várt eredmény", key: "expected", width: 52 },
  { header: "Automata", key: "automated", width: 10 },
  { header: "Fedő teszt", key: "coveredBy", width: 28 },
  { header: "Eredmény", key: "result", width: 12 },
  { header: "Tesztelő jegyzete", key: "note", width: 30 },
];

async function main() {
  const { mailbox, out } = parseArgs(process.argv.slice(2));
  const cases = await loadCatalog(CATALOG_DIR);
  const errors = validateCases(cases);
  if (errors.length > 0) {
    console.error(`A katalógus érvénytelen (${errors.length} hiba):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  // Stabil sorrend: terület szerinti csoport, azon belül id.
  const sorted = [...cases].sort(
    (a, b) => a.area.localeCompare(b.area, "hu") || a.id.localeCompare(b.id),
  );

  const wb = new ExcelJS.Workbook();
  wb.creator = "Trita QA generátor";

  // ── 1. lap: Áttekintés ────────────────────────────────────────────────
  const info = wb.addWorksheet("Áttekintés");
  info.columns = [{ width: 30 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 12 }];
  info.addRow(["Trita — manuális tesztterv"]).font = { bold: true, size: 14 };
  info.addRow([`Generálva: ${new Date().toISOString().slice(0, 10)}`]);
  info.addRow([`Teszt-postafiók: ${mailbox} (+címkés címek soronként)`]);
  info.addRow([
    "Kitöltés: az Esetek lapon az Eredmény oszlopba PASS / FAIL / BLOCKED,",
  ]);
  info.addRow(["eltérésnél a Tesztelő jegyzete oszlopba rövid leírás + képernyőkép-link."]);
  info.addRow([]);
  const headerRow = info.addRow(["Terület", "P1", "P2", "P3", "Összesen"]);
  headerRow.font = { bold: true };
  const byArea = new Map();
  for (const c of sorted) {
    const rec = byArea.get(c.area) ?? { P1: 0, P2: 0, P3: 0 };
    rec[c.priority] += 1;
    byArea.set(c.area, rec);
  }
  for (const [area, rec] of byArea) {
    info.addRow([area, rec.P1, rec.P2, rec.P3, rec.P1 + rec.P2 + rec.P3]);
  }
  const total = sorted.length;
  const auto = sorted.filter((c) => c.automated !== "none").length;
  info.addRow([]);
  info.addRow([`Összes eset: ${total} — ebből automata háló is fed: ${auto}`]);

  // ── 2. lap: Esetek ────────────────────────────────────────────────────
  const ws = wb.addWorksheet("Esetek", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = COLUMNS;

  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: COLOR.headerFg } };
  head.alignment = { vertical: "middle" };
  head.height = 22;
  head.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.headerBg } };
  });

  sorted.forEach((c, i) => {
    const emails = resolveEmails(c, mailbox);
    const emailText = Object.entries(emails)
      .map(([role, addr]) => (role === "fő" ? addr : `${role}: ${addr}`))
      .join("\n");
    const row = ws.addRow({
      id: c.id,
      priority: c.priority,
      area: c.area,
      name: c.name,
      persona: c.persona,
      emails: emailText,
      preconditions: c.preconditions,
      steps: c.steps,
      expected: c.expected,
      automated: c.automated,
      coveredBy: c.coveredBy ?? "",
      result: "",
      note: "",
    });
    row.alignment = { vertical: "top", wrapText: true };
    const bg = c.priority === "P1" ? COLOR.p1Bg : i % 2 === 1 ? COLOR.zebraBg : null;
    if (bg) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      });
    }
    row.eachCell((cell) => {
      cell.border = { bottom: { style: "thin", color: { argb: COLOR.border } } };
    });
    // PASS/FAIL/BLOCKED legördülő az Eredmény oszlopban
    ws.getCell(`L${row.number}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"PASS,FAIL,BLOCKED"'],
    };
  });

  ws.autoFilter = { from: "A1", to: `M${sorted.length + 1}` };

  const outPath = path.resolve(ROOT, out);
  await mkdir(path.dirname(outPath), { recursive: true });
  await wb.xlsx.writeFile(outPath);
  console.log(
    `OK — ${total} eset (${byArea.size} terület) → ${path.relative(ROOT, outPath)}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
