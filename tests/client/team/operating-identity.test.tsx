import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { operatingIdentity } from "@/lib/team-operating-style/identity";
import { presentTeamStyle } from "@/lib/team-operating-style/presentation";
import { OPERATING_CATALOGUE } from "@/lib/team-operating-style/catalogue";
import { TeamPatternCard } from "@/components/team/TeamPatternCard";
import { TeamOperatingStyleReport } from "@/components/team/TeamOperatingStyleReport";
import { makeReaderReport } from "../../../scripts/fixtures/team-report-reader";
afterEach(cleanup);

describe("measured identity replaces personality-derived names", () => {
  it("resolves all 16 frozen measurement codes through the current bilingual catalogue", () => {
    const snapshot = makeReaderReport().aggregates!.teamStyle!;
    for (const [code, entry] of Object.entries(OPERATING_CATALOGUE)) {
      snapshot.operating!.pattern!.code = code as keyof typeof OPERATING_CATALOGUE;
      for (const locale of ["hu", "en"] as const) {
        expect(operatingIdentity(snapshot, locale)).toMatchObject({ code: entry.code, label: entry.name[locale], status: "descriptive" });
      }
    }
  });
  it("never resurrects a personality name in web or shared PDF presentation", () => {
    const snapshot = makeReaderReport().aggregates!.teamStyle!;
    snapshot.composition!.name = "RETIRED PERSONALITY NAME";
    expect(JSON.stringify(presentTeamStyle(snapshot, "hu", "RETIRED FALLBACK"))).not.toMatch(/RETIRED/);
    render(<TeamOperatingStyleReport snapshot={snapshot} locale="hu" legacyPattern="RETIRED FALLBACK" />);
    expect(screen.queryByText(/RETIRED/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tervezők" })).toBeInTheDocument();
  });
  it("does not infer an operating identity from a composition-only report", () => {
    const snapshot = makeReaderReport().aggregates!.teamStyle!;
    snapshot.operating = null;
    render(<TeamPatternCard snapshot={snapshot} isHu />);
    expect(screen.getByRole("heading", { name: "Még nincs mért csapatminta" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
  it("links a measured pattern and preserves tentative and unavailable states", () => {
    const snapshot = makeReaderReport().aggregates!.teamStyle!;
    const { rerender } = render(<TeamPatternCard snapshot={snapshot} isHu />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/operating-patterns?pattern=SECP&lang=hu");
    expect(screen.getByRole("img")).toBeInTheDocument();
    snapshot.operating!.pattern!.status = "tentative";
    rerender(<TeamPatternCard snapshot={snapshot} isHu />);
    expect(operatingIdentity(snapshot, "hu").status).toBe("tentative");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(operatingIdentity(makeReaderReport(true).aggregates!.teamStyle, "hu").code).toBeNull();
  });
});
