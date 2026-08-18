/**
 * TryTeaserCard client tests (Vitest + RTL)
 *
 * A vendég-teszt záróoldali eredmény-ízelítője: típusnév, a két legerősebb
 * dimenzió chipje (HEXACO-betű + címke + pontszám), és az "ízelítő"
 * keretezés — pontszám-listát vagy teljes riport-tartalmat NEM mutat.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TryTeaserCard } from "@/app/(app)/try/complete/TryTeaserCard";

const TOP_DIMS = [
  { code: "X", letter: "X", label: "Extraverzió", score: 88 },
  { code: "O", letter: "O", label: "Nyitottság", score: 63 },
];

describe("TryTeaserCard", () => {
  it("a típusnevet, a dimenzió-chipeket és az ízelítő-keretezést rendereli (hu)", () => {
    render(
      <TryTeaserCard
        typeLabel="Kísérletező hajtóerő"
        primaryCode="X"
        secondaryCode="O"
        intensity={5}
        dimensionLabel="Extraverzió × Nyitottság"
        topDims={TOP_DIMS}
        locale="hu"
      />,
    );

    const card = screen.getByTestId("try-teaser-card");
    expect(card).toHaveTextContent("Ízelítő az eredményedből");
    // a hero-glyph vésett felirata nagybetűsít — kis-nagybetű-független ellenőrzés
    expect(card).toHaveTextContent(/kísérletező hajtóerő/i);
    expect(card).toHaveTextContent("A legmagasabb pontszámaid");
    expect(card).toHaveTextContent("Extraverzió");
    expect(card).toHaveTextContent("88%");
    expect(card).toHaveTextContent("Nyitottság");
    expect(card).toHaveTextContent("63%");
    expect(card).toHaveTextContent(/teljes riport/i);
  });

  it("angol locale-lal angol kulcs-szövegeket ad", () => {
    render(
      <TryTeaserCard
        typeLabel="Inventive Driving Force"
        primaryCode="X"
        secondaryCode="O"
        intensity={4}
        dimensionLabel="Extraversion × Openness"
        topDims={[
          { code: "X", letter: "X", label: "Extraversion", score: 88 },
          { code: "O", letter: "O", label: "Openness", score: 63 },
        ]}
        locale="en"
      />,
    );

    const card = screen.getByTestId("try-teaser-card");
    expect(card).toHaveTextContent("A taste of your result");
    expect(card).toHaveTextContent("Your highest scores");
    expect(card).toHaveTextContent(/inventive driving force/i);
  });
});
