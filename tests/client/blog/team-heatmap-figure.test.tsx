import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeamHeatmapFigure } from "@/components/blog/TeamHeatmapFigure";

const DIMS = [
  { code: "H", label: "Becsületesség–Alázat" },
  { code: "C", label: "Lelkiismeretesség" },
];

function renderFigure(rows: { name: string; scores: (number | null)[] }[]) {
  return render(
    <TeamHeatmapFigure
      memberLabel="Csapattag"
      legendLabel="0 → 100 pont"
      zoneLabels={{ high: "magas", mid: "közepes", low: "alacsony" }}
      caption="Kitalált demó-adatok."
      dims={DIMS}
      rows={rows}
    />,
  );
}

describe("TeamHeatmapFigure", () => {
  it("kirajzolja a tagokat, a dimenziófejlécet, az értékeket és a zónacímkéket", () => {
    renderFigure([
      { name: "Anna", scores: [62, 78] },
      { name: "Dávid", scores: [70, 38] },
    ]);

    // Fejléc + sorok
    expect(screen.getByText("Csapattag")).toBeInTheDocument();
    expect(screen.getByText("Becsületesség–Alázat")).toBeInTheDocument();
    expect(screen.getByText("Anna")).toBeInTheDocument();
    expect(screen.getByText("Dávid")).toBeInTheDocument();

    // Minden cella közvetlenül címkézett: pontszám + zóna (az ábra a saját
    // táblázat-nézete is — szín nélkül is olvasható).
    expect(screen.getByText("62")).toBeInTheDocument();
    expect(screen.getByText("38")).toBeInTheDocument();
    expect(screen.getAllByText("magas")).toHaveLength(2); // 78 és 70
    expect(screen.getByText("közepes")).toBeInTheDocument(); // 62
    expect(screen.getByText("alacsony")).toBeInTheDocument(); // 38

    // Legend + képaláírás
    expect(screen.getByText("0 → 100 pont")).toBeInTheDocument();
    expect(screen.getByText("Kitalált demó-adatok.")).toBeInTheDocument();
  });

  it("hiányzó kitöltést üres jelzéssel mutat, nem nullaként", () => {
    renderFigure([{ name: "Bence", scores: [55, null] }]);

    expect(screen.getByText("–")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("a zónahatárok a termék hőtérképét követik (70 és 40)", () => {
    renderFigure([{ name: "Határ", scores: [70, 40] }]);

    expect(screen.getByText("magas")).toBeInTheDocument(); // 70 még magas
    expect(screen.getByText("közepes")).toBeInTheDocument(); // 40 még közepes
  });
});
