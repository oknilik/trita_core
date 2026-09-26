import { cleanup, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeReaderReport } from "../../../scripts/fixtures/team-report-reader";
import { TeamReportView } from "@/components/team/TeamReportView";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/components/team/TeamReportPdfButton", () => ({ TeamReportPdfButton: () => <button>PDF</button> }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); refresh.mockClear(); });

describe("client report reading flow", () => {
  it("keeps the measured layers in order and moves exact SD to the measurement tab", async () => {
    render(<TeamReportView report={makeReaderReport(true)} isHu />);
    const main = screen.getByRole("tabpanel");
    expect(within(main).getAllByRole("heading", { level: 2 }).slice(0, 4).map((el) => el.textContent)).toEqual([
      "Nincs erős eltolódás egyik pólus felé sem.", "Miből épül fel a csapat?", "Milyen hajlamokból építkezhettek?", "04 / A két réteg együtt",
    ]);
    expect(within(main).getAllByRole("img", { name: /A pont az átlagot jelöli/ })).toHaveLength(4);
    expect(within(main).getByRole("img", { name: "Vegyes csapatkép – különböző absztrakt karakterek" })).toBeVisible();
    expect(within(main).getByText("4/5", { exact: false })).toBeVisible();
    expect(within(main).getAllByText(/eltérő válaszadói kör adataiból/)).toHaveLength(2);
    expect(within(main).queryByText("Információáramlás × Fegyelem")).not.toBeInTheDocument();
    expect(within(main).queryByText("Szórás")).not.toBeInTheDocument();
    expect(within(main).getByText(/Javasolt műhelylépés/)).toBeVisible();
    expect(document.body.textContent).not.toContain("Private consultant note");
    await userEvent.click(screen.getByRole("tab", { name: "Mérési háttér" }));
    const data = screen.getByRole("tabpanel");
    expect(within(data).getAllByRole("table")).toHaveLength(2);
    expect(within(data).getByRole("row", { name: /Megvalósítás 52,1 16,1 4\/5/ })).toBeVisible();
    expect(within(data).getByText(/nem validált csapattípus/)).toBeVisible();
  });

  it("supports keyboard tabs and preserves unsaved actions across tab switches before saving", async () => {
    const report = makeReaderReport();
    report.actionItems = [{ id: "action-1", title: "Közös döntési napló", description: "A lényeges döntések okát rögzítjük.", timeframe: "30", owner: "Kata", status: "not_started" }];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    render(<TeamReportView report={report} isHu canManageActions />);
    screen.getByRole("tab", { name: "Csapatkép" }).focus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Utánkövetés" })).toHaveFocus();
    const owner = screen.getByRole("textbox", { name: "Felelős" });
    await userEvent.clear(owner); await userEvent.type(owner, "Dani");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("A lényeges döntések okát rögzítjük.");
    await userEvent.click(screen.getByRole("tab", { name: "Csapatkép" }));
    await userEvent.click(screen.getByRole("button", { name: "A vállalások követése" }));
    expect(screen.getByRole("textbox", { name: "Felelős" })).toHaveValue("Dani");
    await userEvent.click(screen.getByRole("button", { name: "Követés mentése" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/team/team_reader/report/actions");
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.reportId).toBe(report.id);
    expect(payload.actionItems[0]).toMatchObject({ owner: "Dani", description: report.actionItems[0].description });
  });

  it("keeps measured concerns and all consultant risks visible, without exposing private notes", () => {
    const report = makeReaderReport();
    report.risks = "• First risk\n• Second risk\n• Third risk\n• Critical fourth risk";
    report.aggregates!.psychSafety = { index: 25, band: "low", count: 5, spread: 23, itemMeans: {}, weakItemIds: [], campaignName: "Pulse", campaignStatus: "CLOSED", measuredAt: "2026-09-16" };
    render(<TeamReportView report={report} isHu={false} />);
    const main = screen.getByRole("tabpanel");
    expect(within(main).getByText(/Measured psychological safety is low/)).toBeVisible();
    expect(within(main).getByText("Critical fourth risk")).toBeVisible();
    expect(within(main).getByText(/English translation is awaiting approval/)).toBeVisible();
    expect(main).not.toHaveTextContent("23");
  });

  it("does not invent commitments and keeps draft action editing disabled", async () => {
    const report = makeReaderReport();
    const { rerender } = render(<TeamReportView report={report} isHu />);
    await userEvent.click(screen.getByRole("tab", { name: "Utánkövetés" }));
    expect(screen.getByText("Még nincs rögzített vállalás.")).toBeVisible();
    report.status = "DRAFT";
    report.actionItems = [{ title: "Még egyeztetendő", description: "Próba", timeframe: "30" }];
    rerender(<TeamReportView report={report} isHu canManageActions />);
    expect(screen.queryByRole("button", { name: "Követés mentése" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Felelős" })).not.toBeInTheDocument();
  });
});
