/**
 * InteractionSection client integration tests (Vitest + RTL)
 *
 * Az F3 szekció viselkedése valódi motor-kimeneten: a szimulációkat a
 * `buildArchetypeSimulations` állítja elő, tehát a teszt a teljes láncot
 * hajtja (motor → nézet-modell → felület), nem kézzel gyártott fixture-t.
 */

import { render, screen } from "@testing-library/react";
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

    const dominantSelect = screen.getByLabelText(
      hu("results.interactionPickDominant"),
    );
    await user.selectOptions(dominantSelect, "THOR");

    const secondarySelect = screen.getByLabelText(
      hu("results.interactionPickSecondary"),
    );
    await user.selectOptions(secondarySelect, "INTE");

    const expected = sims.find((sim) => sim.key === "THOR-INTE")!;
    expect(screen.getByText(expected.label)).toBeInTheDocument();
  });

  it("a második dimenzió sosem eshet egybe az elsővel", async () => {
    const user = userEvent.setup();
    render(<InteractionSection simulations={marked()} />);

    const dominantSelect = screen.getByLabelText(
      hu("results.interactionPickDominant"),
    ) as HTMLSelectElement;
    const secondarySelect = screen.getByLabelText(
      hu("results.interactionPickSecondary"),
    ) as HTMLSelectElement;

    await user.selectOptions(secondarySelect, "ADAP");
    expect(secondarySelect.value).toBe("ADAP");

    // A domináns ráállítása ugyanarra a dimenzióra: a másodiknak el kell lépnie.
    await user.selectOptions(dominantSelect, "ADAP");
    expect(dominantSelect.value).toBe("ADAP");
    expect(secondarySelect.value).not.toBe("ADAP");

    // És a második listájából egészen el is tűnik a domináns dimenzió.
    const secondaryValues = [...secondarySelect.options].map((o) => o.value);
    expect(secondaryValues).not.toContain("ADAP");
    expect(secondaryValues).toHaveLength(5);
    // A kiválasztott pár mindig feloldható egy létező archetípusra.
    expect(
      marked().some(
        (sim) => sim.key === `${dominantSelect.value}-${secondarySelect.value}`,
      ),
    ).toBe(true);
  });

  it("a vezető-mód kapcsoló mutatja és elrejti a vezetői blokkot", async () => {
    const user = userEvent.setup();
    const sims = marked();
    render(<InteractionSection simulations={sims} />);

    const initial = sims.find((sim) => !sim.sparse)!;
    expect(initial.leaderNotes.length).toBeGreaterThan(0);

    // Alapból rejtve.
    expect(
      screen.queryByText(hu("results.interactionLeaderTitle")),
    ).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", {
      name: hu("results.interactionLeaderToggle"),
    });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText(hu("results.interactionLeaderTitle")),
    ).toBeInTheDocument();
    expect(screen.getByText(initial.leaderNotes[0].text)).toBeInTheDocument();

    await user.click(toggle);
    expect(
      screen.queryByText(hu("results.interactionLeaderTitle")),
    ).not.toBeInTheDocument();
  });

  // Szinkron-őr: a választó szókincse ugyanaz, mint amit a profil megjelenít.
  // Enélkül a felhasználónak fejben kellene leképeznie a „Nyitottság → újító"
  // párt, mert a picker dimenziót kérdez, az eredmény meg archetípust mond.
  it("a választó a PROFIL szókincsét kínálja, nem nyers dimenzió-nevet", async () => {
    const user = userEvent.setup();
    render(<InteractionSection simulations={marked()} />);

    const dominantSelect = screen.getByLabelText(
      hu("results.interactionPickDominant"),
    ) as HTMLSelectElement;
    const secondarySelect = screen.getByLabelText(
      hu("results.interactionPickSecondary"),
    ) as HTMLSelectElement;

    // A domináns listája FŐNEVEKET kínál, a második MELLÉKNEVEKET.
    for (const option of dominantSelect.options) {
      const noun = personalityNoun(option.value, "hu")!;
      expect(option.text.startsWith(noun)).toBe(true);
    }
    for (const option of secondarySelect.options) {
      const adjective = personalityAdjective(option.value, "hu")!;
      expect(option.text.startsWith(adjective)).toBe(true);
    }

    // És a kettő tényleg összeáll a profilnál használt címkére.
    await user.selectOptions(dominantSelect, "OPEN");
    await user.selectOptions(secondarySelect, "TEMP");
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

    await user.selectOptions(
      screen.getByLabelText(hu("results.interactionPickDominant")),
      "OPEN",
    );
    await user.selectOptions(
      screen.getByLabelText(hu("results.interactionPickSecondary")),
      "TEMP",
    );

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

    await user.selectOptions(
      screen.getByLabelText(hu("results.interactionPickDominant")),
      "OPEN",
    );
    await user.selectOptions(
      screen.getByLabelText(hu("results.interactionPickSecondary")),
      "TEMP",
    );

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
