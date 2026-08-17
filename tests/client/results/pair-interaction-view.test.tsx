import { render, screen, waitFor } from "@testing-library/react";
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
    {
      atomId: "easy-2",
      dimLabels: ["Barátságosság"],
      text: "Konfliktusban is megmaradtok tárgyilagosnak.",
    },
  ],
  friction: [
    {
      atomId: "friction-1",
      dimLabels: ["Lelkiismeretesség"],
      text: "Más ritmusban hozhatjátok meg a döntéseket.",
    },
    {
      atomId: "friction-2",
      dimLabels: ["Emocionalitás"],
      text: "A visszajelzés élességét máshol húzzátok meg.",
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

function renderView(simulation: PairSimulationView = sim) {
  return render(
    <PairInteractionView
      self={self}
      other={other}
      otherName="Anna"
      sim={simulation}
    />,
  );
}

describe("PairInteractionView", () => {
  it("mobilbarát közös vásznon mutatja a két profilt és az első összképet", () => {
    renderView();

    expect(screen.getAllByTestId("type-glyph")).toHaveLength(2);
    expect(screen.getByText("Két valódi önértékelés")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Közös kép" })).toBeInTheDocument();
    expect(screen.getByText("Ami összeköt")).toBeInTheDocument();
    expect(screen.getByText("Amire figyeljetek")).toBeInTheDocument();
  });

  it("a nevet olvasható méretben, nem verzál mikro-címkeként írja ki", () => {
    renderView();

    const name = screen.getByText("Anna");
    expect(name.className).toContain("text-caption");
    expect(name.className).not.toContain("text-micro");
    expect(name.className).not.toContain("uppercase");
  });

  it("nem ismétli meg a „Közös kép” mondatait a nyitott panelben", () => {
    renderView();

    // A motor max 3 atomot ad: ha a panel is a teljes listát hozná, a
    // nyitott első panel szó szerint megismételné a fentebb olvasott sort.
    expect(
      screen.getAllByText("Gyorsan megértitek egymás szándékát."),
    ).toHaveLength(1);
    expect(
      screen.getAllByText("Más ritmusban hozhatjátok meg a döntéseket."),
    ).toHaveLength(1);
    // Ami a összképen túl van, az a panelben nyílik.
    expect(
      screen.getByText("Konfliktusban is megmaradtok tárgyilagosnak."),
    ).toBeInTheDocument();
  });

  it("elhagyja azt a panelt, aminek a közös képen túl nincs több mondata", () => {
    renderView({
      ...sim,
      easy: [sim.easy[0]],
      friction: [sim.friction[0]],
    });

    expect(
      screen.queryByRole("button", { name: /Ami magától megy/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Ahol súrlódás várható/ }),
    ).not.toBeInTheDocument();
    // A megmaradt blokk 1-es sorszámmal indul — nincs lyuk a számozásban.
    const discuss = screen.getByRole("button", {
      name: /Mit beszéljetek meg előre/,
    });
    expect(discuss).toHaveTextContent("1");
    expect(discuss).toHaveAttribute("aria-expanded", "true");
  });

  it("egyszerre egy részletes blokkot nyitva tart, a többit összecsukja", async () => {
    const user = userEvent.setup();
    renderView();

    const easy = screen.getByRole("button", { name: /Ami magától megy/ });
    const friction = screen.getByRole("button", {
      name: /Ahol súrlódás várható/,
    });

    expect(easy).toHaveAttribute("aria-expanded", "true");
    expect(friction).toHaveAttribute("aria-expanded", "false");

    await user.click(friction);

    expect(easy).toHaveAttribute("aria-expanded", "false");
    expect(friction).toHaveAttribute("aria-expanded", "true");
  });

  it("névvel egyértelműsíti a vezetői irányt és megmutatja a kapcsolódó jegyzetet", async () => {
    const user = userEvent.setup();
    renderView();

    const relation = screen.getByRole("button", {
      name: /Kapcsolatotok Egyenrangú kapcsolat/,
    });
    expect(relation).toHaveAttribute("aria-haspopup", "listbox");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(relation);
    expect(screen.getByRole("listbox", { name: "Kapcsolatotok" })).toBeInTheDocument();

    await user.click(
      screen.getByRole("option", { name: "Anna vezet vagy mentorál engem" }),
    );

    expect(
      screen.getByText("Anna vezetőként teret ad a közös mérlegelésnek."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("a választó mellé teszi a tőle függő vezetői jegyzetet, live-regionben", async () => {
    const user = userEvent.setup();
    renderView();

    // A jegyzet a választó UTÁN, de a „Közös kép” ELŐTT áll: a user a
    // vezetői irány átállítása után lát is változást a képernyőn.
    const live = document.querySelector("[aria-live='polite']");
    expect(live).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: /Kapcsolatotok Egyenrangú kapcsolat/ }),
    );
    await user.click(
      screen.getByRole("option", { name: "Anna vezet vagy mentorál engem" }),
    );

    expect(live).toHaveTextContent(
      "Anna vezetőként teret ad a közös mérlegelésnek.",
    );

    const sharedPicture = screen.getByRole("heading", { name: "Közös kép" });
    expect(
      live!.compareDocumentPosition(sharedPicture) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("billentyűzettel is végigjárhatóvá teszi az egyedi kapcsolatválasztót", async () => {
    const user = userEvent.setup();
    renderView();

    const relation = screen.getByRole("button", {
      name: /Kapcsolatotok Egyenrangú kapcsolat/,
    });
    relation.focus();
    await user.keyboard("{ArrowDown}");

    const peer = screen.getByRole("option", { name: "Egyenrangú kapcsolat" });
    expect(peer).toHaveFocus();

    await user.keyboard("{ArrowDown}{Enter}");

    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /Kapcsolatotok Anna vezet vagy mentorál engem/,
        }),
      ).toHaveFocus(),
    );
    expect(
      screen.getByText("Anna vezetőként teret ad a közös mérlegelésnek."),
    ).toBeInTheDocument();
  });

  it("Tabbal a triggerre adja vissza a fókuszt, nem a body-ra", async () => {
    const user = userEvent.setup();
    renderView();

    const relation = screen.getByRole("button", {
      name: /Kapcsolatotok Egyenrangú kapcsolat/,
    });
    relation.focus();
    await user.keyboard("{ArrowDown}");
    expect(
      screen.getByRole("option", { name: "Egyenrangú kapcsolat" }),
    ).toHaveFocus();

    await user.keyboard("{Tab}");

    await waitFor(() => expect(relation).toHaveFocus());
    expect(document.body).not.toHaveFocus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
