/**
 * CareerCompass belépő-képernyő (Vitest + RTL)
 *
 * A karrier-iránytű 2026-07-31 óta önálló oldal (`/career`), ahová olyan
 * felhasználó is beléphet, akinek még nincs kitöltött személyiségprofilja.
 * A modul BEMENETE a profil, ezért ilyenkor a belépő gomb a kitöltésre visz —
 * nem külön üzenőképernyő, hanem más cél és felirat ugyanazon a hero-n.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CareerCompass } from "@/components/results/CareerCompass";
import { t } from "@/lib/i18n";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

describe("CareerCompass belépő", () => {
  it("profil nélkül a személyiségteszt kitöltésére visz", () => {
    render(<CareerCompass hasSelfResult={false} />);

    const cta = screen.getByRole("link", {
      name: t("results.ccNeedsProfileCta", "hu"),
    });
    expect(cta).toHaveAttribute("href", "/assessment");

    // A wizard indítója ilyenkor nem jelenhet meg — különben a user
    // végigkérdezhetné magát egy olyan folyamaton, aminek a végén nincs mit
    // számolni.
    expect(
      screen.queryByRole("button", { name: t("results.ccStart", "hu") }),
    ).toBeNull();
  });

  it("kitöltött profillal a wizard indul", () => {
    render(<CareerCompass hasSelfResult />);

    expect(
      screen.getByRole("button", { name: t("results.ccStart", "hu") }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: t("results.ccNeedsProfileCta", "hu") }),
    ).toBeNull();
  });

  it("profil nélkül a mentett háttér sem ugorja át a belépőt", () => {
    // Regresszió: a `hasCompleteBackground` korábban önmagában az eredmény-
    // nézetre ugrott. Profil nélkül ott üres illeszkedés jönne.
    render(
      <CareerCompass
        hasSelfResult={false}
        initialBackground={{
          status: "working",
          eduLevel: "higher",
          eduField: null,
          ageBand: null,
          currentIndustry: null,
          interests: [],
        }}
      />,
    );

    expect(
      screen.getByRole("link", { name: t("results.ccNeedsProfileCta", "hu") }),
    ).toBeTruthy();
  });
});
