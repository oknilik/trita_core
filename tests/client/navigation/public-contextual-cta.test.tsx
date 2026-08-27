import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NavBar } from "@/components/NavBar";
import { setSiteModePreview } from "@/components/landing/site-mode";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

vi.mock("@/components/auth/auth-state", () => ({
  useAuthState: () => ({ isSignedIn: false }),
}));

vi.mock("@/components/LanguageSwitcher", () => ({ LanguageSwitcher: () => null }));
vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => null }));
vi.mock("@/components/UserMenu", () => ({ UserMenu: () => null }));

describe("publikus fejléc — landing kontextusú CTA", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    window.scrollTo = vi.fn();
    Object.defineProperty(window, "scrollY", { configurable: true, writable: true, value: 0 });
    window.localStorage.clear();
  });

  afterEach(() => {
    act(() => setSiteModePreview(null));
    window.history.replaceState({}, "", "/");
  });

  it("egyéni módban a mérésre, csapatmódban a pilotprogramra visz", () => {
    render(<NavBar />);

    const selfCtas = screen.getAllByRole("link", { name: "Kipróbálom" });
    expect(selfCtas.every((link) => link.getAttribute("href") === "/try")).toBe(true);

    act(() => setSiteModePreview("team"));

    const teamCtas = screen.getAllByRole("link", { name: "Pilotprogram" });
    expect(teamCtas.every((link) => link.getAttribute("href") === "/pilot")).toBe(true);
  });

  it("a blogot asztali és mobil navigációban is elérhetővé teszi", () => {
    render(<NavBar />);

    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("href", "/blog");

    fireEvent.click(screen.getByRole("button", { name: "Menü" }));
    const blogLinks = screen.getAllByRole("link", { name: "Blog" });
    expect(blogLinks).toHaveLength(2);
    expect(blogLinks.every((link) => link.getAttribute("href") === "/blog")).toBe(true);
  });

  it("görgetés közben is teljes kapszulaként látható marad", () => {
    render(<NavBar />);

    const header = screen.getByTestId("public-nav-header");
    expect(header).toHaveAttribute("data-compact", "false");

    window.scrollY = 120;
    fireEvent.scroll(window);
    expect(header).toHaveAttribute("data-compact", "false");
    expect(screen.getByRole("link", { name: "trita" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Menü" })).toBeVisible();
  });
});
