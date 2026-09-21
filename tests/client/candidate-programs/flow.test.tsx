import {
  render,
  within,
  screen,
  waitFor,
  cleanup,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { CandidateClient } from "@/app/(app)/apply/[token]/CandidateClient";
import { CandidateReportEditor } from "@/components/candidate/CandidateReportEditor";
vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const questions = [
  { id: 1, text: "First statement", dimension: "H" },
  { id: 2, text: "Second statement", dimension: "E" },
];
const initial = {
  answers: {},
  revision: 0,
  acknowledged: false,
  submitted: false,
  teamRoleState: "NOT_ENABLED",
};
it("uses the self/observer card, leaves answers unselected and restores answers on back", async () => {
  let revision = 0;
  const fetcher = vi.fn().mockImplementation(async () => ({
    ok: true,
    json: async () => ({ revision: ++revision }),
  }));
  vi.stubGlobal("fetch", fetcher);
  render(
    <CandidateClient
      token="token"
      locale="en"
      testName="TSFI"
      questions={questions}
      initial={initial}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Start assessment" }),
  ).toBeDisabled();
  await userEvent.click(screen.getByRole("checkbox"));
  await userEvent.click(
    screen.getByRole("button", { name: "Start assessment" }),
  );
  await screen.findByTestId("assessment-focus-header");
  expect(screen.getAllByRole("radio")).toHaveLength(5);
  expect(screen.queryAllByRole("radio", { checked: true })).toHaveLength(0);
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  await userEvent.click(screen.getByRole("checkbox"));
  await userEvent.click(screen.getByRole("radio", { name: /^4 -/ }));
  await userEvent.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByText("Second statement");
  await new Promise((r) => setTimeout(r, 150));
  await userEvent.click(screen.getByRole("button", { name: "Back" }));
  await screen.findByText("First statement");
  expect(screen.getByRole("radio", { name: /^4 -/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Save and continue later" }),
  );
  await screen.findByText(/Your progress is saved/);
  expect(JSON.parse(fetcher.mock.calls.at(-1)![1].body).answers).toEqual({
    "1": 4,
  });
});
it("keeps an optional step reachable after the main response is submitted and records explicit skip", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetcher);
  render(
    <CandidateClient
      token="token"
      locale="en"
      testName="TSFI"
      questions={questions}
      initial={{ ...initial, submitted: true, teamRoleState: "PENDING" }}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Optional team-role self-assessment" }),
  ).toBeInTheDocument();
  const skip = screen
    .getAllByRole("button")
    .find((b) => /skip/i.test(b.textContent || ""));
  expect(skip).toBeDefined();
  await userEvent.click(skip!);
  await screen.findByText("Your answers have been received.");
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
    selections: null,
  });
});
it("does not mark a failed save as saved or permit completing a stale draft", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ revision: 1 }) })
    .mockResolvedValue({
      ok: false,
      json: async () => ({ error: "DRAFT_CHANGED" }),
    });
  vi.stubGlobal("fetch", fetcher);
  render(
    <CandidateClient
      token="token"
      locale="en"
      testName="TSFI"
      questions={questions}
      initial={{ ...initial, acknowledged: true }}
    />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Start assessment" }),
  );
  await screen.findByTestId("assessment-focus-header");
  await userEvent.click(screen.getByRole("radio", { name: /^3 -/ }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "another window or device",
    ),
  );
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
});
it("requires saving changed text before review and sharing", async () => {
  const record = {
    revision: 1,
    reviewedRevision: 1,
    candidateSummary: "For candidate",
    managerSummary: "For manager",
    internalNotes: "Private",
  };
  render(
    <CandidateReportEditor
      inviteId="invite"
      locale="en"
      initial={record}
      rolePending={false}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Share candidate feedback" }),
  ).toBeEnabled();
  fireEvent.change(
    screen.getByRole("textbox", { name: "Feedback for the candidate" }),
    { target: { value: "Changed" } },
  );
  expect(
    screen.getByRole("button", { name: "Share candidate feedback" }),
  ).toBeDisabled();
  expect(screen.getByRole("button", { name: "Review" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
});

it("switches team reference without ranking and protects unsaved consultant observations", async () => {
  const { CandidateReportWorkspace } = await import(
    "@/components/candidate/CandidateReportWorkspace"
  );
  const d = { H: 50, E: 60, X: 40, A: 55, C: 70, O: 65 };
  render(
    <CandidateReportWorkspace
      inviteId="i"
      name="Anna"
      position="Designer"
      measuredAt="2026-09-19"
      dimensions={d}
      comparisons={[
        {
          reportId: "r1",
          teamId: "t1",
          teamName: "Product",
          revision: 1,
          publishedAt: "2026-09-12",
          count: 8,
          dimensions: d,
          connection: "",
          difference: "",
          prompt: "",
        },
        {
          reportId: "r2",
          teamId: "t2",
          teamName: "Service",
          revision: 1,
          publishedAt: "2026-09-10",
          count: 6,
          dimensions: { ...d, X: 70 },
          connection: "",
          difference: "",
          prompt: "",
        },
      ]}
      sources={[]}
      report={{
        revision: 1,
        reviewedRevision: null,
        candidateSummary: "",
        managerSummary: "",
        internalNotes: "",
      }}
      locale="en"
      rolePending={false}
      roles={[]}
      focus=""
      invalidSources={[]}
    />,
  );
  const service = screen.getByRole("button", { name: /Service/ });
  await userEvent.click(service);
  expect(service).toHaveAttribute("aria-pressed", "true");
  expect(
    within(
      screen.getByRole("tabpanel", { name: "Team comparisons" }),
    ).getAllByText("No consultant observation yet."),
  ).toHaveLength(3);
  await userEvent.click(screen.getByText(/Edit consultant observations/));
  await userEvent.type(
    screen.getByRole("textbox", { name: "Connection" }),
    "Discuss collaboration",
  );
  expect(screen.getByRole("tab", { name: "Feedback" })).toBeDisabled();
  expect(screen.getByRole("button", { name: /Product/ })).toBeDisabled();
});
