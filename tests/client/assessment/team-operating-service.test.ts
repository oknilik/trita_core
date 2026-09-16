// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ITEMS, OPERATING_STYLE_VERSION } from "@/lib/team-operating-style/questions";
const mocks = vi.hoisted(() => ({ tx: {
  $queryRaw: vi.fn(), campaignParticipant: { findUnique: vi.fn() },
  teamMember: { findUnique: vi.fn() }, organizationMember: { findUnique: vi.fn() },
  teamOperatingResponse: { findUnique: vi.fn(), upsert: vi.fn() },
}, advance: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: async (fn: (tx: unknown) => unknown) => fn(mocks.tx) } }));
vi.mock("@/lib/campaign-steps", () => ({ advanceCampaignStepForUser: mocks.advance }));
import { saveOperatingResponse } from "@/lib/team-operating-style/service.server";
const answers = Object.fromEntries(ITEMS.map((q) => [q.id, 3]));
const body = { campaignId: "campaign", instrumentVersion: OPERATING_STYLE_VERSION, intent: "submit", answers };
function participant() { return { currentStep: 0, nextStepOpensAt: null, campaign: {
  id: "campaign", orgId: "org", status: "ACTIVE", type: "TEAM_OPERATING_STYLE", steps: ["TEAM_OPERATING_STYLE", "SELF_ASSESSMENT"],
  operatingRound: { id: "round", teamId: "team", eligibleUserIds: ["member"], instrumentVersion: OPERATING_STYLE_VERSION },
} }; }
beforeEach(() => {
  vi.clearAllMocks(); mocks.tx.$queryRaw.mockResolvedValue([{ id: "campaign" }]);
  mocks.tx.campaignParticipant.findUnique.mockResolvedValue(participant());
  mocks.tx.teamMember.findUnique.mockResolvedValue({ userId: "member" });
  mocks.tx.organizationMember.findUnique.mockResolvedValue({ leftAt: null });
  mocks.tx.teamOperatingResponse.findUnique.mockResolvedValue(null);
  mocks.tx.teamOperatingResponse.upsert.mockResolvedValue({}); mocks.advance.mockResolvedValue([]);
});
describe("Operating submission boundary", () => {
  it("locks the campaign before reading and saves/advances in that same transaction", async () => {
    await saveOperatingResponse("member", body);
    expect(mocks.tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(mocks.tx.campaignParticipant.findUnique.mock.invocationCallOrder[0]);
    expect(mocks.tx.teamOperatingResponse.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { roundId_userId: { roundId: "round", userId: "member" } },
    }));
    expect(mocks.advance).toHaveBeenCalledWith("member", "TEAM_OPERATING_STYLE", { campaignId: "campaign", db: mocks.tx, emitNotifications: false });
  });
  it("saves a draft without progressing", async () => {
    await saveOperatingResponse("member", { ...body, intent: "draft", answers: { INF1: null } });
    expect(mocks.advance).not.toHaveBeenCalled();
    expect(mocks.tx.teamOperatingResponse.upsert.mock.calls[0][0].update.submittedAt).toBeNull();
  });
  it("returns idempotent success for the identical final response and rejects edits", async () => {
    mocks.tx.teamOperatingResponse.findUnique.mockResolvedValue({ submittedAt: new Date(), answers });
    expect((await saveOperatingResponse("member", body)).replayed).toBe(true);
    expect(mocks.tx.teamOperatingResponse.upsert).not.toHaveBeenCalled();
    expect(mocks.advance).not.toHaveBeenCalled();
    await expect(saveOperatingResponse("member", { ...body, answers: { ...answers, INF1: 4 } })).rejects.toMatchObject({ code: "ALREADY_SUBMITTED" });
  });
  it("rejects missing enrollment, another roster, departed members and missing team membership", async () => {
    mocks.tx.campaignParticipant.findUnique.mockResolvedValueOnce(null);
    await expect(saveOperatingResponse("member", body)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(saveOperatingResponse("other", body)).rejects.toMatchObject({ code: "NOT_FOUND" });
    mocks.tx.organizationMember.findUnique.mockResolvedValueOnce({ leftAt: new Date() });
    await expect(saveOperatingResponse("member", body)).rejects.toMatchObject({ code: "FORBIDDEN" });
    mocks.tx.teamMember.findUnique.mockResolvedValueOnce(null);
    await expect(saveOperatingResponse("member", body)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.tx.teamOperatingResponse.upsert).not.toHaveBeenCalled();
  });
  it("rejects a closed campaign, scheduled or wrong step, and mismatched version", async () => {
    const closed = participant(); closed.campaign.status = "CLOSED";
    mocks.tx.campaignParticipant.findUnique.mockResolvedValueOnce(closed);
    await expect(saveOperatingResponse("member", body)).rejects.toMatchObject({ code: "CAMPAIGN_NOT_ACTIVE" });
    mocks.tx.campaignParticipant.findUnique.mockResolvedValueOnce({ ...participant(), nextStepOpensAt: new Date(Date.now() + 60_000) });
    await expect(saveOperatingResponse("member", body)).rejects.toMatchObject({ code: "STEP_LOCKED" });
    mocks.tx.campaignParticipant.findUnique.mockResolvedValueOnce({ ...participant(), currentStep: 1 });
    await expect(saveOperatingResponse("member", body)).rejects.toMatchObject({ code: "STEP_LOCKED" });
    const old = participant(); old.campaign.operatingRound.instrumentVersion = "old" as typeof OPERATING_STYLE_VERSION;
    mocks.tx.campaignParticipant.findUnique.mockResolvedValueOnce(old);
    await expect(saveOperatingResponse("member", body)).rejects.toMatchObject({ code: "VERSION_MISMATCH" });
    expect(mocks.tx.teamOperatingResponse.upsert).not.toHaveBeenCalled();
  });
});
