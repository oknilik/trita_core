/**
 * TEAM felület-guardok (Vitest + RTL) — 2026-08-11 javítások:
 *
 * FIX A (kód-szivárgás): a felületen belső dimenziókód (X/H/…) nem
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

// 2026-08-11: a belső dimenziókódok kivezetve — a kanonikus kód MAGA a
// HEXACO-betű (H/E/X/A/C/O), amit a badge-ek szándékosan meg is jelenítenek.
// Ezért az őrszem itt már nem a betűkre fut (az önmagát bukná), hanem a
// KIVEZETETT örökség-kódokra: ha egy felület valaha visszahozná az INTE/RESO/…
// jelölést, az regresszió.
const LEGACY_DIM_CODES = ["INTE", "RESO", "TEMP", "THOR", "ADAP"];

function expectNoLegacyDimCodes() {
  const text = document.body.textContent ?? "";
  for (const code of LEGACY_DIM_CODES) {
    expect(text).not.toContain(code);
  }
}

// ── TeamInsights (manager) ──────────────────────────────────────────────────

const DIMS = [
  { code: "H", label: "Becsületesség-Alázat", color: "#8a5a44" },
  { code: "E", label: "Emocionalitás", color: "#7a6a8a" },
  { code: "X", label: "Extraverzió", color: "#b0763c" },
  { code: "A", label: "Barátságosság", color: "#5a7a5a" },
  { code: "C", label: "Lelkiismeretesség", color: "#4a6a8a" },
  { code: "O", label: "Nyitottság", color: "#6a8a7a" },
];

// X-en szándékosan nagy a szórás (20/75/25 → sd ≈ 30) — a sokszínűség-
// kártya renderel; O a top-erősség, H a top-fejlesztési terület.
const ROWS = [
  { memberId: "m1", displayName: "Anna", testType: "TRITAN", scores: { H: 30, E: 50, X: 20, A: 55, C: 60, O: 80 } },
  { memberId: "m2", displayName: "Béla", testType: "TRITAN", scores: { H: 28, E: 52, X: 75, A: 54, C: 61, O: 82 } },
  { memberId: "m3", displayName: "Csaba", testType: "TRITAN", scores: { H: 32, E: 48, X: 25, A: 56, C: 59, O: 78 } },
];

describe("TeamInsights", () => {
  it("a badge-ek HEXACO-betűt mutatnak, örökség-kód nem szivárog ki", () => {
    render(<TeamInsights rows={ROWS} dims={DIMS} isHu />);

    expectNoLegacyDimCodes();
    // Átlag-sáv + erősség-kártya badge — az O „O"-ként oldódik fel.
    expect(screen.getAllByText("O").length).toBeGreaterThanOrEqual(2);
    // Fejlesztési terület (H) → „H"; sokszínűség-kártya (X) → „X".
    expect(screen.getAllByText("H").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("X").length).toBeGreaterThanOrEqual(2);
  });

  it("nem jelenít meg ± szórás-számot; az átlagok maradnak", () => {
    render(<TeamInsights rows={ROWS} dims={DIMS} isHu />);

    expect(document.body.textContent).not.toContain("±");
    // Az átlag-szám (O: 80) továbbra is látszik.
    expect(screen.getAllByText("80").length).toBeGreaterThanOrEqual(1);
  });

  // 2026-08-11 valencia-döntés (score-valence.ts): az Emocionalitás egyik
  // pólusa sem erősség és nem is fejlesztendő terület. Itt a E a
  // LEGMAGASABB és egyben a LEGALACSONYABB jelölt is lenne (85 / —), tehát
  // mindkét kártya-slotot elvinné a kapu nélkül.
  const RESO_TOP_ROWS = [
    { memberId: "m1", displayName: "Anna", testType: "TRITAN", scores: { H: 40, E: 85, X: 45, A: 55, C: 60, O: 50 } },
    { memberId: "m2", displayName: "Béla", testType: "TRITAN", scores: { H: 42, E: 86, X: 44, A: 54, C: 61, O: 52 } },
    { memberId: "m3", displayName: "Csaba", testType: "TRITAN", scores: { H: 41, E: 84, X: 46, A: 56, C: 59, O: 51 } },
  ];

  it("a legmagasabb átlagú Emocionalitás NEM kerül a „Csapat erőssége” kártyára", () => {
    render(<TeamInsights rows={RESO_TOP_ROWS} dims={DIMS} isHu />);

    // Az erősség-kártya a következő valenciálható dimenziót (C ≈ 60)
    // mutatja; a E-átlag (85) csak az átlag-sávban jelenhet meg, ott is
    // egyszer — az erősség-kártyán nem ismétlődik.
    expect(screen.getAllByText("85").length).toBe(1);
    // A kivezetett erény-állítás nem jelenhet meg a kártyán.
    expect(document.body.textContent).not.toContain("Empatikus");
  });

  // 2026-08-11, a valencia-döntés kiterjesztése a Barátságosságra: a skála
  // facetjei a Megbocsátás · Gyengédség · Rugalmasság · Türelem — empátiát
  // NEM mér, ezért a magas A-átlaghoz nem tapadhat empátia-ígéret, és az
  // alacsony sem keretezhető puszta hiányként (mindkét sáv kétoldalú).
  const ADAP_HIGH_ROWS = [
    { memberId: "m1", displayName: "Anna", testType: "TRITAN", scores: { H: 40, E: 45, X: 44, A: 85, C: 50, O: 42 } },
    { memberId: "m2", displayName: "Béla", testType: "TRITAN", scores: { H: 42, E: 44, X: 45, A: 86, C: 51, O: 43 } },
    { memberId: "m3", displayName: "Csaba", testType: "TRITAN", scores: { H: 41, E: 46, X: 43, A: 84, C: 49, O: 44 } },
  ];

  const ADAP_LOW_ROWS = [
    { memberId: "m1", displayName: "Anna", testType: "TRITAN", scores: { H: 70, E: 55, X: 65, A: 22, C: 68, O: 66 } },
    { memberId: "m2", displayName: "Béla", testType: "TRITAN", scores: { H: 71, E: 54, X: 66, A: 23, C: 69, O: 67 } },
    { memberId: "m3", displayName: "Csaba", testType: "TRITAN", scores: { H: 69, E: 56, X: 64, A: 21, C: 67, O: 65 } },
  ];

  it("a magas Barátságosság-átlaghoz nem tapad empátia-ígéret", () => {
    render(<TeamInsights rows={ADAP_HIGH_ROWS} dims={DIMS} isHu />);

    const text = document.body.textContent ?? "";
    expect(/empát|empat/i.test(text)).toBe(false);
    // A kártya a mért facetekhez igazodó szókincset használja.
    expect(text).toContain("kompromisszum");
  });

  it("az alacsony Barátságosság kártyája kétoldalú (hozadék ÉS ár)", () => {
    render(<TeamInsights rows={ADAP_LOW_ROWS} dims={DIMS} isHu />);

    const text = document.body.textContent ?? "";
    expect(/empát|empat/i.test(text)).toBe(false);
    // Nem hiányként keretez: ott a hozadék („őszinte") és az ára („Cserébe").
    expect(text).toContain("Cserébe");
  });
});

// ── TeamIntelligence (erőforrás-térkép chipek) ──────────────────────────────

describe("TeamIntelligence", () => {
  const member = {
    id: "u1",
    name: "Anna Kovács",
    initials: "AK",
    tritan: { H: 78, E: 40, X: 45, A: 44, C: 70, O: 50 },
    measuredRoleScores: null,
    hasAssessmentData: true,
    color: "#334455",
    textColor: "#ffffff",
  };

  it("a tag-chip a HEXACO-betűt mutatja, örökség-kód nélkül", () => {
    render(<TeamIntelligence members={[member]} edges={[]} isHu />);

    expectNoLegacyDimCodes();
    // Top-2 dimenzió: H (78) → „H", C (70) → „C".
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
      dimensionAverages: { H: 55, E: 50, X: 52, A: 48, C: 60, O: 45 },
      dimensionSpread: { H: 8, E: 6, X: 9, A: 7, C: 10, O: 5 },
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
    // Az átlag-számok maradnak (C: 60).
    expect(screen.getAllByText("60").length).toBeGreaterThanOrEqual(1);
    expectNoLegacyDimCodes();
  });
});

describe("TeamReportMemberView", () => {
  it("a sáv-jelmagyarázat ± nélkül fogalmaz, a sáv-grafika megmarad", () => {
    render(
      <TeamReportMemberView
        report={makeReport()}
        viewer={{
          displayName: "Teszt Tag",
          scores: { H: 50, E: 50, X: 50, A: 50, C: 50, O: 50 },
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
