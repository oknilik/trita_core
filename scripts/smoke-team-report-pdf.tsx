// Füstteszt: a TeamReportDocument node-oldali renderelése mock-adatokkal.
// NEM része a CI-nek — kézi ellenőrzés: `npx tsx scripts/smoke-team-report-pdf.tsx`.
// A font-átregisztráció a generate-persona-reports.tsx mintája.
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { registerPdfFonts } from "./pdf-report-render";
import { makeReaderReport, makeEditorialTeamReport } from "./fixtures/team-report-reader";

registerPdfFonts();

async function main() {
  const { TeamReportDocument } = await import("../src/components/pdf/TeamReportPdf");
  const report = makeEditorialTeamReport();

  for (const isHu of [true, false]) {
    const buf = await renderToBuffer(
      React.createElement(TeamReportDocument, { report: report as never, isHu }) as never,
    );
    console.log(`render ok (isHu=${isHu}): ${buf.length} bytes, %PDF=${buf.subarray(0, 5).toString()}`);
  }

  const followUp = makeReaderReport(true);
  followUp.aggregates!.program = { key: "FOLLOW_UP", observerReady: false, participantCount: 4,
    baseline: { campaignId: "baseline", reportId: "baseline-report", revision: 1, publishedAt: "2026-06-01T00:00:00Z" },
    cohortChanged: true, operatingChanges: [{ axis: "information", previous: 45, current: 55, delta: 10 }],
  };
  for (const isHu of [true, false]) {
    const pdf = await renderToBuffer(React.createElement(TeamReportDocument, { report: followUp, isHu }) as never);
    const { writeFileSync } = await import("node:fs");
    writeFileSync(`/tmp/team-follow-up-${isHu ? "hu" : "en"}.pdf`, pdf);
    console.log(`follow-up render (isHu=${isHu}): ${pdf.length} bytes`);
  }

  // Üres-aggregátum ág (régi riport): ne dőljön el.
  const bare = { ...report, aggregates: null, actionItems: null, leadershipGuide: null };
  const buf = await renderToBuffer(
    React.createElement(TeamReportDocument, { report: bare as never, isHu: true }) as never,
  );
  console.log(`render ok (no aggregates): ${buf.length} bytes`);

  // Vizuális ellenőrzéshez fájlba is kiírjuk a teljes HU változatot.
  const { writeFileSync } = await import("node:fs");
  const full = await renderToBuffer(
    React.createElement(TeamReportDocument, { report: report as never, isHu: true }) as never,
  );
  writeFileSync("/tmp/team-report-smoke.pdf", full);
  console.log("written /tmp/team-report-smoke.pdf");
  for (const isHu of [true, false]) {
    const sample = await renderToBuffer(React.createElement(TeamReportDocument, { report: makeReaderReport(true), isHu }) as never);
    writeFileSync(`/tmp/team-report-reader-${isHu ? "hu" : "en"}.pdf`, sample);
    console.log(`reader cohort sample (isHu=${isHu}): ${sample.length} bytes`);
  }
}

main().catch((err) => {
  console.error("SMOKE FAILED", err);
  process.exit(1);
});
