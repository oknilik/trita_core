import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InteractionComparisonChooser } from "@/components/results/InteractionComparisonChooser";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu" }),
}));

vi.mock("@/components/results/CompareInviteCard", () => ({
  CompareInviteCard: () => <div data-testid="real-person-route">Valódi kapcsolatok</div>,
}));

vi.mock("@/components/results/InteractionSection", () => ({
  InteractionSection: () => <div data-testid="type-route">Karakterválasztó</div>,
}));

describe("InteractionComparisonChooser", () => {
  it("a valódi személyes utat mutatja alapból, majd karakterre váltható", async () => {
    const user = userEvent.setup();
    render(
      <InteractionComparisonChooser
        invites={[]}
        simulations={[]}
      />,
    );

    const real = screen.getByRole("button", { name: /Valódi személlyel/ });
    const type = screen.getByRole("button", { name: /Karakterrel kipróbálom/ });

    expect(real).toHaveAttribute("aria-pressed", "true");
    expect(type).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("real-person-route")).toBeInTheDocument();
    expect(screen.queryByTestId("type-route")).not.toBeInTheDocument();

    await user.click(type);

    expect(real).toHaveAttribute("aria-pressed", "false");
    expect(type).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByTestId("real-person-route")).not.toBeInTheDocument();
    expect(screen.getByTestId("type-route")).toBeInTheDocument();
  });
});
