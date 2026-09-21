import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, it, expect, vi } from "vitest";
import { CandidateReportEditor } from "@/components/candidate/CandidateReportEditor";
import { CandidateSuggestions } from "@/components/candidate/CandidateSuggestions";
import type { Suggestion } from "@/lib/candidate-programs/suggestions";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const suggestion: Suggestion = {
  id: "profile:profile",
  title: "Working preferences",
  source: "Source: self-report 2026-09-21",
  text: "Explore this preference.",
  target: "candidateSummary",
};
it("appends edited suggestions, preserves notes on regeneration and requires saving before review", async () => {
  const user = userEvent.setup();
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      revision: 2,
      reviewedRevision: null,
      candidateSummary: "saved",
      managerSummary: "Manager text",
      internalNotes: "Private notes",
    }),
  });
  vi.stubGlobal("fetch", fetch);
  render(
    <CandidateReportEditor
      inviteId="i"
      locale="en"
      rolePending={false}
      suggestions={[suggestion]}
      initial={{
        revision: 1,
        reviewedRevision: 1,
        candidateSummary: "Existing text",
        managerSummary: "Manager text",
        internalNotes: "Private notes",
      }}
    />,
  );
  const card = screen.getByRole("group", { name: "Working preferences" });
  await user.click(within(card).getByRole("button", { name: "Edit" }));
  await user.type(
    screen.getByRole("textbox", { name: "Working preferences" }),
    " Edited.",
  );
  await user.click(within(card).getByRole("button", { name: "Insert" }));
  expect(screen.getByLabelText("Feedback for the candidate")).toHaveValue(
    "Existing text\n\nExplore this preference. Edited.\n\nSource: self-report 2026-09-21",
  );
  expect(screen.getByRole("button", { name: "Review" })).toBeDisabled();
  expect(screen.getByDisplayValue("Private notes")).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Regenerate suggestions" }),
  );
  expect(screen.getByLabelText("Feedback for the candidate")).toHaveValue(
    "Existing text\n\nExplore this preference. Edited.\n\nSource: self-report 2026-09-21",
  );
  await user.click(screen.getByRole("button", { name: "Save draft" }));
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
    action: "save",
    expectedRevision: 1,
    internalNotes: "Private notes",
  });
});
it("dismissal never inserts and a rejected oversized insertion keeps the card", async () => {
  const user = userEvent.setup();
  const insert = vi.fn(() => false);
  render(
    <CandidateSuggestions
      locale="en"
      suggestions={[suggestion]}
      insert={insert}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Insert" }));
  expect(screen.getByRole("alert")).toHaveTextContent(/exceeds/);
  await user.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(insert).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByRole("heading", { name: "Working preferences" }),
  ).toBeNull();
});
