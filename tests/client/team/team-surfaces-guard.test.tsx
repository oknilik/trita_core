/**
 * TEAM felület-guardok (Vitest + RTL) — 2026-08-11 javítások:
 *
 * FIX A (kód-szivárgás): a felületen belső dimenziókód (TEMP/INTE/…) nem
 * jelenhet meg — a badge-ek a HEXACO-betűt (H/E/X/A/C/O) mutatják, a közös
 * `hexLetter` feloldón át (tritan.ts).
 * FIX B (termékdöntés): ±szórás/±eltérés SZÁM sehol nem jelenik meg a
 * renderelt csapat-kimenetben — a diszperzió-számítás belül él tovább
 * (sokszínűség-kártya, kohézió-trigger, halvány sáv-grafika).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamInsights } from "@/components/manager/TeamInsights";
import { TeamIntelligence } from "@/components/team/TeamIntelligence";
import { TeamReportView } from "@/components/team/TeamReportView";
import { TeamReportMemberView } from "@/components/team/TeamReportMemberView";
import type { SerializedTeamReport } from "@/lib/team-report";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

const RAW_DIM_CODES = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"];

function expectNoRawDimCodes() {
  const text = document.body.textContent ?? "";
  for (const code of RAW_DIM_CODES) {
    expect(text).not.toContain(code);
  }
}

// ── TeamInsights (manager) ──────────────────────────────────────────────────

const DIMS = [
  { code: "INTE", label: "Becsületesség-Alázat", color: "#8a5a44" },
  { code: "RESO", label: "Emocionalitás", color: "#7a6a8a" },
  { code: "TEMP", label: "Extraverzió", color: "#b0763c" },
  { code: "ADAP", label: "Barátságosság", color: "#5a7a5a" },
  { code: "THOR", label: "Lelkiismeretesség", color: "#4a6a8a" },
  { code: "OPEN", label: "Nyitottság", color: "#6a8a7a" },
];

// TEMP-en szándékosan nagy a szórás (20/75/25 → sd ≈ 30) — a sokszínűség-
// kártya renderel; OPEN a top-erősség, INTE a top-fejlesztési terület.
const ROWS = [
  { memberId: "m1", displayName: "Anna", testType: "TRITAN", scores: { INTE: 30, RESO: 50, TEMP: 20, ADAP: 55, THOR: 60, OPEN: 80 } },
  { memberId: "m2", displayName: "Béla", testType: "TRITAN", scores: { INTE: 28, RESO: 52, TEMP: 75, ADAP: 54, THOR: 61, OPEN: 82 } },
  { memberId: "m3", displayName: "Csaba", testType: "TRITAN", scores: { INTE: 32, RESO: 48, TEMP: 25, ADAP: 56, THOR: 59, OPEN: 78 } },
];

describe("TeamInsights", () => {
  it("a badge-ek HEXACO-betűt mutatnak, belső kód nem szivárog ki", () => {
    render(<TeamInsights rows={ROWS} dims={DIMS} isHu />);

    expectNoRawDimCodes();
    // Átlag-sáv + erősség-kártya badge — az OPEN „O"-ként oldódik fel.
    expect(screen.getAllByText("O").length).toBeGreaterThanOrEqual(2);
    // Fejlesztési terület (INTE) → „H"; sokszínűség-kártya (TEMP) → „X".
    expect(screen.getAllByText("H").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("X").length).toBeGreaterThanOrEqual(2);
  });

  it("nem jelenít meg ± szórás-számot; az átlagok maradnak", () => {
    render(<TeamInsights rows={ROWS} dims={DIMS} isHu />);

    expect(document.body.textContent).not.toContain("±");
    // Az átlag-szám (OPEN: 80) továbbra is látszik.
    expect(screen.getAllByText("80").length).toBeGreaterThanOrEqual(1);
  });
});

// ── TeamIntelligence (erőforrás-térkép chipek) ──────────────────────────────

describe("TeamIntelligence", () => {
  const member = {
    id: "u1",
    name: "Anna Kovács",
    initials: "AK",
    tritan: { INTE: 78, RESO: 40, TEMP: 45, ADAP: 44, THOR: 70, OPEN: 50 },
    measuredRoleScores: null,
    hasAssessmentData: true,
    color: "#334455",
    textColor: "#ffffff",
  };

  it("a tag-chip a HEXACO-betűt mutatja a belső kód helyett", () => {
    render(<TeamIntelligence members={[member]} edges={[]} isHu />);

    expectNoRawDimCodes();
    // Top-2 dimenzió: INTE (78) → „H", THOR (70) → „C".
    expect(screen.getByText("H")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(document.body.textContent).toContain("78%");
    expect(document.body.textContent).not.toContain("±");
  });
});

// ── TeamReportView + TeamReportMemberView ───────────────────────────────────

function makeReport(): SerializedTeamReport {
  return {
    id: "rep_1",
    teamId: "team_1",
    status: "PUBLISHED",
    title: "Csapatkép",
    aggregates: {
      generatedAt: "2026-08-01T10:00:00Z",
      memberCount: 5,
      completedCount: 4,
      completionPct: 80,
      dimensionAverages: { INTE: 55, RESO: 50, TEMP: 52, ADAP: 48, THOR: 60, OPEN: 45 },
      dimensionSpread: { INTE: 8, RESO: 6, TEMP: 9, ADAP: 7, THOR: 10, OPEN: 5 },
      pattern: null,
      roleDistribution: null,
      roleGaps: null,
      evidence: { quality: "partial", measuredEdgeCount: 0, estimatedEdgeCount: 6 },
      dynamics: null,
      psychSafety: {
        index: 72,
        band: "mid",
        count: 5,
        spread: 23,
        itemMeans: {},
        weakItemIds: [],
        campaignName: "PS pulse",
        campaignStatus: "CLOSED",
        measuredAt: "2026-08-01T10:00:00Z",
      },
    },
    summary: null,
    strengths: null,
    risks: null,
    recommendations: null,
    interviewFindings: null,
    leadershipGuide: null,
    actionItems: null,
    internalNotes: null,
    translationsEn: null,
    publishedAt: "2026-08-01T10:00:00Z",
    createdAt: "2026-08-01T09:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
  };
}

describe("TeamReportView", () => {
  it("nem renderel ± jelet: sem a dimenzió-számoknál, sem a pszich. biztonságnál", () => {
    render(<TeamReportView report={makeReport()} isHu />);

    const text = document.body.textContent ?? "";
    expect(text).not.toContain("±");
    // A ±szóródás-szám (23) kijelzése megszűnt; a válasz-darabszám marad.
    expect(text).not.toContain("23");
    expect(text).toContain("névtelen válasz");
    // Az átlag-számok maradnak (THOR: 60).
    expect(screen.getAllByText("60").length).toBeGreaterThanOrEqual(1);
    expectNoRawDimCodes();
  });
});

describe("TeamReportMemberView", () => {
  it("a sáv-jelmagyarázat ± nélkül fogalmaz, a sáv-grafika megmarad", () => {
    render(
      <TeamReportMemberView
        report={makeReport()}
        viewer={{
          displayName: "Teszt Tag",
          scores: { INTE: 50, RESO: 50, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50 },
          teamRoleScores: null,
          teamRoleSource: null,
        }}
        isHu
        teamName="Minta csapat"
      />,
    );

    expect(document.body.textContent).not.toContain("±");
    expect(
      screen.getByText(/a csapat átlaga körüli jellemző tartomány/),
    ).toBeInTheDocument();
  });
});
