import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "@/components/ui/primitives/Card";
import { InlineBanner } from "@/components/ui/primitives/InlineBanner";

describe("feluleti primitivek", () => {
  it("a Card kozos sugarat, keretet, arnyekot es terkozt ad", () => {
    render(
      <Card as="section" spacing="lg">
        Csapat attekintes
      </Card>,
    );

    const card = screen.getByText("Csapat attekintes");
    expect(card.tagName).toBe("SECTION");
    expect(card).toHaveClass("rounded-[var(--ui-radius-2xl)]");
    expect(card).toHaveClass("border-border-default");
    expect(card).toHaveClass("shadow-[var(--ui-shadow-sm)]");
    expect(card).toHaveClass("p-[var(--ui-space-card-padding-lg)]");
  });

  it("az InlineBanner bal oldali allapot-akcentet es helyes elo szerepet ad", () => {
    const { rerender } = render(
      <InlineBanner variant="success">Eleg adat all rendelkezesre</InlineBanner>,
    );

    const success = screen.getByRole("status");
    expect(success).toHaveClass("border-l-[3px]");
    expect(success).toHaveClass("rounded-r-[var(--ui-radius-xl)]");
    expect(success).toHaveClass("border-state-success-border");

    rerender(<InlineBanner variant="error">Nem sikerult menteni</InlineBanner>);
    expect(screen.getByRole("alert")).toHaveClass("border-state-error-border");
  });
});
