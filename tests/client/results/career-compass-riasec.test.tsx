/**
 * CareerCompass — a mért Holland-kód nem kérdezhető újra (Vitest + RTL)
 *
 * A kérdőív a wizard leghosszabb lépése, és az eredménye a profilon marad
 * (`careerBackground.riasecScores`). Ha a felhasználó újrafuttatja a karrier-
 * folyamatot, a lépésnek KI kell maradnia — csak a teljes újrakezdés (DELETE)
 * hozza vissza.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CareerCompass } from "@/components/results/CareerCompass";
import { t, tf } from "@/lib/i18n";
import type { CareerBackground } from "@/lib/industry-fit";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

// `status` nélkül: a részleges háttér a wizardot a belépőről indítja
// (a teljes háttér egyből az eredmény-nézetre ugrana).
const PARTIAL_BACKGROUND = {
  eduLevel: null,
  eduField: null,
  ageBand: null,
  currentIndustry: null,
  interests: [],
} as unknown as CareerBackground;

const MEASURED = { R: 60, I: 75, A: 66, S: 42, E: 48, C: 64 };

const questionChip = (count: number) =>
  tf("results.ccIntroMetaQuestions", "hu", { count });

describe("CareerCompass — mért Holland-kód", () => {
  it("mért kód nélkül a kérdőív a lépéssor része", () => {
    // A wizard belépője kiírja, hány kérdés jön — ez a `flow` hossza.
    render(<CareerCompass hasSelfResult />);
    expect(screen.getByText(questionChip(9), { exact: false })).toBeInTheDocument();
  });

  it("mért kóddal eggyel rövidebb a lépéssor", () => {
    render(
      <CareerCompass
        hasSelfResult
        initialBackground={{ ...PARTIAL_BACKGROUND, riasecScores: MEASURED }}
      />,
    );
    expect(screen.getByText(questionChip(8), { exact: false })).toBeInTheDocument();
  });

  it("mért kóddal a vétó után rögtön a preferencia-lépés jön", async () => {
    const user = userEvent.setup();
    render(
      <CareerCompass
        hasSelfResult
        initialBackground={{ ...PARTIAL_BACKGROUND, riasecScores: MEASURED }}
      />,
    );

    await user.click(screen.getByRole("button", { name: t("results.ccStart", "hu") }));

    // Végigkattintjuk a lépéseket a vétóig; a kérdőív-lépés fejléce sehol
    // nem jelenhet meg.
    for (let i = 0; i < 6; i++) {
      const next = screen.queryByRole("button", { name: t("results.ccNext", "hu") });
      if (!next) break;
      await user.click(next);
      expect(
        screen.queryByText(t("results.ccStepRiasec", "hu")),
      ).not.toBeInTheDocument();
    }
  });

  it("a belépő jelzi, ha a kérdőív már megvan", () => {
    render(
      <CareerCompass
        hasSelfResult
        initialBackground={{ ...PARTIAL_BACKGROUND, riasecScores: MEASURED }}
      />,
    );
    expect(
      screen.getByText(t("results.ccIntroRiasecDone", "hu"), { exact: false }),
    ).toBeInTheDocument();
  });
});
