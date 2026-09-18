import React from "react";
import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamPersonalityLayers } from "@/components/team/TeamPersonalityLayers";
import { personalitySourceLabel } from "@/lib/programs/report";
it("labels historical personality directly in its chart section", () => {
  const label = personalitySourceLabel({ key: "FOLLOW_UP", participantCount: 3, observerReady: false, baseline: { campaignId: "c", reportId: "r", revision: 1, publishedAt: "2026-06-01T00:00:00Z" } }, false);
  render(<TeamPersonalityLayers averages={{ H: 60, E: 50, X: 60 }} count={3} locale="en" sourceLabel={label} />);
  const source = screen.getAllByText(/Previous personality measurement.*2026-06-01/)[0];
  expect(source.closest("section")?.querySelector('[role="img"]')).not.toBeNull();
});
