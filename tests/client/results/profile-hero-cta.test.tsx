/**
 * ProfileHero client tests (Vitest + RTL) — motor-audit v6, M7.
 *
 * A self-hero elsődleges CTA-ja (PDF letöltés) korábban a brand-bronz
 * (#c17f4a) töltést kapta, ami a sötét zsálya-gradiensen ~2,7:1 — a gomb
 * beleolvadt a heróba. A működő herók (team/org/candidate) mintája: VILÁGOS
 * töltés + sötét `text-on-accent` felirat. A teszt a token-párost őrzi
 * (inline style-ban él, hogy a variant-osztályokkal ne legyen kaszkád-verseny).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileHero } from "@/components/results/ProfileHero";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

const GLYPH_DIMS = [
  { code: "INTE", score: 55 },
  { code: "RESO", score: 50 },
  { code: "TEMP", score: 45 },
  { code: "ADAP", score: 30 },
  { code: "THOR", score: 74 },
  { code: "OPEN", score: 90 },
];

describe("ProfileHero — elsődleges CTA a sötét herón", () => {
  it("a PDF-gomb világos akcent-töltést és sötét on-accent feliratot kap", () => {
    render(
      <ProfileHero
        userName="Teszt Anna"
        completedAt="2026. augusztus 1."
        personalityType="Módszeres újító"
        glyphDimensions={GLYPH_DIMS}
        insight="Lendületet adsz a környezetednek."
        onShare={vi.fn()}
        onDownloadPdf={vi.fn()}
      />,
    );

    const pdfButton = screen.getByRole("button", { name: /PDF letöltés/ });
    const style = pdfButton.getAttribute("style") ?? "";
    // Világos bronz töltés (mindkét színsémában világos marad)…
    expect(style).toContain("--color-accent-primary-soft");
    // …sötét, akcent-háttérre szánt felirat.
    expect(style).toContain("--color-text-on-accent");
    // A régi, hеróba olvadó brand-bronz töltés nem térhet vissza.
    expect(style).not.toContain("#c17f4a");
  });
});
