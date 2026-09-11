import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DynamicsMap } from "@/components/team/DynamicsMap";
import type { IntelligenceMember, DynamicsEdge } from "@/components/team/TeamIntelligence";

const members: IntelligenceMember[] = ["Bence", "Kata", "Márton"].map((name, index) => ({
  id: String(index),
  name: `Aurora ${name}`,
  initials: name[0],
  tritan: { H: 60, E: 55, X: 50, A: 65, C: 70, O: 75 },
  measuredRoleScores: null,
  hasAssessmentData: true,
  color: "var(--color-sage)",
  textColor: "var(--color-ink)",
}));

const edges: DynamicsEdge[] = [
  { from: "0", to: "1", type: "aligned", source: "trust_round", confidence: 100 },
  { from: "0", to: "2", type: "complementary", source: "profile_estimate", confidence: null },
];

describe("DynamicsMap", () => {
  it("shows distinctive labels and allows keyboard selection with full accessible names", () => {
    render(<DynamicsMap members={members} edges={edges} />);
    expect(screen.getByText("Bence")).toBeInTheDocument();
    expect(screen.getByText("Kata")).toBeInTheDocument();
    const bence = screen.getByRole("button", { name: "Aurora Bence" });
    fireEvent.keyDown(bence, { key: "Enter" });
    expect(bence).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("mért")).toBeInTheDocument();
    expect(screen.getByText("profil-becslés")).toBeInTheDocument();
    expect(screen.getByText("Kétirányú visszajelzés")).toBeInTheDocument();
    fireEvent.keyDown(bence, { key: " " });
    expect(bence).toHaveAttribute("aria-pressed", "false");
  });

  it("retains one-sided evidence beside the measured relationship", () => {
    render(<DynamicsMap members={members} edges={[{ ...edges[0], confidence: 50 }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Aurora Bence" }));
    expect(screen.getByText("egyoldalú visszajelzés")).toBeInTheDocument();
    expect(screen.queryByText("Kétirányú visszajelzés")).not.toBeInTheDocument();
  });
});
