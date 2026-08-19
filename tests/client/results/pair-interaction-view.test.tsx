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

// A motor egy ATOMBÓL állítja elő az easy/friction/discuss sorokat, MIND
// ugyanazzal az atomId-vel. A fixture ezt követi: három atom (a1–a3), amiből
// a1 mindhárom blokkot adja, a2 csak easy+discuss, a3 csak friction+discuss.
const sim: PairSimulationView = {
  easy: [
    {
      atomId: "a1",
      dimLabels: ["Nyitottság", "Extraverzió"],
      basis: "pole",
      text: "Gyorsan megértitek egymás szándékát.",
    },
    {
      atomId: "a2",
      dimLabels: ["Barátságosság"],
      basis: "pole",
      text: "Konfliktusban is megmaradtok tárgyilagosnak.",
    },
  ],
  friction: [
    {
      atomId: "a1",
      dimLabels: ["Lelkiismeretesség"],
      basis: "pole",
      text: "Más ritmusban hozhatjátok meg a döntéseket.",
    },
    {
      atomId: "a3",
      dimLabels: ["Emocionalitás"],
      basis: "pole",
      text: "A visszajelzés élességét máshol húzzátok meg.",
    },
  ],
  discuss: [
    {
      atomId: "a1",
      dimLabels: ["Együttműködés"],
      basis: "pole",
      text: "Egyezzetek meg a döntési tempóban.",
    },
    {
      atomId: "a2",
      dimLabels: ["Barátságosság"],
      basis: "pole",
      text: "Beszéljétek meg, mikor kell élesebb visszajelzés.",
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
  dimensions: [
    { dim: "H", dimLabel: "Becsületesség-Alázat", state: "aligned", higher: null },
    { dim: "E", dimLabel: "Emocionalitás", state: "differs", higher: "other" },
    { dim: "X", dimLabel: "Extraverzió", state: "differs", higher: "self" },
    { dim: "A", dimLabel: "Barátságosság", state: "aligned", higher: null },
    { dim: "C", dimLabel: "Lelkiismeretesség", state: "differs", higher: "self" },
    { dim: "O", dimLabel: "Nyitottság", state: "aligned", higher: null },
  ],
  facetNuances: [
    {
      dim: "A",
      dimLabel: "Barátságosság",
      facet: "patience",
      facetLabel: "Türelem",
      higher: "other",
      kind: "nuance",
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

/** Egyetlen markáns pont: mindhárom sor ugyanabból az atomból jön. */
const singleAtomSim: PairSimulationView = {
  ...sim,
  easy: [sim.easy[0]],
  friction: [sim.friction[0]],
  discuss: [sim.discuss[0]],
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

  it("a hat dimenziós sávot és a facet-nüanszt a próza UTÁN mutatja", () => {
    // A próza válogat (max 4 atom), a sáv mind a hatról nyilatkozik — enélkül
    // a „megnéztük, és nincs róla mit mondani" eset hibának látszana.
    render(<PairInteractionView self={self} other={other} otherName="Anna" sim={sim} />);
    expect(screen.getByText("Mind a hat dimenzió")).toBeInTheDocument();
    expect(screen.getByText("Azonos címke, más működés")).toBeInTheDocument();
    expect(screen.getByText("Türelem")).toBeInTheDocument();
  });

  it("a rés-alapú sort „Mérhető különbség”-ként jelöli, a pólusosat nem", () => {
    // Becsült vs mért: a gyengébb bizonyítékon álló sort jelölni kell.
    const gapSim = {
      ...sim,
      easy: [{ ...sim.easy[0], basis: "gap" as const }],
      friction: [],
      discuss: [{ ...sim.discuss[0], basis: "pole" as const }],
    };
    render(
      <PairInteractionView self={self} other={other} otherName="Anna" sim={gapSim} />,
    );
    expect(screen.getAllByText(/Mérhető különbség/).length).toBeGreaterThan(0);
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

  it("egyetlen markáns pontnál nem accordiont épít, hanem nyitott blokkot", () => {
    // Egy atom: a közös kép elviszi az easy/friction első sorát, és csak a
    // „mit beszéljetek meg" marad. Sorszámozott, összecsukható panel ilyenkor
    // csak apparátus — kevesebbnek MUTATJA a tartalmat, mint amennyi.
    renderView(singleAtomSim);

    expect(screen.queryByRole("button", { name: /Ami magától megy/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Mit beszéljetek meg előre/ }),
    ).not.toBeInTheDocument();

    // A tartalom viszont ott van, címmel és nyitva.
    expect(
      screen.getByRole("heading", { name: "Mit beszéljetek meg előre" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Egyezzetek meg a döntési tempóban."),
    ).toBeInTheDocument();
  });

  it("kimondja, ha a pár egyetlen markáns ponton tér el", () => {
    renderView(singleAtomSim);

    // A karakter-prototípus maximálisan pólusos, egy valódi ember nem —
    // enélkül a rövid kép hibának látszik a karakter-úthoz képest.
    expect(
      screen.getByText(/egyetlen markáns ponton tér el/),
    ).toBeInTheDocument();
  });

  it("két markáns pont felett viszont accordiont épít, sorszámmal", () => {
    renderView();

    const easy = screen.getByRole("button", { name: /Ami magától megy/ });
    expect(easy).toHaveTextContent("1");
    expect(easy).toHaveAttribute("aria-expanded", "true");
    // Rövid képre szánt magyarázat itt nem jelenik meg.
    expect(
      screen.queryByText(/egyetlen markáns ponton tér el/),
    ).not.toBeInTheDocument();
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
