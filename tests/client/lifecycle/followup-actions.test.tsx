import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FollowupActions, FollowupUnsubscribe } from "@/components/lifecycle/FollowupActions";
import { AdminLifecycleSection } from "@/app/(app)/admin/_components/AdminLifecycleSection";

describe("follow-up preferences", () => {
  it("opening unsubscribe is passive; only the confirmation sends a POST", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", request);
    render(<FollowupUnsubscribe token="opaque" locale="hu" />);
    expect(request).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Leiratkozom" }));
    expect(request).toHaveBeenCalledWith("/api/lifecycle/unsubscribe?token=opaque", { method: "POST" });
    expect(await screen.findByRole("status")).toHaveTextContent("Leiratkoztál");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("snooze sends only the current goal and presents confirmation in English", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", request);
    render(<FollowupActions id="owned-goal" locale="en" />);
    await userEvent.click(screen.getByRole("button", { name: "Remind me in a week" }));
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ id: "owned-goal", action: "snooze" });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("snoozed for a week"));
  });

  it("preview mode shows the message but disables sending", async () => {
    const copy = { hu: { title: "Kérj visszajelzést", body: "Saját eredményed elkészült.", cta: "Meghívás" }, en: { title: "Ask for feedback", body: "Your results are ready.", cta: "Invite" } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mode: "preview", rows: [{ id: "g", rule: "INVITE_FIRST_OBSERVERS", status: "OPEN", reason: "READY", dueAt: "2026-09-26T00:00:00Z", count: 0, locale: "hu", profile: { email: "person@example.com", username: "Person" }, copy }], recent: [], completed: [], run: null, nextCursor: null }) }));
    render(<AdminLifecycleSection />);
    expect(await screen.findByRole("button", { name: "Emlékeztető küldése" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Levélelőnézet" }));
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Előnézet nyelve" }), "en");
    expect(screen.getByText("Your results are ready.")).toBeInTheDocument();
  });
});
