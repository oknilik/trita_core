import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OperatingStyleClient } from "@/app/(app)/assessment/team-operating-style/OperatingStyleClient";
import { TeamOperatingStyleReport } from "@/components/team/TeamOperatingStyleReport";
import { ITEMS, OPERATING_STYLE_VERSION } from "@/lib/team-operating-style/questions";

import { calculateOperatingStyle } from "@/lib/team-operating-style/scoring";
vi.mock("@/components/LocaleProvider", () => ({ useLocale: () => ({ locale: "hu" }) }));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); refresh.mockClear(); });
const props = { locale: "hu" as const, campaignId: "campaign", campaignName: "Őszi kör", teamName: "Műhely",
  initialAnswers: {}, referenceStart: "2026-08-19", referenceEnd: "2026-09-16" };

describe("Operating Style participant flow", () => {
  it("shows one statement with a frequency scale, preserves N/A when going back and saves drafts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    render(<OperatingStyleClient {...props} />);
    expect(screen.getAllByRole("radiogroup")).toHaveLength(1);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.queryByText(/négyhetes|2026\. 08\. 19/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Következő" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Nem megítélhető" }));
    await userEvent.click(screen.getByRole("button", { name: "Következő" }));
    expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Vissza" }));
    expect(screen.getByRole("button", { name: "Nem megítélhető" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Mentés és folytatás később" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("elmentettük"));
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body.answers).toEqual({ INF1: null });
    expect(body.intent).toBe("draft");
    expect(body.campaignId).toBe("campaign");
    expect(body).not.toHaveProperty("userId");
  });
  it("preserves complete answers after network errors and retries final submission", async () => {
    const answers = Object.fromEntries(ITEMS.map(q => [q.id, 3]));
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<OperatingStyleClient {...props} initialAnswers={answers} />);
    await userEvent.click(screen.getByRole("button", { name: "Befejezés" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Nem sikerült"));
    expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Befejezés" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Köszönjük, kitöltötted a csapatműködési kérdőívet."));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).answers).toEqual(answers);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("walks through all 24 statements including N/A before final submission", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    render(<OperatingStyleClient {...props} />);
    for (let i = 0; i < 24; i++) {
      await userEvent.click(screen.getByRole("button", { name: "Nem megítélhető" }));
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", String(i + 1));
      await userEvent.click(screen.getByRole("button", { name: i === 23 ? "Befejezés" : "Következő" }));
    }
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Köszönjük, kitöltötted a csapatműködési kérdőívet."));
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(Object.keys(body.answers)).toHaveLength(24);
    expect(body.intent).toBe("submit");
    expect(body.instrumentVersion).toBe(OPERATING_STYLE_VERSION);
  });
  it("resumes at the first unanswered statement and supports keyboard frequency selection", async () => {
    render(<OperatingStyleClient {...props} initialAnswers={{ INF1: 4 }} />);
    expect(screen.getByText("2 / 24")).toBeInTheDocument();
    const first = screen.getByRole("radio", { name: /1 -/ });
    first.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: /2 -/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
  });
  it("renders the three report layers in order for a legacy snapshot", () => {
    render(<TeamOperatingStyleReport locale="en" legacyPattern="Legacy composition" />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((e) => e.textContent);
    expect(headings).toEqual(["No measured team pattern yet", "What is the team made of?", "Which tendencies can you build on?", "04 / The two layers together"]);
    expect(screen.queryByText("Legacy composition")).not.toBeInTheDocument();
    expect(screen.getAllByText(/no operating style measurement/).length).toBeGreaterThan(0);
  });
});


it("shows measured axes and coverage while keeping exact values in native disclosures", async () => {
  const operating = calculateOperatingStyle({ teamId: "team", roundId: "round", instrumentVersion: OPERATING_STYLE_VERSION,
    eligibleRespondentIds: ["a", "b", "c"], responses: ["a", "b", "c"].map((respondentId) => ({ respondentId,
      answers: Object.fromEntries(ITEMS.map((q) => [q.id, 5])),
    })) });
  render(<TeamOperatingStyleReport locale="hu" snapshot={{ version: 1, operating: { ...operating,
    referenceStart: "2026-08-19", referenceEnd: "2026-09-16" }, composition: null, sameRespondents: null, comparison: null }} />);
  expect(screen.getAllByRole("img")).toHaveLength(5);
  expect(screen.getAllByText((_, element) => element?.tagName === "SPAN" && element.textContent === "Értékelhető válasz: 3/3")).toHaveLength(4);
  expect(screen.getByText("Nincs erős eltolódás egyik pólus felé sem.")).toBeVisible();
  const summary = screen.getAllByText("Pontos értékek és a mérés háttere")[0];
  const disclosure = summary.closest("details")!;
  expect(disclosure.open).toBe(false);
  await userEvent.click(summary);
  expect(disclosure.open).toBe(true);
  expect(disclosure).toHaveTextContent("Szórás");
  expect(disclosure).toHaveTextContent("Lefedettség");
});
