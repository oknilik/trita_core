import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { TeamReportEditor } from "@/components/team/TeamReportEditor";
import { makeReaderReport } from "../../../scripts/fixtures/team-report-reader";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/team/TeamReportView", () => ({
  TeamReportView: () => <div>Reader preview</div>,
}));
vi.mock("@/components/team/TeamReportPdfButton", () => ({
  TeamReportPdfButton: () => null,
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("preview preserves unsaved fields and reverting the edit restores the publish action", async () => {
  const user = userEvent.setup();
  const report = makeReaderReport();
  report.status = "DRAFT";
  report.revision = 3;
  report.reviewedRevision = 3;
  report.summary = "Reviewed summary";
  report.aggregates!.program = {
    key: "TEAM_SCAN",
    participantCount: 5,
    observerReady: true,
  };
  const fetch = vi
    .fn()
    .mockResolvedValue({
      ok: true,
      json: async () => ({
        report: {
          ...report,
          summary: "Unsaved summary",
          reviewedRevision: null,
        },
      }),
    });
  vi.stubGlobal("fetch", fetch);
  render(
    <TeamReportEditor
      teamId={report.teamId}
      campaignId="scan"
      reports={[report]}
      isHu={false}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Publish" }),
  ).toBeEnabled();
  fireEvent.change(screen.getByLabelText("Summary"), {
    target: { value: "Unsaved summary" },
  });
  expect(screen.getByRole("button", { name: "Approve review" })).toBeEnabled();
  await user.click(
    screen.getByRole("button", { name: "Preview" }),
  );
  await screen.findByText("Reader preview");
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
    action: "preview",
    expectedRevision: 3,
    summary: "Unsaved summary",
  });
  await user.click(screen.getByRole("button", { name: "Back to editing" }));
  expect(screen.getByLabelText("Summary")).toHaveValue("Unsaved summary");
  fireEvent.change(screen.getByLabelText("Summary"), {
    target: { value: "Reviewed summary" },
  });
  expect(
    screen.getByRole("button", { name: "Publish" }),
  ).toBeEnabled();
});
