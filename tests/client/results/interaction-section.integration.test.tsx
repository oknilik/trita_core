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
import { HEXACO_DIMENSIONS } from "@/lib/hexaco";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

const MARKED_PROFILE = {
  H: 72,
  E: 40,
  X: 30,
  A: 78,
  C: 88,
  O: 35,
};
const FLAT_PROFILE = {
  H: 50,
  E: 50,
  X: 50,
  A: 50,
  C: 50,
  O: 50,
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

  it("rétegzetten indul: előbb csak az első választás látszik", () => {
    render(<InteractionSection simulations={marked()} />);

    expect(dominantGroup()).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: hu("results.interactionPickSecondary") })).not.toBeInTheDocument();
    expect(screen.queryByText(hu("results.interactionDiscuss"))).not.toBeInTheDocument();
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

    await user.click(dominantTile("C"));
    await user.click(secondaryTile("H"));

    const expected = sims.find((sim) => sim.key === "C-H")!;
    expect(screen.getByText(expected.label)).toBeInTheDocument();
  });

  it("a második dimenzió sosem eshet egybe az elsővel", async () => {
    const user = userEvent.setup();
    render(<InteractionSection simulations={marked()} />);

    await user.click(dominantTile("C"));
    await user.click(secondaryTile("A"));
    expect(secondaryTile("A").checked).toBe(true);

    // A domináns ráállítása ugyanarra a dimenzióra: a második csempe eltűnik
    // a listából, és a kiválasztás átlép egy másikra.
    await user.click(dominantTile("A"));
    expect(dominantTile("A").checked).toBe(true);

    const secondaryRadios = within(secondaryGroup()).getAllByRole("radio");
    expect(secondaryRadios).toHaveLength(5);
    expect(secondaryRadios.map((radio) => (radio as HTMLInputElement).value)).not.toContain(
      "A",
    );

    expect(secondaryRadios.some((radio) => (radio as HTMLInputElement).checked)).toBe(false);
    expect(screen.queryByText(hu("results.interactionDiscuss"))).not.toBeInTheDocument();
  });

  it("a kapcsolat-választó mindhárom irányt kínálja, a valódi páros nézettel azonos kontrollal", async () => {
    const user = userEvent.setup();
    const sims = marked();
    render(<InteractionSection simulations={sims} />);

    const initial = sims.find((sim) => !sim.sparse)!;
    expect(initial.leaderNotesOther.length).toBeGreaterThan(0);
    expect(initial.leaderNotesSelf.length).toBeGreaterThan(0);
    await user.click(dominantTile(initial.dominant));
    await user.click(secondaryTile(initial.secondary));

    const trigger = screen.getByRole("button", {
      name: new RegExp(hu("results.compareRelationLabel")),
    });
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");

    // Alapból egyenrangú viszony — a vezetői blokk rejtve.
    expect(
      screen.queryByText(hu("results.interactionLeaderTitle")),
    ).not.toBeInTheDocument();

    // „A karakter vezet engem" irány.
    await user.click(trigger);
    await user.click(
      screen.getByRole("option", {
        name: t("results.compareRelationOtherLeads", "hu").replace(
          "{name}",
          initial.label,
        ),
      }),
    );
    expect(
      screen.getByText(hu("results.interactionLeaderTitle")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(initial.leaderNotesOther[0].text),
    ).toBeInTheDocument();

    // „Én vezetem őt" irány — ez a karakter-úton korábban NEM létezett.
    await user.click(
      screen.getByRole("button", {
        name: new RegExp(hu("results.compareRelationLabel")),
      }),
    );
    await user.click(
      screen.getByRole("option", {
        name: t("results.compareRelationSelfLeadsNamed", "hu").replace(
          "{name}",
          initial.label,
        ),
      }),
    );
    expect(
      screen.getByText(initial.leaderNotesSelf[0].text),
    ).toBeInTheDocument();

    // Vissza egyenrangúra: a blokk eltűnik.
    await user.click(
      screen.getByRole("button", {
        name: new RegExp(hu("results.compareRelationLabel")),
      }),
    );
    await user.click(
      screen.getByRole("option", { name: hu("results.compareRelationPeer") }),
    );
    expect(
      screen.queryByText(hu("results.interactionLeaderTitle")),
    ).not.toBeInTheDocument();
  });

  it("a tartalom előtt kimondja, hogy a karakter csak két dimenzióról állít valamit", async () => {
    const user = userEvent.setup();
    const sims = marked();
    render(<InteractionSection simulations={sims} />);

    const initial = sims.find((sim) => !sim.sparse)!;
    await user.click(dominantTile(initial.dominant));
    await user.click(secondaryTile(initial.secondary));

    // A korlát a motor bemenetéből jön (a prototípus négy dimenziót a
    // középvonalra tesz), ezért a felületnek ki kell mondania — különben a
    // valódi úthoz képesti eltérés hibának látszik.
    const dims = [initial.dominant, initial.secondary].map(
      (dim) => HEXACO_DIMENSIONS[dim].hu,
    );
    expect(
      screen.getByText(
        t("results.interactionTypeScopeNote", "hu").replace(
          "{dims}",
          dims.join(" · "),
        ),
      ),
    ).toBeInTheDocument();

    // A módszertani jegyzet nem ismétli meg ugyanezt: az a lap alján áll.
    expect(
      screen.getByText(hu("results.interactionSourceNote")),
    ).toBeInTheDocument();
  });

  // S3-hedge (motor-audit v4, FIX 5): főnév-only saját címkénél (a top-pár
  // sorrendje a mérési hibán belül) a „Melléknév + Főnév" összeállítás-sor
  // nem állíthatja a második dimenziót — a sor elmarad.
  it("főnév-only saját címkénél nincs melléknév-összeállítás a saját oldalon", async () => {
    const user = userEvent.setup();
    const nounOnly = personalityNoun("O", "hu")!; // „Újító"
    render(
      <InteractionSection
        simulations={marked()}
        selfLabel={nounOnly}
        selfGlyph={{ primaryCode: "O", secondaryCode: "X", intensity: 4 }}
      />,
    );
    await user.click(dominantTile("O"));
    await user.click(secondaryTile("X"));

    const composition = [
      personalityAdjective("X", "hu"),
      personalityNoun("O", "hu"),
    ].join(" + "); // „Energikus + Újító"
    const ownSide = screen.getByText(hu("results.interactionPairYou")).parentElement!.parentElement!;
    expect(within(ownSide).queryByText(composition)).not.toBeInTheDocument();
    // A címke maga (főnév) természetesen látszik a saját oldalon.
    expect(screen.getAllByText(nounOnly).length).toBeGreaterThan(0);
  });

  it("teljes (melléknév+főnév) címkénél az összeállítás-sor változatlan", async () => {
    const user = userEvent.setup();
    render(
      <InteractionSection
        simulations={marked()}
        selfLabel={resolvePersonalityTypeLabel("O", "X", "hu")!}
        selfGlyph={{ primaryCode: "O", secondaryCode: "X", intensity: 4 }}
      />,
    );
    await user.click(dominantTile("O"));
    await user.click(secondaryTile("X"));

    const composition = [
      personalityAdjective("X", "hu"),
      personalityNoun("O", "hu"),
    ].join(" + ");
    const ownSide = screen.getByText(hu("results.interactionPairYou")).parentElement!.parentElement!;
    expect(within(ownSide).getByText(composition)).toBeInTheDocument();
  });

  it("azonos archetípusnál külön figyelmeztetés jön a közös vakfoltokról", async () => {
    const user = userEvent.setup();
    render(
      <InteractionSection
        simulations={marked()}
        selfLabel={resolvePersonalityTypeLabel("O", "X", "hu")!}
        selfGlyph={{ primaryCode: "O", secondaryCode: "X", intensity: 4 }}
      />,
    );

    // Más archetípusnál nincs jelzés…
    expect(
      screen.queryByText(hu("results.interactionSameTitle")),
    ).not.toBeInTheDocument();

    // …a sajátunkra állítva viszont igen.
    await user.click(dominantTile("O"));
    await user.click(secondaryTile("X"));
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
    await user.click(dominantTile("O"));
    const secondaryRadios = within(secondaryGroup()).getAllByRole("radio");
    expect(secondaryRadios).toHaveLength(5);
    for (const radio of secondaryRadios) {
      const dim = (radio as HTMLInputElement).value;
      expect(dim).not.toBe("O");
      const adjective = personalityAdjective(dim, "hu")!;
      expect(radio.closest("label")?.textContent).toContain(adjective);
    }

    await user.click(secondaryTile("X"));
    const expected = resolvePersonalityTypeLabel("O", "X", "hu")!;
    expect(expected).toBe("Energikus újító");
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("a páros-fejléc mindkét oldalt mutatja, azonos szókinccsel", async () => {
    const user = userEvent.setup();
    const sims = marked();
    // A saját címke ugyanabból a forrásból jön, mint a profil fejléce.
    const self = resolvePersonalityTypeLabel("C", "A", "hu")!;
    expect(self).toBe("Együttműködő rendszerépítő");

    render(
      <InteractionSection
        simulations={sims}
        selfLabel={self}
        selfGlyph={{ primaryCode: "C", secondaryCode: "A", intensity: 3 }}
      />,
    );

    await user.click(dominantTile("O"));
    await user.click(secondaryTile("X"));

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

    await user.click(dominantTile("O"));
    await user.click(secondaryTile("X"));

    const adjective = personalityAdjective("X", "hu")!;
    const noun = personalityNoun("O", "hu")!;
    expect(screen.getByText(`${adjective} + ${noun}`)).toBeInTheDocument();
    // …és a kettőből összeálló név is ott van.
    expect(screen.getByText("Energikus újító")).toBeInTheDocument();
  });

  it("saját címke nélkül csak a választott típus oldala jelenik meg", async () => {
    const user = userEvent.setup();
    const sims = marked();
    render(<InteractionSection simulations={sims} />);
    const initial = sims.find((sim) => !sim.sparse)!;
    await user.click(dominantTile(initial.dominant));
    await user.click(secondaryTile(initial.secondary));

    expect(screen.getByText(initial.label)).toBeInTheDocument();
    expect(screen.queryByText(hu("results.interactionPairYou"))).toBeNull();
  });

  it("lapos profilnál a sparse üzenet jön, nem üres blokkok", async () => {
    const user = userEvent.setup();
    const sims = flat();
    render(<InteractionSection simulations={sims} />);
    const initial = sims[0];
    await user.click(dominantTile(initial.dominant));
    await user.click(secondaryTile(initial.secondary));

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
