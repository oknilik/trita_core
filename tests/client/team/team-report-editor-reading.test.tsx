import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SerializedTeamReport } from "@/lib/team-report";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/components/team/TeamReportView", () => ({
  TeamReportView: ({ report }: { report: SerializedTeamReport }) => (
    <article data-testid={`report-${report.id}`}><h2>{report.title}</h2><p>{report.summary}</p></article>
  ),
}));
vi.mock("@/components/team/TeamWorkshopFacilitatorView", () => ({ TeamWorkshopFacilitatorView: () => <p>Workshop tools</p> }));
vi.mock("@/components/team/TeamReportComparison", () => ({ TeamReportComparison: () => <p>Report comparison</p> }));
vi.mock("@/components/ui/CelebrationBurst", () => ({ CelebrationBurst: () => null }));

import { TeamReportEditor } from "@/components/team/TeamReportEditor";

const published: SerializedTeamReport = {
  id: "published", teamId: "team", status: "PUBLISHED", title: "Közzétett csapatkép",
  aggregates: null, summary: "Jóváhagyott felismerések", strengths: null, risks: null,
  recommendations: null, interviewFindings: null, leadershipGuide: null, actionItems: [],
  internalNotes: null, translationsEn: null,
  publishedAt: "2026-09-09T10:00:00Z", createdAt: "2026-09-08T10:00:00Z", updatedAt: "2026-09-09T10:00:00Z",
};
const draft: SerializedTeamReport = { ...published, id: "draft", status: "DRAFT", title: "Következő riport", summary: "Szerkeszthető értelmezés", publishedAt: null };
const props = { teamId: "team", campaignId: "campaign", isHu: true };

beforeEach(() => {
  refresh.mockClear();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("consultant report reading and editing", () => {
  it("opens the published findings before any new-report prompt", () => {
    render(<TeamReportEditor {...props} reports={[published]} />);
    expect(screen.getByText("Jóváhagyott felismerések")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Riport-vázlat létrehozása" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publikált riport" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: "Workshop és összehasonlítás" })).toHaveAttribute("href", "#report-workshop-tools");
    fireEvent.click(screen.getByRole("button", { name: "Új riport készítése" }));
    expect(screen.getByRole("button", { name: "Riport-vázlat létrehozása" })).toBeInTheDocument();
  });

  it("keeps unsaved draft text when switching between the published report and editing", () => {
    render(<TeamReportEditor {...props} reports={[draft, published]} />);
    expect(screen.queryByRole("textbox", { name: "Összefoglaló" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Vázlat szerkesztése" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Összefoglaló" }), { target: { value: "Még nem mentett gondolat" } });
    fireEvent.click(screen.getByRole("button", { name: "Publikált riport" }));
    expect(screen.getByText("Jóváhagyott felismerések")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Vázlat szerkesztése" }));
    expect(screen.getByRole("textbox", { name: "Összefoglaló" })).toHaveValue("Még nem mentett gondolat");
  });

  it("opens editing by default when no report has been published and returns there from preview", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ report: draft }))));
    render(<TeamReportEditor {...props} reports={[draft]} />);
    expect(screen.getByRole("textbox", { name: "Riport címe" })).toHaveValue("Következő riport");
    fireEvent.click(screen.getByRole("button", { name: "Előnézet" }));
    await screen.findByTestId("report-draft");
    fireEvent.click(screen.getByRole("button", { name: "Vissza a szerkesztéshez" }));
    expect(screen.getByRole("textbox", { name: "Összefoglaló" })).toHaveValue("Szerkeszthető értelmezés");
  });

  it("returns to published reading after publication and refreshed report data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ report: draft }))));
    const { rerender } = render(<TeamReportEditor {...props} reports={[draft, published]} />);
    fireEvent.click(screen.getByRole("button", { name: "Vázlat szerkesztése" }));
    fireEvent.click(screen.getByRole("button", { name: "Publikálás (validálás)" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    rerender(<TeamReportEditor {...props} reports={[{ ...draft, status: "PUBLISHED", publishedAt: "2026-09-10T10:00:00Z" }, published]} />);
    expect(screen.getByTestId("report-draft")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Riport címe" })).not.toBeInTheDocument();
  });

  it("opens the withdrawn report for editing after unpublishing", async () => {
    const withdrawn = { ...published, status: "DRAFT" as const, publishedAt: null };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ report: withdrawn }))));
    const { rerender } = render(<TeamReportEditor {...props} reports={[published]} />);
    fireEvent.click(screen.getByRole("button", { name: "Visszavonás szerkesztésre" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    rerender(<TeamReportEditor {...props} reports={[withdrawn]} />);
    expect(screen.getByRole("textbox", { name: "Riport címe" })).toHaveValue(published.title);
    expect(screen.getByRole("textbox", { name: "Összefoglaló" })).toHaveValue(published.summary);
  });

  it("shows a failed report action in reading mode", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "TEAM_FORBIDDEN" }), { status: 403 })));
    render(<TeamReportEditor {...props} reports={[published]} />);
    fireEvent.click(screen.getByRole("button", { name: "Visszavonás szerkesztésre" }));
    expect(await screen.findByRole("alert")).not.toBeEmptyDOMElement();
    expect(screen.getByText("Jóváhagyott felismerések")).toBeInTheDocument();
  });
});
