// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), profile: vi.fn(), save: vi.fn(), notify: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { userProfile: { findUnique: mocks.profile } } }));
vi.mock("@/lib/team-operating-style/service.server", () => ({ saveOperatingResponse: mocks.save }));
vi.mock("@/lib/campaign-steps", () => ({ notifyCampaignStepOpenings: mocks.notify }));
import { POST } from "@/app/api/team-operating-style/route";
import { OperatingError } from "@/lib/team-operating-style/submission";
const body = { campaignId: "campaign", instrumentVersion: "tos-pilot-1", intent: "draft", answers: { INF1: 3 } };
const request = (value: unknown) => new Request("http://localhost/api/team-operating-style", { method: "POST", body: JSON.stringify(value) });
beforeEach(() => {
  vi.clearAllMocks(); mocks.auth.mockResolvedValue({ userId: "clerk" });
  mocks.profile.mockResolvedValue({ id: "real-member", deleted: false });
  mocks.save.mockResolvedValue({ openings: [], replayed: false }); mocks.notify.mockResolvedValue(undefined);
});
it("requires authenticated, non-deleted identity", async () => {
  mocks.auth.mockResolvedValueOnce({ userId: null });
  expect((await POST(request(body))).status).toBe(401);
  mocks.profile.mockResolvedValueOnce({ id: "real-member", deleted: true });
  expect((await POST(request(body))).status).toBe(401);
  expect(mocks.save).not.toHaveBeenCalled();
});
it("rejects client identity/team injection and routes only the server-resolved profile", async () => {
  expect((await POST(request({ ...body, userId: "victim" }))).status).toBe(400);
  expect((await POST(request({ ...body, teamId: "other" }))).status).toBe(400);
  expect((await POST(request(body))).status).toBe(200);
  expect(mocks.save).toHaveBeenCalledWith("real-member", body);
});
it("preserves service access errors and does not turn notification failure into failed submission", async () => {
  mocks.save.mockRejectedValueOnce(new OperatingError("FORBIDDEN", 403));
  expect((await POST(request(body))).status).toBe(403);
  mocks.notify.mockRejectedValueOnce(new Error("notification unavailable"));
  expect((await POST(request(body))).status).toBe(200);
});
