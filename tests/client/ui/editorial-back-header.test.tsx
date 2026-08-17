import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditorialBackHeader } from "@/components/ui/primitives/EditorialBackHeader";

describe("EditorialBackHeader", () => {
  it("a visszautat az editorial fejrészbe integrált linkként mutatja", () => {
    render(
      <EditorialBackHeader
        href="/interaction"
        backLabel="Vissza az összehasonlításokhoz"
        eyebrow="Összehasonlítások"
        title="Te és Dani"
        description="Így találkozik a működésetek."
      />,
    );

    expect(
      screen.getByRole("link", { name: "Vissza az összehasonlításokhoz" }),
    ).toHaveAttribute("href", "/interaction");
    expect(screen.getByRole("heading", { level: 1, name: "Te és Dani" })).toBeInTheDocument();
    expect(screen.getByText("Összehasonlítások")).toBeInTheDocument();
  });

  it("belső nézetből gombként hívja meg a visszalépést", async () => {
    const onBack = vi.fn();
    render(
      <EditorialBackHeader
        onBack={onBack}
        backLabel="Vissza az összképhez"
        eyebrow="A teljes riportod"
        title="Minden részlet, tiszta fejezetekben."
        headingLevel={2}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Vissza az összképhez" }),
    );

    expect(onBack).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Minden részlet, tiszta fejezetekben.",
      }),
    ).toBeInTheDocument();
  });
});
