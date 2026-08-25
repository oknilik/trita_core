import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TeamFeedbackHub } from "@/components/team/TeamFeedbackHub";

vi.mock("@/components/team/TeamKudos", () => ({
  TeamKudos: ({ view, showHeader }: { view?: string; showHeader?: boolean }) => (
    <div data-testid="kudos-view">kudos:{view}:{String(showHeader)}</div>
  ),
}));

vi.mock("@/components/team/TeamFeedbackRequests", () => ({
  TeamFeedbackRequests: ({ view, showHeader }: { view?: string; showHeader?: boolean }) => (
    <div data-testid="request-view">request:{view}:{String(showHeader)}</div>
  ),
}));

const props = {
  teamId: "team-1",
  members: [
    { userId: "me", displayName: "Dániel" },
    { userId: "reka", displayName: "Aurora Réka" },
  ],
  locale: "hu" as const,
};

describe("TeamFeedbackHub", () => {
  it("két egyértelmű szándékból indítja a visszajelzési folyamatot", async () => {
    const user = userEvent.setup();
    render(<TeamFeedbackHub {...props} />);

    expect(screen.getByRole("heading", { name: "Mit szeretnél tenni?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Köszönetet küldök/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Visszajelzést kérek/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Köszönetet küldök/ }));

    expect(screen.getByRole("heading", { name: "Köszönetet küldök" })).toBeInTheDocument();
    expect(screen.getByTestId("kudos-view")).toHaveTextContent("kudos:compose:false");
    expect(screen.queryByTestId("request-view")).not.toBeInTheDocument();
  });

  it("a közös beérkező nézetben mindkét ág eredményeit eléri", async () => {
    const user = userEvent.setup();
    render(<TeamFeedbackHub {...props} />);

    await user.click(screen.getByRole("button", { name: "Beérkezett visszajelzések megnyitása" }));

    expect(screen.getByRole("heading", { name: "Beérkezett neked" })).toBeInTheDocument();
    expect(screen.getByTestId("kudos-view")).toHaveTextContent("kudos:inbox:undefined");
    expect(screen.getByTestId("request-view")).toHaveTextContent("request:inbox:undefined");

    await user.click(screen.getByRole("button", { name: "Központ" }));
    expect(screen.getByRole("heading", { name: "Mit szeretnél tenni?" })).toBeInTheDocument();
  });
});
