import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OperatingStyleClient } from "@/app/(app)/assessment/team-operating-style/OperatingStyleClient";
import { TeamOperatingStyleReport } from "@/components/team/TeamOperatingStyleReport";
import { ITEMS } from "@/lib/team-operating-style/questions";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); refresh.mockClear(); });
const props = { locale: "hu" as const, campaignId: "campaign", campaignName: "Őszi kör", teamName: "Műhely",
  initialAnswers: {}, referenceStart: "2026-08-19", referenceEnd: "2026-09-16" };

describe("Operating Style participant flow", () => {
  it("renders 24 accessible statements, permits drafts, and keeps incomplete submit disabled", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    render(<OperatingStyleClient {...props} />);
    expect(screen.getAllByRole("group")).toHaveLength(24);
    expect(screen.getByRole("button", { name: "Válaszok véglegesítése" })).toBeDisabled();
    await userEvent.click(screen.getAllByRole("radio", { name: "Nem megítélhető" })[0]);
    await userEvent.click(screen.getByRole("button", { name: "Mentés és folytatás később" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("elmentettük"));
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body.answers).toEqual({ INF1: null });
    expect(body.intent).toBe("draft");
    expect(body.campaignId).toBe("campaign");
    expect(body).not.toHaveProperty("userId");
  });
  it("preserves a complete answer set after errors and can retry final submission", async () => {
    const answers = Object.fromEntries(ITEMS.map((q) => [q.id, 3]));
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<OperatingStyleClient {...props} initialAnswers={answers} />);
    await userEvent.click(screen.getByRole("button", { name: "Válaszok véglegesítése" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Nem sikerült"));
    expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(24);
    await userEvent.click(screen.getByRole("button", { name: "Válaszok véglegesítése" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("elkészült"));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).answers).toEqual(answers);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("renders the three report layers in order for a legacy snapshot", () => {
    render(<TeamOperatingStyleReport locale="en" legacyPattern="Legacy composition" />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((e) => e.textContent);
    expect(headings).toEqual(["1. How do you work together?", "2. What is your personality composition?", "3. The two patterns together"]);
    expect(screen.getByText("Legacy composition")).toBeInTheDocument();
    expect(screen.getByText(/no operating style measurement/)).toBeInTheDocument();
  });
});
