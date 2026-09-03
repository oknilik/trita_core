import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FocusedLandingContent } from "@/components/landing/FocusedLandingContent";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

vi.mock("@/lib/analytics/client", () => ({
  track: vi.fn(),
}));

describe("fókuszált főoldal", () => {
  it("egyetlen, egyéni ígérettel nyit, és korán megmutatja a profilt", () => {
    const { container } = render(<FocusedLandingContent />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "~10 perc, és jobban megérted, hogyan működsz.",
    );
    expect(container.querySelector("[data-focused-profile-preview]")).not.toBeNull();
    expect(screen.getByText("Péter")).toBeInTheDocument();
    expect(screen.getByText("Hídépítő")).toBeInTheDocument();
    expect(screen.getAllByText("Csapatsegítő").length).toBeGreaterThan(0);
    expect(screen.getByText("Valószínű csapatszerepeid")).toBeInTheDocument();
    expect(screen.getByText("A pontos képhez külön csapatszerep-kérdőív tartozik.")).toBeInTheDocument();
    const primaryRole = container.querySelector('[data-role-rank="primary"]');
    const secondaryRole = container.querySelector('[data-role-rank="secondary"]');
    expect(primaryRole).not.toBeNull();
    expect(secondaryRole).not.toBeNull();
    expect(primaryRole?.className).not.toBe(secondaryRole?.className);
    expect(screen.queryByRole("link", { name: /csapatom/i })).not.toBeInTheDocument();
  });

  it("a teszthez és a külön csapatos oldalhoz vezet", () => {
    render(<FocusedLandingContent />);

    expect(screen.getByRole("link", { name: "Elindítom az ingyenes tesztet" })).toHaveAttribute(
      "href",
      "/try",
    );
    expect(screen.getByRole("link", { name: "Megnézem a csapatprogramot" })).toHaveAttribute(
      "href",
      "/team-dynamics",
    );
  });

  it("a visszajelzés szerinti tömör sorrendet rendereli", () => {
    const { container } = render(<FocusedLandingContent />);

    expect(screen.getByRole("heading", { name: "Három lépés. Ennyi." })).toBeInTheDocument();
    expect(
      container.querySelector("[data-focused-brand-mark] svg"),
    ).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Csapatként folytatnátok?" })).toBeInTheDocument();
    expect(container.querySelector("[data-focused-team-preview]")).not.toBeNull();
    expect(screen.getByText("Értékesítés")).toBeInTheDocument();
    expect(screen.getByText("Családi Vállalkozás")).toBeInTheDocument();
    expect(screen.getByText("Két nézőpont, egy csapatkép")).toBeInTheDocument();
    expect(screen.getByText("Csapatátlag – egyéni értékek nem jelennek meg.")).toBeInTheDocument();
    expect(screen.getByText("Tanácsadói értékelés")).toBeInTheDocument();
    expect(screen.getByText("Tudományos alap")).toBeInTheDocument();
    expect(screen.getByText("Érthető eredmény")).toBeInTheDocument();
    expect(screen.getByText("Saját tempóban")).toBeInTheDocument();
  });
});
