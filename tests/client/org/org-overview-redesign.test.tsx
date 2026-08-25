import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrgOverviewSnapshot } from "@/components/org/OrgOverviewSnapshot";
import { OrgOverviewNextAction } from "@/components/org/OrgOverviewNextAction";
import { OrgTeamsTab } from "@/components/org/OrgTeamsTab";

describe("organization overview redesign", () => {
  it("valós szervezeti adatokból építi fel az állapotképet", () => {
    render(
      <OrgOverviewSnapshot
        isHu
        memberCount={15}
        completedMemberCount={15}
        teamCount={3}
        activeCampaignCount={0}
        activeDoneCount={0}
        activeParticipantCount={0}
      />,
    );

    expect(screen.getByRole("heading", { name: "A szervezet közös képe" })).toBeInTheDocument();
    expect(screen.getByText("Mindenki készen áll")).toBeInTheDocument();
    expect(screen.getByText("15 / 15")).toBeInTheDocument();
    expect(screen.getByText("Nincs folyamatban")).toBeInTheDocument();
  });

  it("a következő lépést tömör, közvetlen sávként mutatja", () => {
    render(
      <OrgOverviewNextAction
        isHu
        focus={{
          title: "Tekintsd át a csapatok állapotát",
          description: "A szervezeti alapok rendben vannak.",
          primary: { label: "Csapatok megnyitása", href: "/org/org-1?tab=teams" },
          secondary: null,
        }}
      />,
    );

    expect(screen.getByText("Következő lépés")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Csapatok megnyitása/ })).toHaveAttribute(
      "href",
      "/org/org-1?tab=teams",
    );
  });

  it("a csapatkártyákon a publikált riport valós elérhetőségét jelzi", () => {
    render(
      <OrgTeamsTab
        teams={[
          {
            id: "team-1",
            name: "Ügyfélszolgálat",
            createdAt: "2026-08-20T10:00:00.000Z",
            _count: { members: 5 },
            hasPublishedReport: true,
          },
          {
            id: "team-2",
            name: "Termékfejlesztés",
            createdAt: "2026-08-21T10:00:00.000Z",
            _count: { members: 5 },
            hasPublishedReport: false,
          },
        ]}
        orgId="org-1"
        locale="hu"
        isManager={false}
        canCreateTeam={false}
        isHu
      />,
    );

    expect(screen.getByRole("heading", { name: /Csapatok/ })).toBeInTheDocument();
    expect(screen.getByText("Riport elérhető")).toBeInTheDocument();
    expect(screen.getByText("Még nincs publikált riport")).toBeInTheDocument();
  });
});
