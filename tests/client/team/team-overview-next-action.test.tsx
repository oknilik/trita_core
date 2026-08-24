import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeamOverviewNextAction } from "@/components/team/TeamOverviewNextAction";

describe("TeamOverviewNextAction", () => {
  it("egyetlen elsődleges teendőt mutat, a többit a Feladataim nézetre tereli", () => {
    render(
      <TeamOverviewNextAction
        isHu
        pendingMeasurement={{
          campaignId: "campaign-autumn",
          campaignName: "Őszi kör",
          stepType: "PSYCH_SAFETY",
          opensAt: null,
          started: false,
        }}
        observerGathering={{ campaignName: "Külső kör", sent: 1, received: 0, min: 3 }}
        receivedFeedbackRequests={[
          { token: "feedback-token", inviterName: "Anna", answered: 2, total: 5 },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Pszichológiai biztonság pulse" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kitöltöm most" })).toHaveAttribute(
      "href",
      "/assessment/psych-safety?campaignId=campaign-autumn",
    );
    expect(screen.getByRole("link", { name: "További 2 teendő" })).toHaveAttribute(
      "href",
      "/tasks",
    );
    expect(screen.queryByText(/Anna számára/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Zárd le a külső/)).not.toBeInTheDocument();
  });
});
