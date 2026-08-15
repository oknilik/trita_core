import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/ThemeToggle";

const setPreference = vi.hoisted(() => vi.fn());

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu" }),
}));

vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({
    preference: "system",
    resolved: "dark",
    setPreference,
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    setPreference.mockClear();
  });

  it("menüben közvetlenül mutatja mindhárom megjelenési módot", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    expect(screen.getByRole("radiogroup", { name: "Megjelenés" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Rendszerbeállítás" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await user.click(screen.getByRole("radio", { name: "Sötét" }));
    expect(setPreference).toHaveBeenCalledWith("dark");
  });

  it("kompakt módban csak szándékos kattintásra nyitja ki a választót", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle variant="compact" />);

    const trigger = screen.getByRole("button", {
      name: "Megjelenés: Rendszerbeállítás",
    });
    expect(screen.queryByRole("dialog", { name: "Megjelenés" })).not.toBeInTheDocument();

    await user.click(trigger);

    expect(screen.getByRole("dialog", { name: "Megjelenés" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Világos" }));

    expect(setPreference).toHaveBeenCalledWith("light");
    expect(screen.queryByRole("dialog", { name: "Megjelenés" })).not.toBeInTheDocument();
  });

  it("Escape-pel bezárható és visszaadja a fókuszt a nyitógombnak", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle variant="compact" />);

    const trigger = screen.getByRole("button", {
      name: "Megjelenés: Rendszerbeállítás",
    });
    await user.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Megjelenés" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
