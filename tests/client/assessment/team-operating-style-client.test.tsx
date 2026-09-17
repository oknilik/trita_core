import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OperatingStyleClient } from "@/app/(app)/assessment/team-operating-style/OperatingStyleClient";
import { TeamOperatingStyleReport } from "@/components/team/TeamOperatingStyleReport";
import { ITEMS, OPERATING_STYLE_VERSION } from "@/lib/team-operating-style/questions";

import { calculateOperatingStyle } from "@/lib/team-operating-style/scoring";
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); refresh.mockClear(); });
const props = { locale: "hu" as const, campaignId: "campaign", campaignName: "Őszi kör", teamName: "Műhely",
  initialAnswers: {}, referenceStart: "2026-08-19", referenceEnd: "2026-09-16" };

describe("Operating Style participant flow", () => {
  it("renders 24 accessible statements, permits drafts, and guides incomplete submission to the first missing answer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    render(<OperatingStyleClient {...props} />);
    expect(screen.getAllByRole("group")).toHaveLength(24);
    await userEvent.click(screen.getByRole("button", { name: "Válaszok véglegesítése" }));
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getAllByRole("radio")[0]).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveTextContent("Még megválaszolatlan állítások");
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
  it("submits after answering every statement from an empty form, including N/A", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    render(<OperatingStyleClient {...props} />);
    for (const radio of screen.getAllByRole("radio", { name: "Nem megítélhető" })) await userEvent.click(radio);
    expect(screen.queryByText(/Még megválaszolatlan állítások/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Válaszok véglegesítése" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("elkészült"));
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(Object.keys(body.answers)).toHaveLength(24);
    expect(body.intent).toBe("submit");
  });
  it("renders the three report layers in order for a legacy snapshot", () => {
    render(<TeamOperatingStyleReport locale="en" legacyPattern="Legacy composition" />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((e) => e.textContent);
    expect(headings).toEqual(["1. How do you work together?", "2. What is your personality composition?", "3. The two patterns together"]);
    expect(screen.getByText("Legacy composition")).toBeInTheDocument();
    expect(screen.getAllByText(/no operating style measurement/)).toHaveLength(2);
  });
});


it("shows measured axes and coverage while keeping exact values in native disclosures", async () => {
  const operating = calculateOperatingStyle({ teamId: "team", roundId: "round", instrumentVersion: OPERATING_STYLE_VERSION,
    eligibleRespondentIds: ["a", "b", "c"], responses: ["a", "b", "c"].map((respondentId) => ({ respondentId,
      answers: Object.fromEntries(ITEMS.map((q) => [q.id, 5])),
    })) });
  render(<TeamOperatingStyleReport locale="hu" snapshot={{ version: 1, operating: { ...operating,
    referenceStart: "2026-08-19", referenceEnd: "2026-09-16" }, composition: null, sameRespondents: null, comparison: null }} />);
  expect(screen.getAllByRole("img")).toHaveLength(4);
  expect(screen.getAllByText("Értékelhető válasz: 3/3")).toHaveLength(4);
  expect(screen.getByText("Nincs erős eltolódás egyik pólus felé sem.")).toBeVisible();
  const summary = screen.getAllByText("Pontos értékek és a mérés háttere")[0];
  const disclosure = summary.closest("details")!;
  expect(disclosure.open).toBe(false);
  await userEvent.click(summary);
  expect(disclosure.open).toBe(true);
  expect(disclosure).toHaveTextContent("Szórás");
  expect(disclosure).toHaveTextContent("Lefedettség");
});
