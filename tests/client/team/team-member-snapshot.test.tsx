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
  it("a riport előtt lezárt előnézetként mutatja a riportfüggő felismeréseket", () => {
    render(<TeamMemberSnapshot {...baseProps} report={null} />);

    expect(screen.getByText("A csapat készen áll")).toBeInTheDocument();
    expect(screen.getAllByText("A riporttal nyílik meg")).toHaveLength(2);
    expect(screen.getByText("Már 4 / 5 csapattárs kitöltötte a kapcsolati kört.")).toBeInTheDocument();
    expect(screen.getByText("Minden saját feladatod kész — a riport publikálására vársz.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Feladataim/ })).not.toBeInTheDocument();
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

    expect(screen.queryByText("A riporttal nyílik meg")).not.toBeInTheDocument();
    expect(screen.getByText("Koordinátor · 2")).toBeInTheDocument();
    expect(screen.getByText("Megvalósító · 2")).toBeInTheDocument();
    expect(screen.getByText("Kapcsolódó megvalósítók")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Riport megnyitása/ })).toHaveAttribute(
      "href",
      "/team/team-1?tab=report",
    );
  });
});
