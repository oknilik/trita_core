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

const acceptedInvite = {
  id: "inv-1",
  token: null,
  state: "ACCEPTED" as const,
  role: "inviter" as const,
  otherName: "Anna",
  createdAt: "2026-08-01T10:00:00.000Z",
  acceptedAt: "2026-08-02T10:00:00.000Z",
  expiresAt: "2026-09-01T10:00:00.000Z",
  otherGlyph: null,
};

describe("InteractionComparisonChooser", () => {
  it("elfogadott pár mellett a valódi utat nyitja meg, és karakterre váltható", async () => {
    const user = userEvent.setup();
    render(
      <InteractionComparisonChooser
        invites={[acceptedInvite]}
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

  it("elfogadott pár nélkül az azonnal használható karakter-utat nyitja meg", async () => {
    const user = userEvent.setup();
    render(<InteractionComparisonChooser invites={[]} simulations={[]} />);

    const real = screen.getByRole("button", { name: /Valódi személlyel/ });
    const type = screen.getByRole("button", { name: /Karakterrel kipróbálom/ });

    // Üres kapcsolatlista helyett az azonnal használható út a default — a
    // valódi út elvi elsősége a kártyák SORRENDJÉBEN marad meg.
    expect(type).toHaveAttribute("aria-pressed", "true");
    expect(real).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("type-route")).toBeInTheDocument();

    await user.click(real);

    expect(screen.getByTestId("real-person-route")).toBeInTheDocument();
  });

  it("a belépőkártya URL-je felülírhatja az adat alapú kezdő utat", () => {
    render(
      <InteractionComparisonChooser
        invites={[]}
        simulations={[]}
        initialRoute="real"
      />,
    );

    expect(screen.getByRole("button", { name: /Valódi személlyel/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("real-person-route")).toBeInTheDocument();
  });
});
