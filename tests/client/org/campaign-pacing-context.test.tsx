import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CampaignPacingTile } from "@/components/org/CampaignPacingTile";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const data = {
  orgId: "org-1",
  campaignId: "campaign-1",
  campaignName: "Őszi mérés",
  teamName: "Termék",
  stepIntervalHours: 24,
  totalParticipants: 6,
  doneCount: 1,
  openCount: 3,
  openStepType: "PSYCH_SAFETY",
  scheduledCount: 2,
  nextReleaseAt: "2099-01-01T08:00:00.000Z",
};

describe("CampaignPacingTile context", () => {
  it("az org cockpitben csak állapotot és a részletező linkjét mutatja", () => {
    render(
      <CampaignPacingTile
        data={data}
        canManagePacing={false}
        managementHref="/org/org-1/campaigns/campaign-1"
        isHu
      />,
    );

    expect(screen.getByRole("link", { name: "Ütemezés kezelése" })).toHaveAttribute(
      "href",
      "/org/org-1/campaigns/campaign-1",
    );
    expect(screen.queryByRole("button", { name: "Küldés most" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "azonnal" })).not.toBeInTheDocument();
  });
});
