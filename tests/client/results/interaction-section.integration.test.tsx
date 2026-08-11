/**
 * InteractionSection client integration tests (Vitest + RTL)
 *
 * Az F3 szekció viselkedése valódi motor-kimeneten: a szimulációkat a
 * `buildArchetypeSimulations` állítja elő, tehát a teszt a teljes láncot
 * hajtja (motor → nézet-modell → felület), nem kézzel gyártott fixture-t.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InteractionSection } from "@/components/results/InteractionSection";
import { buildArchetypeSimulations } from "@/lib/interaction-view";
import {
  personalityAdjective,
  personalityNoun,
  resolvePersonalityTypeLabel,
} from "@/lib/personality-type";
import { t } from "@/lib/i18n";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

const MARKED_PROFILE = {
  INTE: 72,
  RESO: 40,
  TEMP: 30,
  ADAP: 78,
  THOR: 88,
  OPEN: 35,
};
const FLAT_PROFILE = {
  INTE: 50,
  RESO: 50,
  TEMP: 50,
  ADAP: 50,
  THOR: 50,
  OPEN: 50,
};

const marked = () => buildArchetypeSimulations(MARKED_PROFILE, "hu");
const flat = () => buildArchetypeSimulations(FLAT_PROFILE, "hu");

const hu = (key: string) => t(key, "hu");

// A választó ábra-csempékből áll: natív rádiógombok, `fieldset`+`legend`
// köré szervezve. A csempe elérhető neve a címke szövege (archetípus-név +
// dimenzió), ezért a nevek elején horgonyozunk.
const dominantGroup = () =>
  screen.getByRole("group", { name: hu("results.interactionPickDominant") });
const secondaryGroup = () =>
  screen.getByRole("group", { name: hu("results.interactionPickSecondary") });

// Érték szerint keresünk, nem elérhető név szerint: az ábra aria-label-je is
// a névbe folyik, és annak a szövege a glyph-nyelvtan változásával mozoghat.
const tileByValue = (group: HTMLElement, dim: string) =>
  within(group)
    .getAllByRole("radio")
    .find((radio) => (radio as HTMLInputElement).value === dim) as HTMLInputElement;

const dominantTile = (dim: string) => tileByValue(dominantGroup(), dim);
const secondaryTile = (dim: string) => tileByValue(secondaryGroup(), dim);

describe("InteractionSection", () => {
  it("nem renderel semmit szimulációk nélkül", () => {
    const { container } = render(<InteractionSection simulations={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("alapból egy tartalmas (nem sparse) archetípuson áll", () => {
    const sims = marked();
    render(<InteractionSection simulations={sims} />);

    const initial = sims.find((sim) => !sim.sparse)!;
    expect(screen.getByText(initial.label)).toBeInTheDocument();
    // A három blokk közül a discuss atomonként kötelező — ez a funkció magja.
    expect(screen.getByText(hu("results.interactionDiscuss"))).toBeInTheDocument();
    expect(
      screen.getByText(initial.discuss[0].text),
    ).toBeInTheDocument();
    // A sparse üzenet ilyenkor NEM jelenhet meg.
    expect(
      screen.queryByText(hu("results.interactionSparse")),
    ).not.toBeInTheDocument();
  });

  it("a hitelességi jegyzet mindig látszik", () => {
    render(<InteractionSection simulations={marked()} />);
    expect(
      screen.getByText(hu("results.interactionSourceNote")),
    ).toBeInTheDocument();
  });

  it("archetípus-váltás új tartalmat hoz, hálózat nélkül", async () => {
    const user = userEvent.setup();
    const sims = marked();
    render(<InteractionSection simulations={sims} />);

    await user.click(dominantTile("THOR"));
    await user.click(secondaryTile("INTE"));

    const expected = sims.find((sim) => sim.key === "THOR-INTE")!;
    expect(screen.getByText(expected.label)).toBeInTheDocument();
  });

  it("a második dimenzió sosem eshet egybe az elsővel", async () => {
    const user = userEvent.setup();
    render(<InteractionSection simulations={marked()} />);

    await user.click(secondaryTile("ADAP"));
    expect(secondaryTile("ADAP").checked).toBe(true);

    // A domináns ráállítása ugyanarra a dimenzióra: a második csempe eltűnik
    // a listából, és a kiválasztás átlép egy másikra.
    await user.click(dominantTile("ADAP"));
    expect(dominantTile("ADAP").checked).toBe(true);

    const secondaryRadios = within(secondaryGroup()).getAllByRole("radio");
    expect(secondaryRadios).toHaveLength(5);
    expect(secondaryRadios.map((radio) => (radio as HTMLInputElement).value)).not.toContain(
      "ADAP",
    );

    const checked = secondaryRadios.find((radio) => (radio as HTMLInputElement).checked)!;
    expect(
      marked().some(
        (sim) => sim.key === `ADAP-${(checked as HTMLInputElement).value}`,
      ),
    ).toBe(true);
  });

  it("a viszony-kapcsoló mutatja és elrejti a vezetői blokkot", async () => {
    const user = userEvent.setup();
    const sims = marked();
    render(<InteractionSection simulations={sims} />);

    const initial = sims.find((sim) => !sim.sparse)!;
    expect(initial.leaderNotes.length).toBeGreaterThan(0);

    const peer = screen.getByRole("button", {
      name: hu("results.interactionRelationPeer"),
    });
    const leader = screen.getByRole("button", {
      name: hu("results.interactionRelationLeader"),
    });

    // Alapból egyenrangú viszony — a vezetői blokk rejtve.
    expect(peer).toHaveAttribute("aria-pressed", "true");
    expect(leader).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.queryByText(hu("results.interactionLeaderTitle")),
    ).not.toBeInTheDocument();

    await user.click(leader);
    expect(leader).toHaveAttribute("aria-pressed", "true");
    expect(peer).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByText(hu("results.interactionLeaderTitle")),
    ).toBeInTheDocument();
    expect(screen.getByText(initial.leaderNotes[0].text)).toBeInTheDocument();

    await user.click(peer);
    expect(
      screen.queryByText(hu("results.interactionLeaderTitle")),
    ).not.toBeInTheDocument();
  });

  // S3-hedge (motor-audit v4, FIX 5): főnév-only saját címkénél (a top-pár
  // sorrendje a mérési hibán belül) a „Melléknév + Főnév" összeállítás-sor
  // nem állíthatja a második dimenziót — a sor elmarad.
  it("főnév-only saját címkénél nincs melléknév-összeállítás a saját oldalon", () => {
    const nounOnly = personalityNoun("OPEN", "hu")!; // „Újító"
    render(
      <InteractionSection
        simulations={marked()}
        selfLabel={nounOnly}
        selfGlyph={{ primaryCode: "OPEN", secondaryCode: "TEMP", intensity: 4 }}
      />,
    );

    const composition = [
      personalityAdjective("TEMP", "hu"),
      personalityNoun("OPEN", "hu"),
    ].join(" + "); // „Energikus + Újító"
    expect(screen.queryByText(composition)).not.toBeInTheDocument();
    // A címke maga (főnév) természetesen látszik a saját oldalon.
    expect(screen.getAllByText(nounOnly).length).toBeGreaterThan(0);
  });

  it("teljes (melléknév+főnév) címkénél az összeállítás-sor változatlan", () => {
    render(
      <InteractionSection
        simulations={marked()}
        selfLabel={resolvePersonalityTypeLabel("OPEN", "TEMP", "hu")!}
        selfGlyph={{ primaryCode: "OPEN", secondaryCode: "TEMP", intensity: 4 }}
      />,
    );

    const composition = [
      personalityAdjective("TEMP", "hu"),
      personalityNoun("OPEN", "hu"),
    ].join(" + ");
    expect(screen.getByText(composition)).toBeInTheDocument();
  });

  it("azonos archetípusnál külön figyelmeztetés jön a közös vakfoltokról", async () => {
    const user = userEvent.setup();
    render(
      <InteractionSection
        simulations={marked()}
        selfLabel={resolvePersonalityTypeLabel("OPEN", "TEMP", "hu")!}
        selfGlyph={{ primaryCode: "OPEN", secondaryCode: "TEMP", intensity: 4 }}
      />,
    );

    // Más archetípusnál nincs jelzés…
    expect(
      screen.queryByText(hu("results.interactionSameTitle")),
    ).not.toBeInTheDocument();

    // …a sajátunkra állítva viszont igen.
    await user.click(dominantTile("OPEN"));
    await user.click(secondaryTile("TEMP"));
    expect(
      screen.getByText(hu("results.interactionSameTitle")),
    ).toBeInTheDocument();
  });

  // Szinkron-őr: a választó szókincse ugyanaz, mint amit a profil megjelenít.
  // Enélkül a felhasználónak fejben kellene leképeznie a „Nyitottság → újító"
  // párt, mert a picker dimenziót kérdez, az eredmény meg archetípust mond.
  it("a választó a PROFIL szókincsét kínálja, ábrával együtt", async () => {
    const user = userEvent.setup();
    render(<InteractionSection simulations={marked()} />);

    // Az elsődleges csoport mind a hat dimenziót kínálja, FŐNÉVVEL.
    const dominantRadios = within(dominantGroup()).getAllByRole("radio");
    expect(dominantRadios).toHaveLength(6);
    for (const radio of dominantRadios) {
      const dim = (radio as HTMLInputElement).value;
      const noun = personalityNoun(dim, "hu")!;
      expect(radio.closest("label")?.textContent).toContain(noun);
    }

    // A domináns kiválasztása után a második csoport a maradék ötöt kínálja,
    // MELLÉKNÉVVEL — ugyanazzal a szókinccsel, amiből a profil neve épül.
    await user.click(dominantTile("OPEN"));
    const secondaryRadios = within(secondaryGroup()).getAllByRole("radio");
    expect(secondaryRadios).toHaveLength(5);
    for (const radio of secondaryRadios) {
      const dim = (radio as HTMLInputElement).value;
      expect(dim).not.toBe("OPEN");
      const adjective = personalityAdjective(dim, "hu")!;
      expect(radio.closest("label")?.textContent).toContain(adjective);
    }

    await user.click(secondaryTile("TEMP"));
    const expected = resolvePersonalityTypeLabel("OPEN", "TEMP", "hu")!;
    expect(expected).toBe("Energikus újító");
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("a páros-fejléc mindkét oldalt mutatja, azonos szókinccsel", async () => {
    const user = userEvent.setup();
    const sims = marked();
    // A saját címke ugyanabból a forrásból jön, mint a profil fejléce.
    const self = resolvePersonalityTypeLabel("THOR", "ADAP", "hu")!;
    expect(self).toBe("Együttműködő rendszerépítő");

    render(
      <InteractionSection
        simulations={sims}
        selfLabel={self}
        selfGlyph={{ primaryCode: "THOR", secondaryCode: "ADAP", intensity: 3 }}
      />,
    );

    await user.click(dominantTile("OPEN"));
    await user.click(secondaryTile("TEMP"));

    // Két oldal, mindkettő a saját címkéjével és eyebrow-jával.
    expect(screen.getByText(self)).toBeInTheDocument();
    expect(screen.getByText("Energikus újító")).toBeInTheDocument();
    expect(screen.getByText(hu("results.interactionPairYou"))).toBeInTheDocument();
    expect(screen.getByText(hu("results.interactionPairOther"))).toBeInTheDocument();
  });

  it("a másik oldal kiírja, melyik választás melyik szótagot adja", async () => {
    // Ez a szekció lényege: a felhasználó a profilján KÉSZ nevet lát, itt
    // viszont két dimenziót választ. A névösszeállítás kiírása nélkül úgy
    // tűnik, mintha más nevezéktan lenne a két felületen.
    const user = userEvent.setup();
    render(<InteractionSection simulations={marked()} />);

    await user.click(dominantTile("OPEN"));
    await user.click(secondaryTile("TEMP"));

    const adjective = personalityAdjective("TEMP", "hu")!;
    const noun = personalityNoun("OPEN", "hu")!;
    expect(screen.getByText(`${adjective} + ${noun}`)).toBeInTheDocument();
    // …és a kettőből összeálló név is ott van.
    expect(screen.getByText("Energikus újító")).toBeInTheDocument();
  });

  it("saját címke nélkül csak a választott típus oldala jelenik meg", () => {
    const sims = marked();
    render(<InteractionSection simulations={sims} />);
    const initial = sims.find((sim) => !sim.sparse)!;

    expect(screen.getByText(initial.label)).toBeInTheDocument();
    expect(screen.queryByText(hu("results.interactionPairYou"))).toBeNull();
  });

  it("lapos profilnál a sparse üzenet jön, nem üres blokkok", () => {
    render(<InteractionSection simulations={flat()} />);

    expect(
      screen.getByText(hu("results.interactionSparse")),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(hu("results.interactionDiscuss")),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(hu("results.interactionEasy")),
    ).not.toBeInTheDocument();
  });
});
