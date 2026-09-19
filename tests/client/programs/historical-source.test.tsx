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

it("shows optional network coverage even with no usable pairs", async () => {
  const { ProgramTrustCoverage } = await import("@/components/team/ProgramTrustCoverage");
  const { rerender } = render(<ProgramTrustCoverage isHu={false} program={{ key: "TEAM_SCAN", observerReady: true, participantCount: 3, trustNetwork: { measuredPairCount: 0, possiblePairCount: 3, coveragePct: 0 } }} />);
  expect(screen.getByText(/measured pairs: 0\/3/)).toBeInTheDocument();
  expect(screen.getByText(/No usable network data/)).toBeInTheDocument();
  rerender(<ProgramTrustCoverage isHu={false} program={{ key: "FOLLOW_UP", observerReady: false, participantCount: 3 }} />);
  expect(screen.queryByText(/measured pairs/)).not.toBeInTheDocument();
});

it("discloses incomplete observer coverage and the consultant rationale in the reader view", async () => {
  const { ProgramTrustCoverage } = await import("@/components/team/ProgramTrustCoverage");
  render(<ProgramTrustCoverage isHu={false} program={{ key: "TEAM_SCAN", observerReady: false, participantCount: 8, observerCompletedParticipants: 6, observerOverride: { reason: "Discuss remaining gaps with the team.", actorId: "consultant", at: "2026-09-19" } }} />);
  expect(screen.getByText(/6\/8 participants/)).toBeInTheDocument();
  expect(screen.getByText(/Consultant rationale: Discuss remaining gaps/)).toBeInTheDocument();
});
