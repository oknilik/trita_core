import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TeamReportAggregates } from "@/lib/team-report";
import { TeamMemberSnapshot } from "@/components/team/TeamMemberSnapshot";

const baseProps = {
  teamId: "team-1",
  isHu: true,
  memberCount: 5,
  completedCount: 5,
  inProgressCount: 0,
  waitingCount: 0,
  stepProgress: [
    { type: "SELF_ASSESSMENT", done: 5, total: 5 },
    { type: "TEAM_ROLE", done: 5, total: 5 },
    { type: "TRUST_360", done: 4, total: 5 },
  ],
  hasPersonalTask: false,
};

describe("TeamMemberSnapshot", () => {
  it("a riport előtt a következő lépést mutatja, félrevezető lezárt előnézet nélkül", () => {
    render(<TeamMemberSnapshot {...baseProps} report={null} />);

    expect(screen.getByText("Az önértékelések elkészültek")).toBeInTheDocument();
    expect(screen.getByText("Visszajelzések gyűjtése")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "A csapatriport lépései" })).toBeInTheDocument();
    expect(screen.getByText("Adatgyűjtés").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.queryByText("A riporttal nyílik meg")).not.toBeInTheDocument();
    expect(screen.getByText("Kitöltések és adatgyűjtés részletei")).toBeInTheDocument();
    expect(screen.getByText("A személyiségprofilok elkészültek; a mérési körben még érkeznek válaszok. Ezután következik a tanácsadói értelmezés.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Feladataim/ })).not.toBeInTheDocument();
  });

  it("a teljes adatgyűjtés után a tanácsadói értelmezést jelzi, publikálást nem állít", () => {
    render(<TeamMemberSnapshot {...baseProps} stepProgress={[]} report={null} />);
    expect(screen.getByText("Tanácsadói értelmezésre vár")).toBeInTheDocument();
    expect(screen.queryByText("Publikált riport elérhető")).not.toBeInTheDocument();
  });

  it("a régi, vizuális aggregátum nélküli publikált riport is megnyitható", () => {
    render(<TeamMemberSnapshot {...baseProps} report={{ aggregates: null, summary: "Korábbi riport" }} />);
    expect(screen.getByText("Publikált riport elérhető")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Riport megnyitása/ })).toBeInTheDocument();
  });

  it("a publikált riport után valós szerepeket és mintázatot mutat", () => {
    const aggregates = {
      pattern: { label: "Kapcsolódó megvalósítók", confidence: "high" },
      roleDistribution: {
        counts: { KO: 2, MV: 2, ER: 1 },
        secondaryCounts: {},
        questionnaireCount: 5,
        estimateCount: 0,
      },
      trustHighlights: {
        source: "trust_round",
        measuredPairCount: 8,
        possiblePairCount: 10,
        coveragePct: 80,
        hubs: [],
        isolated: [],
      },
    } as unknown as TeamReportAggregates;

    render(
      <TeamMemberSnapshot
        {...baseProps}
        stepProgress={[]}
        report={{ aggregates, summary: "Összefoglaló" }}
      />,
    );

    const reportLink = screen.getByRole("link", { name: /Riport megnyitása/ });
    const readiness = screen.getByText("Kitöltések és adatgyűjtés részletei").closest("details");
    expect(readiness).not.toHaveAttribute("open");
    expect(reportLink.compareDocumentPosition(readiness!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByText("Összefoglaló")).toBeInTheDocument();
    expect(screen.queryByText("A riporttal nyílik meg")).not.toBeInTheDocument();
    expect(screen.getByText("Koordinátor · 2")).toBeInTheDocument();
    expect(screen.getByText("Megvalósító · 2")).toBeInTheDocument();
    expect(screen.getByText("Kapcsolódó megvalósítók")).toBeInTheDocument();
    expect(screen.getByText("Következő lépés")).toBeInTheDocument();
    expect(screen.getByText("A csapatriport elkészült – nézd meg a közös felismeréseket.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Riport megnyitása/ })).toHaveAttribute(
      "href",
      "/team/team-1?tab=report",
    );
  });
});
