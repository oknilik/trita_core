import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PairInteractionView } from "@/components/results/PairInteractionView";
import type { PairSimulationView } from "@/lib/interaction-view";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu" }),
}));

vi.mock("@/components/type/TypeGlyph", () => ({
  TypeGlyph: ({ typeLabel }: { typeLabel: string }) => (
    <div data-testid="type-glyph">{typeLabel}</div>
  ),
}));

const sim: PairSimulationView = {
  easy: [
    {
      atomId: "easy-1",
      dimLabels: ["Nyitottság", "Extraverzió"],
      text: "Gyorsan megértitek egymás szándékát.",
    },
  ],
  friction: [
    {
      atomId: "friction-1",
      dimLabels: ["Lelkiismeretesség"],
      text: "Más ritmusban hozhatjátok meg a döntéseket.",
    },
  ],
  discuss: [
    {
      atomId: "discuss-1",
      dimLabels: ["Együttműködés"],
      text: "Egyezzetek meg a döntési tempóban.",
    },
  ],
  leaderNotesSelf: [
    {
      dim: "C",
      dimLabel: "Lelkiismeretesség",
      text: "Vezetőként mondd ki előre a kereteket.",
    },
  ],
  leaderNotesOther: [
    {
      dim: "A",
      dimLabel: "Együttműködés",
      text: "Anna vezetőként teret ad a közös mérlegelésnek.",
    },
  ],
  sparse: false,
};

const self = {
  primaryCode: "O",
  secondaryCode: "C",
  intensity: 4,
  label: "Módszeres újító",
};

const other = {
  primaryCode: "A",
  secondaryCode: "E",
  intensity: 3,
  label: "Empatikus hídépítő",
};

describe("PairInteractionView", () => {
  it("mobilbarát közös vásznon mutatja a két profilt és az első összképet", () => {
    render(
      <PairInteractionView
        self={self}
        other={other}
        otherName="Anna"
        sim={sim}
      />,
    );

    expect(screen.getAllByTestId("type-glyph")).toHaveLength(2);
    expect(screen.getByText("Két valódi önértékelés")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Közös kép" })).toBeInTheDocument();
    expect(screen.getByText("Ami összeköt")).toBeInTheDocument();
    expect(screen.getByText("Amire figyeljetek")).toBeInTheDocument();
  });

  it("egyszerre egy részletes blokkot nyitva tart, a többit összecsukja", async () => {
    const user = userEvent.setup();
    render(
      <PairInteractionView
        self={self}
        other={other}
        otherName="Anna"
        sim={sim}
      />,
    );

    const easy = screen.getByRole("button", { name: "Ami magától megy" });
    const friction = screen.getByRole("button", {
      name: "Ahol súrlódás várható",
    });

    expect(easy).toHaveAttribute("aria-expanded", "true");
    expect(friction).toHaveAttribute("aria-expanded", "false");

    await user.click(friction);

    expect(easy).toHaveAttribute("aria-expanded", "false");
    expect(friction).toHaveAttribute("aria-expanded", "true");
  });

  it("névvel egyértelműsíti a vezetői irányt és megmutatja a kapcsolódó jegyzetet", async () => {
    const user = userEvent.setup();
    render(
      <PairInteractionView
        self={self}
        other={other}
        otherName="Anna"
        sim={sim}
      />,
    );

    const relation = screen.getByRole("combobox");
    expect(
      screen.getByRole("option", { name: "Anna vezet engem" }),
    ).toBeInTheDocument();

    await user.selectOptions(relation, "other-leads");

    expect(
      screen.getByText("Anna vezetőként teret ad a közös mérlegelésnek."),
    ).toBeInTheDocument();
  });
});
