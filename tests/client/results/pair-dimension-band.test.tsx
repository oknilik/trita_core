import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PairDimensionBand } from "@/components/results/PairDimensionBand";
import { PairFacetNuances } from "@/components/results/PairFacetNuances";
import type {
  PairDimensionView,
  PairFacetNuanceView,
} from "@/lib/interaction-view";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu" }),
}));

const ROWS: PairDimensionView[] = [
  { dim: "H", dimLabel: "Becsületesség-Alázat", state: "differs", higher: "self" },
  { dim: "E", dimLabel: "Emocionalitás", state: "differs", higher: "other" },
  { dim: "X", dimLabel: "Extraverzió", state: "aligned", higher: null },
  { dim: "A", dimLabel: "Barátságosság", state: "aligned", higher: null },
  { dim: "C", dimLabel: "Lelkiismeretesség", state: "differs", higher: "self" },
  { dim: "O", dimLabel: "Nyitottság", state: "aligned", higher: null },
];

describe("PairDimensionBand", () => {
  it("mind a hat dimenziót kirakja", () => {
    render(<PairDimensionBand rows={ROWS} otherName="Anna" />);
    for (const row of ROWS) {
      expect(screen.getByText(row.dimLabel)).toBeInTheDocument();
    }
  });

  it("az egyezést és a két eltérés-irányt külön címkézi", () => {
    render(<PairDimensionBand rows={ROWS} otherName="Anna" />);
    expect(screen.getAllByText("Nálad magasabb")).toHaveLength(2);
    expect(screen.getAllByText("Nála magasabb")).toHaveLength(1);
    expect(screen.getAllByText("Hasonló")).toHaveLength(3);
  });

  it("a nevet a feloldó sorban mondja ki, nem ragozva a soron belül", () => {
    // A magyar ragozás miatt a sor a semleges „nála" alakot használja — a
    // névhez kötés egyszer, a legendában történik.
    render(<PairDimensionBand rows={ROWS} otherName="Anna" />);
    expect(screen.getByText(/„Nála” = Anna/)).toBeInTheDocument();
  });

  it("ADATVÉDELEM: egyetlen pontszám sem jelenik meg", () => {
    const { container } = render(
      <PairDimensionBand rows={ROWS} otherName="Anna" />,
    );
    // A módszertani jegyzet szövegében sincs szám, tehát a teljes sáv
    // számjegy-mentes — ez a legszigorúbb ellenőrzés, amit itt megtehetünk.
    expect(container.textContent ?? "").not.toMatch(/\d/);
  });

  it("üres bemenetre nem renderel keretet", () => {
    const { container } = render(<PairDimensionBand rows={[]} otherName="Anna" />);
    expect(container).toBeEmptyDOMElement();
  });
});

const NUANCES: PairFacetNuanceView[] = [
  {
    dim: "C",
    dimLabel: "Lelkiismeretesség",
    facet: "organization",
    facetLabel: "Szervezettség",
    higher: "self",
    kind: "nuance",
  },
  {
    dim: "X",
    dimLabel: "Extraverzió",
    facet: "sociability",
    facetLabel: "Társaságkedvelés",
    higher: "other",
    kind: "driver",
  },
];

describe("PairFacetNuances", () => {
  it("az alskála nevét és a dimenziót is kiírja", () => {
    render(<PairFacetNuances rows={NUANCES} />);
    expect(screen.getByText("Szervezettség")).toBeInTheDocument();
    expect(screen.getByText("Lelkiismeretesség")).toBeInTheDocument();
  });

  it("a két fajtát KÜLÖN blokkban mutatja", () => {
    // Az attribúció („hol fut az eltérés") és az önálló állítás („azonos
    // címke, más működés") episztemikusan más — egy listába keverve a
    // gyengébbik státusza a másikra is átragadna.
    render(<PairFacetNuances rows={NUANCES} />);
    expect(screen.getByText("Hol fut az eltérés")).toBeInTheDocument();
    expect(screen.getByText("Azonos címke, más működés")).toBeInTheDocument();
    expect(screen.getByText("Társaságkedvelés")).toBeInTheDocument();
  });

  it("csak a jelen lévő fajtának ad címet", () => {
    render(<PairFacetNuances rows={NUANCES.filter((row) => row.kind === "nuance")} />);
    expect(screen.queryByText("Hol fut az eltérés")).not.toBeInTheDocument();
    expect(screen.getByText("Azonos címke, más működés")).toBeInTheDocument();
  });

  it("kimondja, hogy ez a legbizonytalanabb réteg", () => {
    // A becsült/mért megkülönböztetés a termék hitelességi alapelve: a
    // gyenge mérést jelölni kell, nem elrejteni.
    render(<PairFacetNuances rows={NUANCES} />);
    expect(screen.getByText(/legbizonytalanabb réteg/)).toBeInTheDocument();
  });

  it("nüansz nélkül nem renderel szekciót", () => {
    const { container } = render(<PairFacetNuances rows={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
