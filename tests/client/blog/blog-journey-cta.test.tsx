import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlogJourneyCta } from "@/components/blog/BlogJourneyCta";
import { ServerAuthStateProvider } from "@/components/auth/auth-state";

function renderCta(isSignedIn: boolean) {
  return render(
    <ServerAuthStateProvider isSignedIn={isSignedIn}>
      <BlogJourneyCta locale="hu" variant="banner" />
      <BlogJourneyCta locale="hu" variant="sidebar" />
    </ServerAuthStateProvider>,
  );
}

describe("BlogJourneyCta", () => {
  it("kijelentkezve a kipróbálási útvonalat kínálja", () => {
    renderCta(false);

    const links = screen.getAllByRole("link", { name: "Teszt indítása" });
    expect(links).toHaveLength(2);
    expect(links.every((link) => link.getAttribute("href") === "/try")).toBe(true);
  });

  it("belépve a személyre szabott felületre visz, nem új tesztet indít", () => {
    renderCta(true);

    const links = screen.getAllByRole("link", { name: "Saját felület megnyitása" });
    expect(links).toHaveLength(2);
    expect(links.every((link) => link.getAttribute("href") === "/dashboard")).toBe(true);
    expect(screen.queryByText("Próbáld ki")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Teszt indítása" })).not.toBeInTheDocument();
  });
});
