// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { teamOperatingRound: { findFirst: mocks.findFirst } } }));
import { resolveOperatingReportSource } from "@/lib/team-operating-style/report-source.server";
import { loadTeamStyleSnapshot } from "@/lib/team-operating-style/snapshot.server";
import { OPERATING_STYLE_VERSION } from "@/lib/team-operating-style/questions";
beforeEach(() => { vi.clearAllMocks(); mocks.findFirst.mockResolvedValue({ id: "round" }); });
describe("separate operating report source", () => {
  it("retains the explicit source on republication and scopes validation to team, organization and closed state", async () => {
    expect(await resolveOperatingReportSource("team", "org", undefined, { operatingCampaignId: "operating" })).toBe("operating");
    expect(mocks.findFirst).toHaveBeenCalledWith({ where: { teamId: "team", campaignId: "operating", campaign: { orgId: "org", status: "CLOSED" } }, select: { id: true } });
  });
  it("lets the consultant select another round or explicitly return to the original source", async () => {
    expect(await resolveOperatingReportSource("team", "org", "new", { operatingCampaignId: "old" })).toBe("new");
    mocks.findFirst.mockClear();
    expect(await resolveOperatingReportSource("team", "org", null, { operatingCampaignId: "old" })).toBeUndefined();
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });
  it("rejects inaccessible, active or foreign sources rather than falling back", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(resolveOperatingReportSource("team", "org", "foreign", null)).rejects.toThrow("REPORT_OPERATING_SOURCE_INVALID");
  });
  it("loads the separate round even when the personality round has no operating measurement", async () => {
    mocks.findFirst.mockImplementation(async ({ where }) => where.campaignId === "operating" ? {
      id: "round", instrumentVersion: OPERATING_STYLE_VERSION, eligibleUserIds: ["a", "b", "c"], responses: [],
      referenceStart: new Date("2026-08-19"), referenceEnd: new Date("2026-09-16"),
    } : null);
    expect((await loadTeamStyleSnapshot("team", "personality", null, [])).operating).toBeNull();
    expect((await loadTeamStyleSnapshot("team", "operating", null, [])).operating).not.toBeNull();
  });
});
