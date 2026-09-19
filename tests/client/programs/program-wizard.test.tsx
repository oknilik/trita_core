import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
import { ProgramWizard } from "@/components/campaign/ProgramWizard";
const teams = [{ id: "team", name: "Research", members: [{ userId: "one", displayName: "One" }, { userId: "two", displayName: "Two" }, { userId: "three", displayName: "Three" }] }];
beforeEach(() => { vi.clearAllMocks(); });
describe("Diagnostic program creation", () => {
  it("offers exactly two programs and pins the selected Follow-up baseline", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ campaign: { id: "new" } }) }).mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetcher);
    render(<ProgramWizard orgId="org" teams={teams} locale="en" preselectedTeamId="team" baselines={[{ campaignId: "baseline", teamId: "team", title: "September Scan" }]} />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    fireEvent.click(screen.getByRole("radio", { name: /Follow-up/ }));
    expect(screen.getByRole("combobox", { name: /Published baseline/ })).toHaveValue("baseline");
    fireEvent.click(screen.getByRole("button", { name: "Create program draft" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/org/org/campaigns/new"));
    const payload = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(payload).toMatchObject({ programKey: "FOLLOW_UP", baselineCampaignId: "baseline", teamIds: ["team"] });
    expect(payload.includeTrustNetwork).toBe(false);
    expect(payload).not.toHaveProperty("types");
    expect(payload).not.toHaveProperty("programSnapshot");
  });
  it("does not offer a Follow-up without a compatible baseline", () => {
    render(<ProgramWizard orgId="org" teams={teams} locale="en" preselectedTeamId="team" baselines={[]} />);
    fireEvent.click(screen.getByRole("radio", { name: /Follow-up/ }));
    expect(screen.getByRole("button", { name: "Create program draft" })).toBeDisabled();
  });
  it("retries participant creation without duplicating the campaign", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ campaign: { id: "saved" } }) }).mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetcher);
    render(<ProgramWizard orgId="org" teams={teams} locale="en" preselectedTeamId="team" baselines={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Create program draft" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Create program draft" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/org/org/campaigns/saved"));
    expect(fetcher.mock.calls.filter(c => c[0] === "/api/org/org/campaigns")).toHaveLength(1);
  });
});

for (const key of ["Team Scan", "Follow-up"]) it(`${key} saves explicit optional trust selection`, async () => {
  const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ campaign: { id: "trust" } }) }).mockResolvedValueOnce({ ok: true });
  vi.stubGlobal("fetch", fetcher);
  render(<ProgramWizard orgId="org" teams={teams} locale="en" preselectedTeamId="team" baselines={[{ campaignId: "baseline", teamId: "team", title: "Baseline" }]} />);
  const checkbox = screen.getByRole("checkbox", { name: "Measure trust network" });
  expect(checkbox).not.toBeChecked();
  fireEvent.click(screen.getByRole("radio", { name: new RegExp(`^${key}`) }));
  fireEvent.click(checkbox);
  fireEvent.click(screen.getByRole("button", { name: "Create program draft" }));
  await waitFor(() => expect(mocks.push).toHaveBeenCalled());
  expect(JSON.parse(fetcher.mock.calls[0][1].body).includeTrustNetwork).toBe(true);
});
