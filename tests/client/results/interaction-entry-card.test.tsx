import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InteractionEntryCard } from "@/components/results/InteractionEntryCard";

vi.mock("@/components/type/TypeGlyph", () => ({
  TypeGlyph: ({ typeLabel }: { typeLabel: string }) => <div>{typeLabel}</div>,
}));

const dimensions = [
  { code: "O", score: 82 },
  { code: "X", score: 74 },
  { code: "C", score: 55 },
];

describe("InteractionEntryCard", () => {
  it("új kapcsolatnál külön valódi és karakteres belépőt ad", () => {
    render(
      <InteractionEntryCard
        dimensions={dimensions}
        personalityType="Újító"
        preview={{ state: "new" }}
        locale="hu"
      />,
    );

    expect(screen.getByRole("heading", { name: "Mi történik, amikor két profil találkozik?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Összehasonlítok valakivel" })).toHaveAttribute(
      "href",
      "/interaction?mode=real",
    );
    expect(screen.getByRole("link", { name: "Kipróbálom egy karakterrel" })).toHaveAttribute(
      "href",
      "/interaction?mode=type",
    );
  });

  it("függő meghívásnál névvel jelzi a várakozást", () => {
    render(
      <InteractionEntryCard
        dimensions={dimensions}
        personalityType="Újító"
        preview={{ state: "pending", otherName: "Dani" }}
        locale="hu"
      />,
    );

    expect(screen.getByText("Dani válaszára vár")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Meghívás megnyitása" })).toHaveAttribute(
      "href",
      "/interaction?mode=real",
    );
  });

  it("kész kapcsolatnál közvetlenül a páros képet nyitja", () => {
    render(
      <InteractionEntryCard
        dimensions={dimensions}
        personalityType="Újító"
        preview={{
          state: "ready",
          otherName: "Dani",
          pairId: "pair 1",
          otherGlyph: {
            primaryCode: "A",
            secondaryCode: "H",
            intensity: 4,
            label: "Hídépítő",
          },
        }}
        locale="hu"
      />,
    );

    expect(screen.getByText("Dani készen áll")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Közös kép megnyitása" })).toHaveAttribute(
      "href",
      "/interaction?pair=pair%201",
    );
  });
});
