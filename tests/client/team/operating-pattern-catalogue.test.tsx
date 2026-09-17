import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OperatingPatternExplorer } from "@/app/(marketing)/operating-patterns/OperatingPatternExplorer";
import { OPERATING_CATALOGUE } from "@/lib/team-operating-style/catalogue";
import { TeamOperatingStyleReport } from "@/components/team/TeamOperatingStyleReport";
import { makeReaderReport } from "../../../scripts/fixtures/team-report-reader";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("pattern=IODP") }));
vi.mock("@/components/LocaleProvider", () => ({ useLocale: () => ({ locale: "hu" }) }));
afterEach(cleanup);

describe("operating catalogue and layered report", () => {
  it("deep-links into the catalogue and selects all 16 distinct patterns without workshop questions", async () => {
    render(<OperatingPatternExplorer />);
    expect(screen.getByRole("button", { name: /IODP/ })).toHaveAttribute("aria-pressed", "true");
    for (const pattern of Object.values(OPERATING_CATALOGUE)) {
      await userEvent.click(screen.getByRole("button", { name: new RegExp(pattern.code) }));
      expect(screen.getByRole("heading", { level: 2, name: pattern.name.hu })).toBeVisible();
    }
    expect(screen.queryByText(/Beszélgetésindító|Workshopkérdés/)).not.toBeInTheDocument();
    expect(new Set(Object.values(OPERATING_CATALOGUE).map((p) => p.code)).size).toBe(16);
  });

  it("uses new names for frozen snapshots and highlights the exact personality sources", async () => {
    const agg = makeReaderReport().aggregates!;
    agg.teamStyle!.operating!.pattern!.name = { hu: "Irányítótorony", en: "Control Tower" };
    render(<TeamOperatingStyleReport snapshot={agg.teamStyle} locale="hu" averages={{ H: 68, E: 51, X: 64, A: 72, C: 76, O: 70 }} spread={{ H: 12, A: 11 }} personalityCount={5} />);
    expect(screen.getByRole("heading", { name: "Tervezők" })).toBeVisible();
    expect(screen.getByRole("link", { name: "A minta megismerése" })).toHaveAttribute("href", "/operating-patterns?pattern=SECP&lang=hu");
    expect(document.querySelectorAll('[data-highlighted="true"]')).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: /^Fegyelem/ }));
    expect(document.querySelectorAll('[data-highlighted="true"]')).toHaveLength(1);
    expect(document.querySelector('[data-dimension="C"]')).toHaveAttribute("data-highlighted", "true");
    expect(document.querySelector('[data-dimension="E"]')).toHaveAttribute("data-highlighted", "false");
  });

  it("does not assign a hero code to mixed, unavailable or legacy reports", () => {
    const agg = makeReaderReport(true).aggregates!;
    const { rerender } = render(<TeamOperatingStyleReport snapshot={agg.teamStyle} locale="en" />);
    expect(screen.queryByRole("link", { name: "Explore this pattern" })).not.toBeInTheDocument();
    expect(screen.getAllByText(/different respondent groups, so no combined pattern/).length).toBeGreaterThan(0);
    rerender(<TeamOperatingStyleReport snapshot={null} locale="en" legacyPattern="Legacy team" />);
    expect(screen.getAllByText(/no operating style measurement/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText(/Missing values are not reconstructed/)).toBeVisible();
  });

  it("shows tentative poles and alternative names without a definitive catalogue description", () => {
    const snapshot = makeReaderReport().aggregates!.teamStyle!;
    snapshot.operating!.pattern!.status = "tentative";
    snapshot.operating!.pattern!.alternativeCodes = ["0001"];
    snapshot.operating!.axes.execution.mean = 49;
    snapshot.operating!.axes.execution.pole = "mixed";
    snapshot.operating!.axes.execution.flags = ["near_midpoint"];
    render(<TeamOperatingStyleReport snapshot={snapshot} locale="hu" mode="overview" />);
    expect(screen.getByText(/Tájékozódó besorolás:/)).toBeVisible();
    expect(screen.getByText(/Lehetséges alternatívák: Navigátorok/)).toBeVisible();
    expect(screen.getByText(/nincs egyértelmű pólus ezen a tengelyen/)).toBeVisible();
    expect(screen.queryByText(OPERATING_CATALOGUE["0000"].description.hu)).not.toBeInTheDocument();
    expect(within(screen.getByTestId("team-style-report")).getAllByRole("img")).toHaveLength(4);
  });
});
