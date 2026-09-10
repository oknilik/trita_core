import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { ObserverFlowStatusCard } from "@/components/results/ObserverFlowStatusCard";

const flow = { state: "locked" as const, receivedCount: 0, minForReveal: 3, activeCampaignName: null };
describe("feedback round guidance", () => {
  it("explains who starts the round and the later invitation task", () => {
    const { rerender } = render(<ObserverFlowStatusCard flow={flow} isHu />);
    expect(screen.getByText(/a program tanácsadója indítja el/)).toBeInTheDocument();
    expect(screen.getByText(/itt választod ki és kéred fel az értékelőidet/)).toBeInTheDocument();
    rerender(<ObserverFlowStatusCard flow={{ ...flow, state: "in_progress", activeCampaignName: "Őszi kör" }} isHu />);
    expect(screen.getByText(/Most te választod ki az értékelőidet/)).toBeInTheDocument();
    expect(screen.getByText(/A név szerint felkért kolléga a saját fiókjával jelentkezik be/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("max", "3");
  });
  it("offers the available comparison in English", async () => {
    const open = vi.fn();
    render(<ObserverFlowStatusCard flow={{ ...flow, state: "available", receivedCount: 3 }} isHu={false} onOpenComparison={open} />);
    await userEvent.click(screen.getByRole("button", { name: "Open comparison" }));
    expect(open).toHaveBeenCalledOnce();
  });
});
