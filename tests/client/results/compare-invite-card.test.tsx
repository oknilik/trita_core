import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompareInviteCard } from "@/components/results/CompareInviteCard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu" }),
}));

describe("CompareInviteCard", () => {
  it("személy-központú szöveggel, másodlagos műveletként nyitja meg a meghívást", async () => {
    const user = userEvent.setup();
    render(<CompareInviteCard invites={[]} />);

    expect(
      screen.getByRole("heading", { name: "Válassz a kapcsolataid közül" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Valaki mással néznéd meg?")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Személy meghívása" }));

    expect(
      screen.getByPlaceholderText("email@pelda.hu (nem kötelező)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/rendszeresen közös helyzetekben vagytok/),
    ).toBeInTheDocument();
  });
});
